using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.Services.Counter;
using easyJet.Holidays.External.AWS.Services.Customer;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using System.Globalization;
using Xunit;

namespace easyJet.Holidays.External.AWS.Tests.Services.Customer;

public class CustomerMapperServiceTests
{
    private readonly AwsSettings _awsSettings;
    private readonly Mock<IAmazonDynamoDB> _dbClient;
    private readonly Mock<IAtomicCounterService> _counterService;
    private readonly CustomerMapperService _sut;

    public CustomerMapperServiceTests()
    {
        _dbClient = new Mock<IAmazonDynamoDB>();

        var awsClient = new Mock<AwsClient>();
        awsClient.Setup(x => x.GetClient()).Returns(_dbClient.Object);

        _counterService = new Mock<IAtomicCounterService>();

        _awsSettings = new AwsSettings
        {
            Storage = new AwsSettingsStorage
            {
                Tables = new AwsSettingsStorageTables
                {
                    Users = "test-users-table"
                }
            }
        };

        _sut = new CustomerMapperService(
            awsClient.Object,
            _counterService.Object,
            Options.Create(_awsSettings),
            Mock.Of<ILogger<CustomerMapperService>>()
        );
    }

    [Fact]
    public async Task GetCustomerId_CustomerExists_ReturnsMappedId()
    {
        // Arrange
        const string memberId = "member-123";
        const decimal expectedUserId = 42m;

        _dbClient
            .Setup(x => x.GetItemAsync(
                It.Is<GetItemRequest>(r => r.TableName == _awsSettings.Storage.Tables.Users),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GetItemResponse
            {
                Item = new Dictionary<string, AttributeValue>
                {
                    { "Id", new AttributeValue { N = expectedUserId.ToString(CultureInfo.InvariantCulture) } }
                },
            });

        // Act
        var result = await _sut.GetOrCreateCustomerId(memberId);

        // Assert
        result.Should().Be(expectedUserId);
    }

    [Fact]
    public async Task GetCustomerId_CustomerDoesNotExist_CreateNew()
    {
        // Arrange
        const string memberId = "member-456";
        const decimal nextId = 99m;

        _dbClient
            .Setup(x => x.GetItemAsync(
                It.Is<GetItemRequest>(r => r.TableName == _awsSettings.Storage.Tables.Users),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GetItemResponse
            {
                Item = null // change in sdk v4
            });
        _dbClient
            .Setup(x => x.PutItemAsync(
                It.Is<PutItemRequest>(r => r.TableName == _awsSettings.Storage.Tables.Users),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PutItemResponse());

        _counterService.Setup(x => x.GetNextId("userId")).ReturnsAsync(nextId);

        // Act
        var result = await _sut.GetOrCreateCustomerId(memberId);

        // Assert
        result.Should().Be(nextId);
    }

    [Fact]
    public async Task GetCustomerId_CustomerDoesNotExistAndCantCreate_TryReadAgain()
    {
        // Arrange
        const string memberId = "member-789";
        const decimal nextId = 77m;

        _dbClient
            .SetupSequence(x => x.GetItemAsync(
                It.Is<GetItemRequest>(r => r.TableName == _awsSettings.Storage.Tables.Users),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GetItemResponse
            {
                Item = null // change in sdk v4
            })
            .ReturnsAsync(new GetItemResponse
            {
                Item = new Dictionary<string, AttributeValue>
                {
                    { "Id", new AttributeValue { N = nextId.ToString(CultureInfo.InvariantCulture) } } // item exists for second call
                },
            });

        _dbClient
            .Setup(x => x.PutItemAsync(
                It.Is<PutItemRequest>(r => r.TableName == _awsSettings.Storage.Tables.Users),
                It.IsAny<CancellationToken>()))
            .Throws(new AggregateException("Generated exception", new ConditionalCheckFailedException("Generated exc")));

        _counterService.Setup(x => x.GetNextId("userId")).ReturnsAsync(nextId);

        // Act
        var result = await _sut.GetOrCreateCustomerId(memberId);

        // Assert
        result.Should().Be(nextId);
    }

    [Fact]
    public async Task GetCustomerId_CustomerDoesNotExistAndCreateFails_Throws()
    {
        // Arrange
        const string memberId = "member-000";
        const decimal nextId = 55m;
        var expectedEx = new InvalidOperationException("Unexpected DynamoDB failure");

        _dbClient
            .Setup(x => x.GetItemAsync(
                It.Is<GetItemRequest>(r => r.TableName == _awsSettings.Storage.Tables.Users),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GetItemResponse
            {
                Item = null
            });
        _dbClient
            .Setup(x => x.PutItemAsync(
                It.Is<PutItemRequest>(r => r.TableName == _awsSettings.Storage.Tables.Users),
                It.IsAny<CancellationToken>()))
            .Throws(expectedEx);

        _counterService.Setup(x => x.GetNextId("userId")).ReturnsAsync(nextId);

        // Act
        var act = () => _sut.GetOrCreateCustomerId(memberId);

        // Assert
        (await act.Should().ThrowAsync<InvalidOperationException>())
            .Which.Should().BeSameAs(expectedEx);
    }
}