using easyJet.Holidays.Api.Controllers.SharedServices;
using easyJet.Holidays.Api.Domain.Data.SharedServices.DataHub;
using easyJet.Holidays.External.DataHub.Interfaces;
using FluentAssertions;
using Moq;

namespace easyJet.Holidays.Api.Tests.Controllers.SharedServicesTests;

public class DataHubSharedServicesControllerTests
{
    private readonly DataHubSharedServicesController _sut;

    private readonly Mock<IDataHubService> datahubServiceMock = new();

    public DataHubSharedServicesControllerTests()
    {
        _sut = new DataHubSharedServicesController(
            datahubServiceMock.Object
        );
    }

    [Fact]
    public async Task SynchronizePnr_NoErrorThrown_ReturnOK()
    {
        // Arrange
        const string bookingRef = "bookingRef";
        var serviceResult = new DatahubSyncResponse { Results = new()
        {
            {bookingRef, new SyncAttempt(){Status = SyncStatus.Queued, ErrorCode = null, ErrorMessage = null}}
        }};
        datahubServiceMock
            .Setup(x => x.SynchronizeSeats(It.IsAny<DatahubSyncRequest>())).ReturnsAsync(serviceResult).Verifiable();

        var request = new DatahubSyncRequest
        {
            Reservations = [new() { ReservationId = bookingRef }]
        };

        // Act
        var response = await _sut.SynchronizeSeats(request);
        var parsedResponse = response as DatahubSyncResponse;

        // Assert
        datahubServiceMock.Verify(x => x.SynchronizeSeats(It.IsAny<DatahubSyncRequest>()), Times.Once);
        parsedResponse?.Results.Values.Count(value => value.Status == SyncStatus.Queued).Should().Be(1);
    }


    [Fact]
    public async Task SynchronizeFlightPnr_NoErrorThrown_ReturnOK()
    {
        // Arrange
        const string bookingRef = "bookingRef";
        var serviceResult = new DatahubSyncResponse
        {
            Results = new()
            {
                {bookingRef, new SyncAttempt(){Status = SyncStatus.Queued, ErrorCode = null, ErrorMessage = null}}
            }
        };
        datahubServiceMock
            .Setup(x => x.SynchronizeFlights(It.IsAny<DatahubSyncRequest>())).ReturnsAsync(serviceResult).Verifiable();

        var request = new DatahubSyncRequest
        {
            Reservations = [new() { ReservationId = bookingRef }]
        };

        // Act
        var response = await _sut.SynchronizeFlights(request);
        var parsedResponse = response as DatahubSyncResponse;

        // Assert
        datahubServiceMock.Verify(x => x.SynchronizeFlights(It.IsAny<DatahubSyncRequest>()), Times.Once);
        parsedResponse?.Results.Values.Count(value => value.Status == SyncStatus.Queued).Should().Be(1);
    }
    
    [Fact]
    public async Task SynchronizeBagsPnr_NoErrorThrown_ReturnOK()
    {
        // Arrange
        const string bookingRef = "bookingRef";
        var serviceResult = new DatahubSyncResponse
        {
            Results = new()
            {
                {bookingRef, new SyncAttempt(){Status = SyncStatus.Queued, ErrorCode = null, ErrorMessage = null}}
            }
        };
        datahubServiceMock
            .Setup(x => x.SynchronizeBags(It.IsAny<DatahubSyncRequest>())).ReturnsAsync(serviceResult).Verifiable();

        var request = new DatahubSyncRequest
        {
            Reservations = [new() { ReservationId = bookingRef }]
        };

        // Act
        var response = await _sut.SynchronizeBags(request);
        var parsedResponse = response as DatahubSyncResponse;

        // Assert
        datahubServiceMock.Verify(x => x.SynchronizeBags(It.IsAny<DatahubSyncRequest>()), Times.Once);
        parsedResponse?.Results.Values.Count(value => value.Status == SyncStatus.Queued).Should().Be(1);
    }
}