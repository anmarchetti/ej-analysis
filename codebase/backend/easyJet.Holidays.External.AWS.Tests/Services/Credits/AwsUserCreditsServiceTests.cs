using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Amazon.Util;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.Services.Credits;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.Tests.Services.Credits;

public class AwsUserCreditsServiceTests
{
    private readonly AwsSettings _awsSettings;
    private readonly Mock<IAmazonDynamoDB> _dbClient;
    private readonly AwsUserCreditsService _sut;

    public AwsUserCreditsServiceTests()
    {
        _dbClient = new Mock<IAmazonDynamoDB>();

        var awsClient = new Mock<AwsClient>();
        awsClient.Setup(x => x.GetClient()).Returns(_dbClient.Object);

        _awsSettings = new AwsSettings
        {
            Storage = new AwsSettingsStorage
            {
                Tables = new AwsSettingsStorageTables
                {
                    Credits = "Credits-Table"
                }
            }
        };

        var cacheSettings = new CacheSettings
        {
            Buckets = new Buckets
            {
                Voucherify = "Voucherify"
            },
            ExpirationSeconds = new Dictionary<string, int>
            {
                { "Voucherify", 3600 }
            }
        };

        _sut = new AwsUserCreditsService(
            Options.Create(_awsSettings),
            Options.Create(cacheSettings),
            awsClient.Object,
            Mock.Of<ILogger<AwsUserCreditsService>>()
        );
    }

