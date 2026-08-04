using Amazon.DynamoDBv2.DataModel;
using Amazon.DynamoDBv2.DocumentModel;
using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.FlightPriceStore;
using easyJet.Holidays.External.AWS.Services.FlightPrice;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using System;
using Xunit;

namespace easyJet.Holidays.External.AWS.Tests.Services.FlightPrice;

public class FlightPriceStoreServiceTests
{
    private readonly Mock<IDynamoDBContext> _mockDynamoDbContext;
    private readonly DynamoDBOperationConfig _dynamoDbConfig;

    private readonly FlightPriceStoreService _sut;

    private readonly Fixture _fixture = new();

    public FlightPriceStoreServiceTests()
    {
        _mockDynamoDbContext = new Mock<IDynamoDBContext>();
        Mock<ILogger<FlightPriceStoreService>> mockLogger = new();
        _dynamoDbConfig = new DynamoDBOperationConfig
        {
            ConsistentRead = true
        };

        _sut = new FlightPriceStoreService(_mockDynamoDbContext.Object, _dynamoDbConfig, mockLogger.Object);
    }

    [Fact]
    public async Task StorePrices_ShouldNotThrow_WhenListIsEmpty()
    {
        // Arrange
        var models = Enumerable.Empty<FlightPriceStoreModel>();

        // Act
        await _sut.StorePrices(models);

        // Assert
        _mockDynamoDbContext.Verify(m => m.CreateBatchWrite<FlightPriceStoreModel>(It.IsAny<BatchWriteConfig>()), Times.Never);
    }

    [Fact]
    public async Task StorePrices_EvictsAndPersists()
    {
        // Arrange
        const string flightKey = "someKey";
        var input = new List<FlightPriceStoreModel>()
        {
            new()
            {
                FlightKey = flightKey
            }
        };

        var searchMock = new Mock<IAsyncSearch<FlightPriceStoreModel>>();

        _mockDynamoDbContext
            .Setup(mock =>
                mock.FromQueryAsync<FlightPriceStoreModel>(
                    It.IsAny<QueryOperationConfig>(),
                    It.Is<FromQueryConfig>(arg => arg.OverrideTableName == _dynamoDbConfig.OverrideTableName))
            ).Returns(searchMock.Object);

        var id = _fixture.Create<string>();
        var updateTime = DateTime.UtcNow;

        var remainder = new List<FlightPriceStoreModel>()
        {
            new()
            {
                ID = id,
                FlightKey = flightKey,
                UpdateDateTime = updateTime
            }
        };

        searchMock.Setup(mock => mock.GetRemainingAsync(default)).ReturnsAsync(remainder);

        var deleteMock = new Mock<IBatchWrite<FlightPriceStoreModel>>();
        var updateMock = new Mock<IBatchWrite<FlightPriceStoreModel>>();
        var putMock = new Mock<IBatchWrite<FlightPriceStoreModel>>();

        _mockDynamoDbContext.SetupSequence(mock => mock.CreateBatchWrite<FlightPriceStoreModel>(It.Is<BatchWriteConfig>(arg => arg.OverrideTableName == _dynamoDbConfig.OverrideTableName)))
            .Returns(deleteMock.Object)
            .Returns(updateMock.Object)
            .Returns(putMock.Object);

        // Act
        await _sut.StorePrices(input);

        // Assert
        deleteMock.Verify(mock => mock.AddDeleteKey(id, updateTime));
        deleteMock.Verify(mock => mock.ExecuteAsync(It.IsAny<CancellationToken>()));

        updateMock.VerifyNoOtherCalls();

        putMock.Verify(
            mock =>
                mock.AddPutItems(It.Is<IEnumerable<FlightPriceStoreModel>>(arg => arg.FirstOrDefault(element => element.FlightKey == flightKey) != null))
        );
        putMock.Verify(mock => mock.ExecuteAsync(It.IsAny<CancellationToken>()));
    }

