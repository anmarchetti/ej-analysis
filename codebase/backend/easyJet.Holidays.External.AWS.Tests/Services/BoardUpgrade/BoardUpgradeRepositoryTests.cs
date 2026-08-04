using Amazon.DynamoDBv2.DataModel;
using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.BoardUpgrades;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.Services.BoardUpgrade;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.Tests.Services.BoardUpgrade;

public class BoardUpgradeRepositoryTests
{
    private readonly Mock<IDynamoDBContext> _dynamoDbContextMock;
    private readonly Mock<ILogger<BoardUpgradeRepository>> _loggerMock;
    private readonly Mock<IOptions<AwsSettings>> _awsSettingsMock;
    private readonly Mock<ICacheService> _cacheServiceMock;
    private readonly Mock<IOptions<CacheSettings>> _cacheSettingsMock;
    private readonly BoardUpgradeRepository _sut;
    private readonly Fixture _fixture;
    private readonly AwsSettings _awsSettings;
    private readonly CacheSettings _cacheSettings;

    public BoardUpgradeRepositoryTests()
    {
        _fixture = new Fixture();
        
        _awsSettings = new()
        {
            Storage = new()
            {
                Tables = new()
                {
                    BoardUpgrade = "board-upgrade-table"
                }
            }
        };
        
        _cacheSettings = new CacheSettings
        {
            Buckets = new()
            {
                BoardUpgrade = "board-upgrade-cache"
            }
        };

        _dynamoDbContextMock = new Mock<IDynamoDBContext>();
        _loggerMock = new Mock<ILogger<BoardUpgradeRepository>>();
        _awsSettingsMock = new Mock<IOptions<AwsSettings>>();
        _cacheServiceMock = new Mock<ICacheService>();
        _cacheSettingsMock = new Mock<IOptions<CacheSettings>>();

        _awsSettingsMock.Setup(x => x.Value).Returns(_awsSettings);
        _cacheSettingsMock.Setup(x => x.Value).Returns(_cacheSettings);

        _sut = new BoardUpgradeRepository(
            _dynamoDbContextMock.Object,
            _loggerMock.Object,
            _awsSettingsMock.Object,
            _cacheServiceMock.Object,
            _cacheSettingsMock.Object);
    }

    [Fact]
    public async Task GetAll_ReturnsDataFromCache_WhenCacheHasData()
    {
        // Arrange
        List<string> keys = [_cacheSettings.Buckets.BoardUpgrade];
        var expectedBoardUpgrades = _fixture.CreateMany<AccommodationBoardUpgrade>().ToList();
        _cacheServiceMock.Setup(x => x.GetOrAddAsync(
                _cacheSettings.Buckets.BoardUpgrade,
                keys,
                It.IsAny<Func<Task<List<AccommodationBoardUpgrade>>>>(),
                It.IsAny<bool>()))
            .ReturnsAsync(expectedBoardUpgrades);

        // Act
        var result = await _sut.GetAll();

        // Assert
        Assert.Equal(expectedBoardUpgrades, result);
        _cacheServiceMock.Verify(x => x.GetOrAddAsync(
            _cacheSettings.Buckets.BoardUpgrade,
            keys,
            It.IsAny<Func<Task<List<AccommodationBoardUpgrade>>>>(),
            false), Times.Once);
    }

    [Fact]
    public async Task Put_DoesNothing_WhenItemsAreNull()
    {
        // Act
        await _sut.Put(null);

        // Assert
        _dynamoDbContextMock.Verify(x => x.CreateBatchWrite<AccommodationBoardUpgrade>(It.IsAny<BatchWriteConfig>()), Times.Never);
    }

    [Fact]
    public async Task Put_DoesNothing_WhenItemsAreEmpty()
    {
        // Act
        await _sut.Put(new List<AccommodationBoardUpgrade>());

        // Assert
        _dynamoDbContextMock.Verify(x => x.CreateBatchWrite<AccommodationBoardUpgrade>(It.IsAny<BatchWriteConfig>()), Times.Never);
    }

    [Fact]
    public async Task Put_LogsError_WhenExceptionOccurs()
    {
        // Arrange
        var boardUpgrades = _fixture.CreateMany<AccommodationBoardUpgrade>().ToList();
        _dynamoDbContextMock.Setup(x => x.CreateBatchWrite<AccommodationBoardUpgrade>(It.IsAny<BatchWriteConfig>()))
            .Throws(new Exception("Test exception"));

        // Act
        await _sut.Put(boardUpgrades);

        // Assert
        _loggerMock.Verify(x => x.Log(
            LogLevel.Error,
            It.IsAny<EventId>(),
            It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Failed to put:")),
            It.IsAny<Exception>(),
            It.IsAny<Func<It.IsAnyType, Exception, string>>()), 
            Times.Once);
    }

    [Fact]
    public async Task DeleteAll_LogsError_WhenExceptionOccurs()
    {
        // Arrange
        _dynamoDbContextMock.Setup(x => x.CreateBatchWrite<AccommodationBoardUpgrade>(It.IsAny<BatchWriteConfig>()))
            .Throws(new Exception("Test exception"));

        // Act
        await _sut.DeleteAll();

        // Assert
        _loggerMock.Verify(x => x.Log(
            LogLevel.Error,
            It.IsAny<EventId>(),
            It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Failed to delete all items from dynamoDb")),
            It.IsAny<Exception>(),
            It.IsAny<Func<It.IsAnyType, Exception, string>>()), 
            Times.Once);
    }
}