    [Fact]
    public async Task GetOrUpdateUserCredits_ResultsFrom_Cache()
    {
        // Arrange
        _dbClient
            .Setup(x => x.GetItemAsync(
                It.Is<GetItemRequest>(r => r.TableName == _awsSettings.Storage.Tables.Credits),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GetItemResponse
            {
                Item = new Dictionary<string, AttributeValue>
                {
                    { "UserCredits", new AttributeValue { S = "{\"GBP\":{\"balance\":100.00,\"currency\":\"GBP\",\"hasCreditHistory\":true}}" } },
                    { "Timestamp", new AttributeValue { N = AWSSDKUtils.ConvertToUnixEpochSecondsString(DateTime.Now.AddSeconds(3600)) } },
                    { "MemberId", new AttributeValue { S = "testID" } }
                }
            });

        // Act
        var actual = await _sut.GetOrUpdateUserCredits("testID", () => Task.FromResult(BuildCredits(null)));

        // Assert
        var gbpCredits = actual.GetValueOrDefault(Currency.GBP);
        gbpCredits.Should().NotBeNull();
        gbpCredits!.Balance.Should().Be(100);
        gbpCredits.Currency.Should().Be("GBP");
    }

    [Fact]
    public async Task GetOrUpdateUserCredits_ResultsFromVoucherify_Expired()
    {
        // Arrange
        _dbClient
            .Setup(x => x.GetItemAsync(
                It.Is<GetItemRequest>(r => r.TableName == _awsSettings.Storage.Tables.Credits),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GetItemResponse
            {
                Item = new Dictionary<string, AttributeValue>
                {
                    { "UserCredits", new AttributeValue { S = "{\"GBP\":{\"balance\":100.00,\"currency\":\"GBP\",\"hasCreditHistory\":true}}" } },
                    { "Timestamp", new AttributeValue { N = AWSSDKUtils.ConvertToUnixEpochSecondsString(DateTime.Now.AddSeconds(-3600)) } },
                    { "MemberId", new AttributeValue { S = "testID" } },
                }
            });

        // Act
        var actual = await _sut.GetOrUpdateUserCredits("testID", () => Task.FromResult(BuildCredits(200)));

        // Assert
        var gbpCredits = actual.GetValueOrDefault(Currency.GBP);
        gbpCredits.Should().NotBeNull();
        gbpCredits!.Balance.Should().Be(200);
        gbpCredits.Currency.Should().Be("GBP");
    }

    [Fact]
    public async Task GetOrUpdateUserCredits_ResultsFromVoucherify_Force()
    {
        // Arrange
        _dbClient
            .Setup(x => x.GetItemAsync(
                It.Is<GetItemRequest>(r => r.TableName == _awsSettings.Storage.Tables.Credits),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GetItemResponse
            {
                Item = new Dictionary<string, AttributeValue>
                {
                    { "UserCredits", new AttributeValue { S = "{\"GBP\":{\"balance\":100.00,\"currency\":\"GBP\",\"hasCreditHistory\":true}}" } },
                    { "Timestamp", new AttributeValue { N = AWSSDKUtils.ConvertToUnixEpochSecondsString(DateTime.Now.AddSeconds(3600)) } },
                    { "MemberId", new AttributeValue { S = "testID" } },
                }
            });

        // Act
        var actual = await _sut.GetOrUpdateUserCredits("testID", () => Task.FromResult(BuildCredits(201)), true);

        // Assert
        var gbpCredits = actual.GetValueOrDefault(Currency.GBP);
        gbpCredits.Should().NotBeNull();
        gbpCredits!.Balance.Should().Be(201);
        gbpCredits.Currency.Should().Be("GBP");
    }

    [Fact]
    public async Task GetOrUpdateUserCredits_ActionReturnsNull_ThrowsCreditsNotAvailable()
    {
        // Arrange
        _dbClient
            .Setup(x => x.GetItemAsync(
                It.Is<GetItemRequest>(r => r.TableName == _awsSettings.Storage.Tables.Credits),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GetItemResponse
            {
                Item = new Dictionary<string, AttributeValue>()
            });

        // Act
        var act = () => _sut.GetOrUpdateUserCredits("testID", () => Task.FromResult<Dictionary<Currency, MyCreditInfo>>(null!));

        // Assert
        (await act.Should().ThrowAsync<ApiException>())
            .Which.Code.Should().Be(ApiExceptionCodes.VoucherFailedToGetFromCache);

        _dbClient.Verify(
            x => x.GetItemAsync(
                It.Is<GetItemRequest>(r => r.TableName == _awsSettings.Storage.Tables.Credits),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task GetOrUpdateUserCredits_Failed()
    {
        // Arrange
        _dbClient
            .Setup(x => x.GetItemAsync(
                It.Is<GetItemRequest>(r => r.TableName == _awsSettings.Storage.Tables.Credits),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Something went wrong"));

        // Act
        var act = () => _sut.GetOrUpdateUserCredits("testID", () => Task.FromResult(BuildCredits(null)));

        // Assert
        (await act.Should().ThrowAsync<ApiException>())
            .Which.Code.Should().Be(ApiExceptionCodes.VoucherFailedToGetFromCache);
    }

    [Fact]
    public async Task ClearUserCreditsInfo_Success()
    {
        // Arrange
        _dbClient
            .Setup(x => x.DeleteItemAsync(
                It.Is<DeleteItemRequest>(r => r.TableName == _awsSettings.Storage.Tables.Credits),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DeleteItemResponse());

        // Act & Assert
        var act = () => _sut.ClearUserCreditsInfo("testID");
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task ClearUserCreditsInfo_Failed()
    {
        // Arrange
        _dbClient
            .Setup(x => x.DeleteItemAsync(
                It.Is<DeleteItemRequest>(r => r.TableName == _awsSettings.Storage.Tables.Credits),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Something went wrong"));

        // Act
        var act = () => _sut.ClearUserCreditsInfo("testID");

        // Assert
        (await act.Should().ThrowAsync<ApiException>())
            .Which.Code.Should().Be(ApiExceptionCodes.VoucherFailedToClearCache);
    }

    private static Dictionary<Currency, MyCreditInfo> BuildCredits(int? poundsCredits)
    {
        var credits = new Dictionary<Currency, MyCreditInfo>();

        if (poundsCredits.HasValue)
            credits.Add(
                Currency.GBP,
                new MyCreditInfo
                {
                    Balance = poundsCredits.Value,
                    HasCreditHistory = true,
                    Currency = Currency.GBP.Code
                });

        return credits;
    }
}
