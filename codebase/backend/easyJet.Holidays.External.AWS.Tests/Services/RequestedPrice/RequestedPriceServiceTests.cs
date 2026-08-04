using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using easyJet.Holidays.Api.Domain.Constants;
using easyJet.Holidays.Api.Domain.Data.RequestedPrice;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.Services.RequestedPrice;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.Tests.Services.RequestedPrice;

public class RequestedPriceServiceTests
{
    private readonly Mock<IAmazonDynamoDB> _dynamoDbMock;
    private readonly Mock<ILogger<RequestedPriceService>> _loggerMock;
    private readonly Mock<IMarketService> _marketServiceMock;

    private readonly RequestedPriceService _sut;

    public RequestedPriceServiceTests()
    {
        _dynamoDbMock = new Mock<IAmazonDynamoDB>();
        _loggerMock = new Mock<ILogger<RequestedPriceService>>();
        _marketServiceMock = new Mock<IMarketService>();
        Mock<ILanguageService> languageServiceMock = new();

        AwsSettings awsSettings = new()
        {
            Storage = new AwsSettingsStorage()
            {
                Tables = new AwsSettingsStorageTables()
                {
                    RequestedPrice = "requestedPriceTEST",
                }
            }
        };
        RequestedPriceTableSetting tableSettings = new()
        {
            RecordTtl = 7,
            RetryAttempts = 2,
            WaitMsBeforeReWriteUnprocessedItems = 1,
            TableName = "requestedPriceTEST"
        };

        _sut = new RequestedPriceService(
            _dynamoDbMock.Object,
            _marketServiceMock.Object,
            languageServiceMock.Object,
            _loggerMock.Object,
            Options.Create(awsSettings),
            Options.Create(tableSettings)
        );
    }

    [Fact]
    public async Task Save_HandlesFailedConversion()
    {
        // Arrange
        var testGeog = "testGeog";
        var testData = new Dictionary<string, PricesModel>()
        {
            {
                "testEntry",
                new PricesModel()
                {
                    NamedSearchPrices = new List<RequestedPriceModel>()
                    {
                        new RequestedPriceModel()
                        {
                            // omitting SearchCriteria.ID will lead to an Exception.
                        }
                    },
                    Summary = new RequestedPriceSummaryModel()
                    {
                        Geog = testGeog, // otherwise, logging the conversion error will fail.
                    }
                }
            }
        };

        // Act
        await _sut.Save(testData);

        // Assert
        _loggerMock.Verify(LoggerTestUtils.VerifyForLogLevel<RequestedPriceService>(LogLevel.Error), Times.Once);
    }

    [Fact]
    public async Task Save_HandlesFailedBatchProcessing()
    {
        // Arrange
        var testData = new Dictionary<string, PricesModel>()
        {
            {
                "testEntry",
                new PricesModel()
                {
                    Summary = new RequestedPriceSummaryModel()
                }
            },
        };
        _dynamoDbMock.Setup(
            mock =>
                mock.BatchWriteItemAsync(It.IsAny<BatchWriteItemRequest>(), default)
        ).ThrowsAsync(new InvalidOperationException());

        // Act
        await _sut.Save(testData);

        // Assert
        _loggerMock.Verify(LoggerTestUtils.VerifyForLogLevel<RequestedPriceService>(LogLevel.Error), Times.AtLeastOnce);
    }

    [Fact]
    public async Task Save_RetriesFailedBatchWrites()
    {
        // Arrange
        var testData = new Dictionary<string, PricesModel>()
        {
            {
                "testEntry",
                new PricesModel()
                {
                    Summary = new RequestedPriceSummaryModel()
                }
            },
        };

        _dynamoDbMock.SetupSequence(
            mock =>
                mock.BatchWriteItemAsync(It.IsAny<BatchWriteItemRequest>(), default)
        ).ReturnsAsync(
            new BatchWriteItemResponse()
            {
                UnprocessedItems = new Dictionary<string, List<WriteRequest>>()
                {
                    {
                        "unprocessed",
                        new List<WriteRequest>()
                        {
                            new WriteRequest(),
                            new WriteRequest(),
                            new WriteRequest(),
                        }
                    }
                }
            }
        ).ReturnsAsync(new BatchWriteItemResponse());

        // Act
        await _sut.Save(testData);

        // Assert
        _dynamoDbMock.Verify(
            mock =>
                // exactly twice, as the first batch fails while the second succeeds.
                mock.BatchWriteItemAsync(It.IsAny<BatchWriteItemRequest>(), default), Times.Exactly(2)
        );
        // Retrying is handled correctly -> no exception.
        _loggerMock.Verify(LoggerTestUtils.VerifyForLogLevel<RequestedPriceService>(LogLevel.Error), Times.Never());
    }

