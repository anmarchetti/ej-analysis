using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using easyJet.Holidays.External.AWS.RouteFileParser.Models;
using easyJet.Holidays.External.AWS.RouteFileParser.Services;
using easyJet.Holidays.External.AWS.RouteFileParser.Settings;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.RouteFileParser.Tests.Services;

public class RouteRepositoryTests
{
    private readonly Mock<IAmazonDynamoDB> _dynamoDb;

    private readonly RouteRepository _sut;

    public RouteRepositoryTests()
    {
        _dynamoDb = new();
        Mock<ILogger<RouteRepository>> logger = new();
        LambdaSettings lambdaSettings = new();

        _sut = new(_dynamoDb.Object, logger.Object, Options.Create(lambdaSettings));
    }

    [Fact]
    public async Task DeletePreviousVersion_DeletesPreviousVersion()
    {
        // Arrange
        var tableName = "testTable";
        var version = 1;
        var pk = "testKey123";
        var request = RouteRepository.BuildScanRequest(version, tableName);
        var response = new ScanResponse()
        {
            LastEvaluatedKey = new Dictionary<string, AttributeValue>(),
            Items = new List<Dictionary<string, AttributeValue>>()
                {
                    new Dictionary<string, AttributeValue>()
                    {
                        { pk, new AttributeValue(){ S = "A" } },
                        { "version", new AttributeValue(){ S= "1" } }
                    },
                    new Dictionary<string, AttributeValue>()
                    {
                        { pk, new AttributeValue(){ S = "B" } },
                        { "version", new AttributeValue(){ S= "1" } }
                    },
                }
        };
        _dynamoDb.Setup(
            mock =>
            mock.ScanAsync(It.Is<ScanRequest>(req => req.TableName == request.TableName), It.IsAny<CancellationToken>())
        ).ReturnsAsync(response);
        _dynamoDb.Setup(
            mock =>
            mock.DeleteItemAsync(It.IsAny<DeleteItemRequest>(), It.IsAny<CancellationToken>())
        ).ReturnsAsync(new DeleteItemResponse());

        // Act
        await _sut.DeletePreviousVersion(version, tableName, pk);

        // Assert
        _dynamoDb.Verify(
            mock =>
            mock.ScanAsync(It.Is<ScanRequest>(req => req.TableName == request.TableName), It.IsAny<CancellationToken>()), Times.Once()
        );
        _dynamoDb.Verify(
            mock =>
            mock.DeleteItemAsync(It.IsAny<DeleteItemRequest>(), It.IsAny<CancellationToken>()), Times.Exactly(response.Items.Count)
        );
    }

    [Fact]
    public async Task UpdateLatestVersion_PutsNewItem_DeletesOldOnes()
    {
        // Arrange
        var version = 2;

        _dynamoDb.Setup(
            mock =>
            mock.PutItemAsync(It.IsAny<string>(), It.IsAny<Dictionary<string, AttributeValue>>(), It.IsAny<CancellationToken>())
        ).ReturnsAsync(new PutItemResponse());
        _dynamoDb.SetupSequence(
            mock =>
            mock.ScanAsync(It.IsAny<ScanRequest>(), It.IsAny<CancellationToken>())
        ).ReturnsAsync(BuildMockResponseForPk("departure"))
        .ReturnsAsync(BuildMockResponseForPk("arrival"))
        .ReturnsAsync(BuildMockResponseForPk("month"));
        _dynamoDb.Setup(
            mock =>
            mock.DeleteItemAsync(It.IsAny<DeleteItemRequest>(), It.IsAny<CancellationToken>())
        ).ReturnsAsync(new DeleteItemResponse());

        // Act
        await _sut.UpdateLatestVersion(version);

        // Assert
        // one new item gets put
        _dynamoDb.Verify(
            mock =>
            mock.PutItemAsync(It.IsAny<string>(), It.IsAny<Dictionary<string, AttributeValue>>(), It.IsAny<CancellationToken>()),
            Times.Once()
        );
        // one deletion after putting 
        _dynamoDb.Verify(
            mock =>
            mock.DeleteItemAsync(It.IsAny<string>(), It.IsAny<Dictionary<string, AttributeValue>>(), It.IsAny<CancellationToken>()),
            Times.Once()
        );
        // at least one deletion for each TO, FROM and DATES
        _dynamoDb.Verify(
            mock =>
            mock.DeleteItemAsync(It.IsAny<DeleteItemRequest>(), It.IsAny<CancellationToken>()),
            Times.AtLeast(3)
        );
        // scan once for each TO, FROM and DATES
        _dynamoDb.Verify(
            mock =>
            mock.ScanAsync(It.IsAny<ScanRequest>(), It.IsAny<CancellationToken>()),
            Times.Exactly(3)
        );
    }

    [Fact]
    public async Task GetLatestVersion_GetsLatestVersion()
    {
        // Arrange
        var version = 147;
        _dynamoDb.Setup(
            mock =>
            mock.ScanAsync(It.IsAny<ScanRequest>(), It.IsAny<CancellationToken>())
        ).ReturnsAsync(new ScanResponse()
        {
            Items = new List<Dictionary<string, AttributeValue>>()
            {
                    new Dictionary<string, AttributeValue>()
                    {
                        { "version", new AttributeValue(){ N = version.ToString() } }
                    }
            }
        });

        // Act
        var result = await _sut.GetLatestVersion();

        // Assert
        result.Should().Be(version);
    }

