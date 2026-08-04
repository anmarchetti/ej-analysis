using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using AutoFixture;
using AutoFixture.AutoMoq;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.Services.Amend;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using System.Globalization;
using System.Text.Json;
using Xunit;

namespace easyJet.Holidays.External.AWS.Tests.Services.Amend
{
    public class AmendCacheServiceTests
    {
        private readonly IFixture _fixture;
        private readonly Mock<IAmazonDynamoDB> _mockDynamoDbClient;
        private readonly Mock<AwsClient> _mockAwsClient;

        private readonly AwsSettings _awsSettings;
        private readonly IOptions<AwsSettings> _awsSettingsOptions;

        private readonly AmendCacheService _sut; // System Under Test

        private const string PartitionKeyFieldName = "HashKey";
        private const string ExpirationTimeFieldName = "ExpirationTime";
        private const string ItemFieldName = "Item";

        public AmendCacheServiceTests()
        {
            // Use AutoFixture with AutoMoq to automatically generate mocks and test data
            _fixture = new Fixture().Customize(new AutoMoqCustomization());

            // Create a mock AWS DynamoDB client
            _mockDynamoDbClient = new Mock<IAmazonDynamoDB>();

            // Create a mock AwsClient that will return our mocked DynamoDB client
            _mockAwsClient = new Mock<AwsClient>();
            _mockAwsClient
                .Setup(x => x.GetDynamoDbClientWithLogging())
                .Returns(_mockDynamoDbClient.Object);

            _mockAwsClient
                .Setup(x => x.GetClient())
                .Returns(_mockDynamoDbClient.Object);

            // Generate AwsSettings with some sensible defaults
            _awsSettings = _fixture.Build<AwsSettings>()
                                   // Ensure we have a sub-object for Storage
                                   .With(x => x.Storage, new AwsSettingsStorage
                                   {
                                       Tables = new AwsSettingsStorageTables
                                       {
                                           AmendCache = "AmendCacheTable" // or any random table name
                                       }
                                   })
                                   // Ensure we have a TTL object
                                   .With(x => x.TTL, new AwsSettingsTTL
                                   {
                                       AmendCache = 300 // 5 minutes
                                   })
                                   .Create();

            // Wrap in IOptions
            _awsSettingsOptions = Options.Create(_awsSettings);

            // Create the system under test
            _sut = new AmendCacheService(
                _awsSettingsOptions,
                _mockAwsClient.Object);
        }

        #region Constructor Tests

        [Fact]
        public void Constructor_ShouldThrowArgumentNullException_WhenAwsSettingsIsNull()
        {
            // Arrange
            // awsSettings is null
            // We do have a valid mock for AwsClient, though it’s not used because constructor will fail first
            Action act = () => new AmendCacheService(null!, _mockAwsClient.Object);

            // Act & Assert
            act.Should().Throw<ArgumentNullException>()
                .WithParameterName("awsSettings");
        }

        [Fact]
        public void Constructor_ShouldNotThrow_WhenValidParametersProvided()
        {
            // Arrange + Act
            Action act = () => new AmendCacheService(_awsSettingsOptions, _mockAwsClient.Object);

            // Assert
            act.Should().NotThrow();
        }

        #endregion

        #region SetItemAsync Tests