    [Fact]
    public async Task Save_HandlesInputCorrectly()
    {
        // Arrange
        var testData = new Dictionary<string, PricesModel>()
        {
            {
                "1",
                new PricesModel()
                {
                    Summary = new RequestedPriceSummaryModel()
                }
            },
            {
                "2",
                new PricesModel()
                {
                    Summary = new RequestedPriceSummaryModel()
                }
            },
        };

        _dynamoDbMock.Setup(
            mock =>
                mock.BatchWriteItemAsync(It.IsAny<BatchWriteItemRequest>(), default)
        ).ReturnsAsync(new BatchWriteItemResponse());

        // Act
        await _sut.Save(testData);

        // Assert
        _dynamoDbMock.Verify(
            mock =>
                mock.BatchWriteItemAsync(It.IsAny<BatchWriteItemRequest>(), default),
            Times.Once() // as chunk size is greater than 2
        );
        _loggerMock.Verify(LoggerTestUtils.VerifyForLogLevel<RequestedPriceService>(LogLevel.Error), Times.Never());
    }

    [Fact]
    public async Task DeleteOlderThan_DeletesSuccessfully()
    {
        // Arrange
        _dynamoDbMock.Setup(
            mock =>
                mock.ScanAsync(It.IsAny<ScanRequest>(), default)
        ).ReturnsAsync(new ScanResponse()
        {
            LastEvaluatedKey = null, // one iteration is sufficient.
            Items = new List<Dictionary<string, AttributeValue>>()
            {
                new Dictionary<string, AttributeValue>()
                {
                    { RequestedPriceService.Code, new AttributeValue("codeValue")},
                    { RequestedPriceService.SearchType, new AttributeValue("searchTypeValue")},
                    { RequestedPriceService.SearchDate, new AttributeValue("12345")},
                    { RequestedPriceService.MarketCodeAndLanguage, new AttributeValue($"{Market.Uk}|{Language.EnglishCode}")},
                },
            }
        });

        _dynamoDbMock.Setup(
            mock =>
                mock.BatchWriteItemAsync(It.IsAny<BatchWriteItemRequest>(), default)
        ).ReturnsAsync(new BatchWriteItemResponse());

        // Act
        await _sut.DeleteOlderThan(42, "UK|en");

        // Assert
        _dynamoDbMock.Verify(
            mock =>
                mock.BatchWriteItemAsync(It.IsAny<BatchWriteItemRequest>(), default),
            Times.Once() // as chunk size is greater than 2
        );
        _loggerMock.Verify(LoggerTestUtils.VerifyForLogLevel<RequestedPriceService>(LogLevel.Error), Times.Never());
    }

    [Fact]
    public async Task GetPrice_ConversionToGetItemRequestHandlesEmptyKeys_ReturnsEmptyList()
    {
        // Arrange
        var testData = new List<string>() { "     ", null };

        // Act
        var result = (await _sut.GetPrice(testData)).ToList();

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetPrice_NoPriceFound_ReturnsNull()
    {
        // Arrange
        var testData = new List<string>() { "ES" };

        _dynamoDbMock.Setup(
            mock =>
                mock.GetItemAsync(It.IsAny<GetItemRequest>(), default)
        ).ReturnsAsync(new GetItemResponse());

        _marketServiceMock.Setup(x => x.GetCurrentMarket()).Returns(new MarketSettings { Code = "UK" });

        // Act 
        var result = (await _sut.GetPrice(testData)).ToList();

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetPrice_LogsAndRethrowsExceptions()
    {
        // Arrange
        var testData = new List<string>() { "ES" };

        _dynamoDbMock.Setup(
            mock =>
                mock.GetItemAsync(It.IsAny<GetItemRequest>(), default)
        ).ThrowsAsync(new InvalidOperationException());

        // Act 
        Func<Task<IEnumerable<RequestedPriceSummaryModel>>> action = async () => await _sut.GetPrice(testData);

        // Assert
        var exc = await Assert.ThrowsAnyAsync<Exception>(action);
        exc.Should().NotBeNull();
        _loggerMock.Verify(LoggerTestUtils.VerifyForLogLevel<RequestedPriceService>(LogLevel.Error), Times.Once);
    }

    [Fact]
    public async Task GetPrice_ReturnsPriceSuccessfully()
    {
        // Arrange
        var code = "ES";
        var testData = new List<string>() { code };
        var dynamoMockResponse = new GetItemResponse()
        {
            Item = new Dictionary<string, AttributeValue>()
            {
                { RequestedPriceService.Code, new AttributeValue(code)}
            }
        };

        _dynamoDbMock.Setup(
            mock =>
                mock.GetItemAsync(It.IsAny<GetItemRequest>(), default)
        ).ReturnsAsync(dynamoMockResponse);

        _marketServiceMock.Setup(x => x.GetCurrentMarket()).Returns(new MarketSettings { Code = "UK" });

        // Act 
        var result = (await _sut.GetPrice(testData)).ToList();

        // Assert
        result.Should().NotBeNullOrEmpty();
        result.Count().Should().Be(dynamoMockResponse.Item.Count);
    }
}