    [Fact]
    public async Task WriteAllMonthsAvailability_WritesCorrectly()
    {
        // Arrange
        var firstKey = "firstKey";
        var firstValue = "firstValue";
        var secondKey = "secondKey";
        var secondValue = "secondValue";
        var scheduleData = new Dictionary<string, RoutePerMarkets<string>>()
            {
                { firstKey, new RoutePerMarkets<string> { Routes = firstValue } },
                { secondKey, new RoutePerMarkets<string> { Routes = secondValue } },
            };
        var version = "147";
        _dynamoDb.Setup(
            mock =>
            mock.PutItemAsync(
                It.IsAny<string>(),
                It.IsAny<Dictionary<string, AttributeValue>>(),
                It.IsAny<CancellationToken>())
        ).ReturnsAsync(new PutItemResponse());

        // Act
        await _sut.WriteAllMonthsAvailability(scheduleData, version);

        // Assert
        _dynamoDb.Verify(
            mock =>
            mock.PutItemAsync(
                It.IsAny<string>(),
                It.Is<Dictionary<string, AttributeValue>>(
                    dict =>
                    dict["month"].S == firstKey &&
                    dict["departures"].S == firstValue &&
                    dict["version"].N == version
                ),
                It.IsAny<CancellationToken>()
            ), Times.Once()
        );
        _dynamoDb.Verify(
            mock =>
            mock.PutItemAsync(
                It.IsAny<string>(),
                It.Is<Dictionary<string, AttributeValue>>(
                    dict =>
                    dict["month"].S == secondKey &&
                    dict["departures"].S == secondValue &&
                    dict["version"].N == version
                ),
                It.IsAny<CancellationToken>()
            ), Times.Once()
        );
    }

    [Fact]
    public async Task WriteFromAvailability_WritesCorrectly()
    {
        // Arrange
        var firstKey = "firstKey";
        var firstValue = "firstValue";
        var secondKey = "secondKey";
        var secondValue = "secondValue";
        var scheduleData = new Dictionary<string, RoutePerMarkets<List<string>>>()
            {
                { firstKey,
                    new RoutePerMarkets<List<string>> {
                        Routes = new(){firstValue, firstValue }
                    }
                },
                { secondKey,
                    new RoutePerMarkets<List<string>> {
                        Routes = new(){secondValue, secondValue, secondValue }
                    }
                },
            };
        var version = "147";
        _dynamoDb.Setup(
            mock =>
            mock.PutItemAsync(
                It.IsAny<string>(),
                It.IsAny<Dictionary<string, AttributeValue>>(),
                It.IsAny<CancellationToken>())
        ).ReturnsAsync(new PutItemResponse());

        // Act
        await _sut.WriteFromAvailability(scheduleData, version);

        // Assert
        _dynamoDb.Verify(
            mock =>
            mock.PutItemAsync(
                It.IsAny<string>(),
                It.Is<Dictionary<string, AttributeValue>>(
                    dict =>
                    dict["arrival"].S == firstKey &&
                    dict["departures"].SS.Count(element => element == firstValue) == scheduleData[firstKey].Routes.Count &&
                    dict["version"].N == version
                ),
                It.IsAny<CancellationToken>()
            ), Times.Once()
        );
        _dynamoDb.Verify(
            mock =>
            mock.PutItemAsync(
                It.IsAny<string>(),
                It.Is<Dictionary<string, AttributeValue>>(
                    dict =>
                    dict["arrival"].S == secondKey &&
                    dict["departures"].SS.Count(element => element == secondValue) == scheduleData[secondKey].Routes.Count &&
                    dict["version"].N == version
                ),
                It.IsAny<CancellationToken>()
            ), Times.Once()
        );
    }

    [Fact]
    public async Task WriteToAvailability_WritesCorrectly()
    {
        // Arrange
        var firstKey = "firstKey";
        var firstValue = new List<string>() { "1", "2", "3" };
        var secondKey = "secondKey";
        var secondValue = new List<string>() { "a", "b", "c" };
        var scheduleData = new Dictionary<string, RoutePerMarkets<List<string>>>()
        {
            { firstKey, new RoutePerMarkets<List<string>> { Routes = firstValue } },
            { secondKey, new RoutePerMarkets<List<string>> { Routes = secondValue }},
        };
        var version = "147";
        _dynamoDb.Setup(
            mock =>
                mock.PutItemAsync(
                    It.IsAny<string>(),
                    It.IsAny<Dictionary<string, AttributeValue>>(),
                    It.IsAny<CancellationToken>())
        ).ReturnsAsync(new PutItemResponse());

        // Act
        await _sut.WriteToAvailability(scheduleData, version);

        // Assert
        _dynamoDb.Verify(
            mock =>
                mock.PutItemAsync(
                    It.IsAny<string>(),
                    It.Is<Dictionary<string, AttributeValue>>(
                        dict =>
                            dict["departure"].S == firstKey &&
                            dict["arrivals"].SS.Count == firstValue.Count &&
                            dict["version"].N == version
                    ),
                    It.IsAny<CancellationToken>()
                ), Times.Once()
        );
        _dynamoDb.Verify(
            mock =>
                mock.PutItemAsync(
                    It.IsAny<string>(),
                    It.Is<Dictionary<string, AttributeValue>>(
                        dict =>
                            dict["departure"].S == secondKey &&
                            dict["arrivals"].SS.Count == secondValue.Count &&
                            dict["version"].N == version
                    ),
                    It.IsAny<CancellationToken>()
                ), Times.Once()
        );
    }

    private static ScanResponse BuildMockResponseForPk(string key)
    {
        var response = new ScanResponse()
        {
            LastEvaluatedKey = new Dictionary<string, AttributeValue>(),
            Items = new List<Dictionary<string, AttributeValue>>()
            {
                new Dictionary<string, AttributeValue>()
                {
                    { key, new AttributeValue(){ S = "A" } },
                    { "version", new AttributeValue(){ S= "1" } }
                },
            }
        };
        return response;
    }
}