    [Fact]
    public async Task EvictFlightPrices_ShouldLogError_WhenExceptionIsThrown()
    {
        // Arrange
        var flightKey = "ABC123";

        _mockDynamoDbContext.Setup(m => m.FromQueryAsync<FlightPriceStoreModel>(
                It.IsAny<QueryOperationConfig>(),
                It.Is<FromQueryConfig>(arg => arg.OverrideTableName == _dynamoDbConfig.OverrideTableName))
        ).Throws(new Exception("Query failed"));

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => _sut.EvictFlightPrices(flightKey, false));
    }

    [Fact]
    public async Task EvictFlightPrices_WhenUpdatingAvailability_CorrectlyBuildsBothRequests()
    {
        // Arrange
        const string key = "ABC123";

        var searchMock = new Mock<IAsyncSearch<FlightPriceStoreModel>>();

        _mockDynamoDbContext
            .Setup(mock =>
                mock.FromQueryAsync<FlightPriceStoreModel>(
                    It.IsAny<QueryOperationConfig>(),
                    It.Is<FromQueryConfig>(arg => arg.OverrideTableName == _dynamoDbConfig.OverrideTableName))
            ).Returns(searchMock.Object);

        var id = _fixture.Create<string>();
        var updateTime = DateTime.UtcNow;

        var remainder = new List<FlightPriceStoreModel>()
        {
            new()
            {
                ID = id,
                FlightKey = key,
                UpdateDateTime = updateTime,
                AvailableInventory = 42
            }
        };

        searchMock.Setup(mock => mock.GetRemainingAsync(default)).ReturnsAsync(remainder);

        var deleteMock = new Mock<IBatchWrite<FlightPriceStoreModel>>();
        var updateMock = new Mock<IBatchWrite<FlightPriceStoreModel>>();

        _mockDynamoDbContext.SetupSequence(mock => mock.CreateBatchWrite<FlightPriceStoreModel>(It.Is<BatchWriteConfig>(arg => arg.OverrideTableName == _dynamoDbConfig.OverrideTableName)))
            .Returns(deleteMock.Object)
            .Returns(updateMock.Object);

        var fullModel = _fixture.Create<FlightPriceStoreModel>();
        fullModel.ID = id;
        fullModel.UpdateDateTime = updateTime;
        fullModel.AvailableInventory = 42;

        _mockDynamoDbContext.Setup(mock => mock.LoadAsync<FlightPriceStoreModel>(id, updateTime,
            It.Is<LoadConfig>(arg => arg.OverrideTableName == _dynamoDbConfig.OverrideTableName), It.IsAny<CancellationToken>())
        ).ReturnsAsync(fullModel);

        // Act
        var result = await _sut.EvictFlightPrices(key, true);
        var afterUpdate = DateTime.UtcNow;

        // Assert
        deleteMock.Verify(mock => mock.AddDeleteKey(id, updateTime));
        deleteMock.Verify(mock => mock.ExecuteAsync(It.IsAny<CancellationToken>()));


        result.Should().NotBeNullOrEmpty().And.Contain(
            element => 
                element.ID == id &&
                element.AvailableInventory == 0 &&
                element.UpdateDateTime > updateTime &&
                element.UpdateDateTime < afterUpdate
        );
    }

    [Fact]
    public async Task GetDailyItems_BuildsScanFilter_ReturnsResults()
    {
        // Arrange
        var now = DateTime.UtcNow;
        var currencies = new[] { "GBP", "EUR" };
        var values = new List<List<FlightPriceStoreModel>>()
        {
            { [new(), new(), new()] }, // 3
            { [new(), new()] } // 2
        };

        ScanFilter receivedFilterArg = null;
        var searchMock = new Mock<IAsyncSearch<FlightPriceStoreModel>>();

        searchMock.SetupSequence(mock => mock.IsDone)
            .Returns(false)
            .Returns(false)
            .Returns(true);

        searchMock.SetupSequence(mock => mock.GetNextSetAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(values[0])
            .ReturnsAsync(values[1]);

        _mockDynamoDbContext.Setup(
                mock =>
                    mock.FromScanAsync<FlightPriceStoreModel>(It.IsAny<ScanOperationConfig>(),
                        It.Is<FromScanConfig>(arg => arg.OverrideTableName == _dynamoDbConfig.OverrideTableName))
            ).Callback<ScanOperationConfig, FromScanConfig>((opCfg, _) => receivedFilterArg = opCfg.Filter)
            .Returns(searchMock.Object);

        // Act
        var result = (await _sut.GetDailyItems(now, currencies)).ToList();

        // Assert
        result.Should().NotBeNullOrEmpty();
        result.Count.Should().Be(values[0].Count + values[1].Count); // 5

        receivedFilterArg.Should().NotBeNull();
        receivedFilterArg!.ToConditions().Should()
            .ContainKey("LocalDepartureDateTime")
            .And
            .ContainKey("Currency");
    }
}