        [Fact]
        public async Task SetItemAsync_ShouldCallPutItemAsync_WithCorrectParameters()
        {
            // Arrange
            var partitionKey = _fixture.Create<string>();
            var sortKey = _fixture.Create<string>();
            var sampleObject = _fixture.Create<SampleItem>(); // just a class for testing
            var serializedItem = JsonSerializer.Serialize(sampleObject);

            // We expect a PutItemResponse from the Dynamo client
            _mockDynamoDbClient
                .Setup(x => x.PutItemAsync(It.IsAny<PutItemRequest>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new PutItemResponse());

            // Act
            await _sut.SetItemAsync(partitionKey, sampleObject);

            // Assert
            _mockDynamoDbClient.Verify(x => x.PutItemAsync(
                It.Is<PutItemRequest>(req =>
                    req.TableName == _awsSettings.Storage.Tables.AmendCache &&
                    req.Item[PartitionKeyFieldName].S == partitionKey &&
                    req.Item[ItemFieldName].S == serializedItem &&
                    // Check that TTL is set to a valid future Unix epoch
                    long.Parse(req.Item[ExpirationTimeFieldName].N, CultureInfo.InvariantCulture) >
                        DateTimeOffset.UtcNow.ToUnixTimeSeconds()
                ),
                It.IsAny<CancellationToken>()),
                Times.Once);

            _mockDynamoDbClient.Verify(x => x.Dispose(), Times.Once);

            // Ensure no other calls were made
            _mockDynamoDbClient.VerifyNoOtherCalls();
        }

        #endregion

        #region GetItemAsync Tests

        [Fact]
        public async Task GetItemAsync_ShouldReturnNull_WhenItemDoesNotExist()
        {
            // Arrange
            var partitionKey = _fixture.Create<string>();

            // DynamoDB returns an empty item
            var response = new GetItemResponse
            {
                Item = new Dictionary<string, AttributeValue>()
            };

            _mockDynamoDbClient
                .Setup(x => x.GetItemAsync(It.IsAny<GetItemRequest>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(response);

            // Act
            var result = await _sut.GetItemAsync<SampleItem>(partitionKey);

            // Assert
            result.Should().BeNull();
            _mockDynamoDbClient.VerifyAll();
        }

        [Fact]
        public async Task GetItemAsync_ShouldReturnNull_WhenItemIsExpired()
        {
            // Arrange
            var partitionKey = _fixture.Create<string>();
            var expiredTimestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds() - 10; // in the past

            var response = new GetItemResponse
            {
                Item = new Dictionary<string, AttributeValue>
                {
                    [PartitionKeyFieldName] = new AttributeValue { S = partitionKey },
                    [ItemFieldName] = new AttributeValue { S = JsonSerializer.Serialize(_fixture.Create<SampleItem>()) },
                    // Expired
                    [ExpirationTimeFieldName] = new AttributeValue { N = expiredTimestamp.ToString(CultureInfo.InvariantCulture) }
                }
            };

            _mockDynamoDbClient
                .Setup(x => x.GetItemAsync(It.IsAny<GetItemRequest>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(response);

            // Act
            var result = await _sut.GetItemAsync<SampleItem>(partitionKey);

            // Assert
            result.Should().BeNull();
            _mockDynamoDbClient.VerifyAll();
        }

        [Fact]
        public async Task GetItemAsync_ShouldReturnDeserializedItem_WhenItemExistsAndNotExpired()
        {
            // Arrange
            var partitionKey = _fixture.Create<string>();

            var futureTimestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds() + 300; // not expired
            var sampleObject = _fixture.Create<SampleItem>();
            var serializedItem = JsonSerializer.Serialize(sampleObject);

            var response = new GetItemResponse
            {
                Item = new Dictionary<string, AttributeValue>
                {
                    [PartitionKeyFieldName] = new AttributeValue { S = partitionKey },
                    [ItemFieldName] = new AttributeValue { S = serializedItem },
                    [ExpirationTimeFieldName] = new AttributeValue { N = futureTimestamp.ToString(CultureInfo.InvariantCulture) }
                }
            };

            _mockDynamoDbClient
                .Setup(x => x.GetItemAsync(It.IsAny<GetItemRequest>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(response);

            // Act
            var result = await _sut.GetItemAsync<SampleItem>(partitionKey);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEquivalentTo(sampleObject);

            _mockDynamoDbClient.VerifyAll();
        }

        #endregion

        #region Sample Model

        /// <summary>
        /// A simple sample model class to store in the cache.
        /// </summary>
        internal class SampleItem
        {
            public Guid Id { get; set; }
            public string Name { get; set; }
        }

        #endregion
    }
}