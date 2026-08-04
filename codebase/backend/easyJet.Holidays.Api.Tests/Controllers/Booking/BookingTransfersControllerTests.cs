using easyJet.Holidays.Api.Controllers.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Monitoring;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace easyJet.Holidays.Api.Tests.Controllers.Booking;

public class BookingTransfersControllerTests
{
    private readonly Mock<IBookingTransfersService> _bookingTransfersServiceMock;
    private readonly Mock<IMetricsService> _metricsServiceMock;
    private readonly BookingTransfersController _controller;

    public BookingTransfersControllerTests()
    {
        _bookingTransfersServiceMock = new Mock<IBookingTransfersService>();
        _metricsServiceMock = new Mock<IMetricsService>();
        _controller = new BookingTransfersController(_bookingTransfersServiceMock.Object, _metricsServiceMock.Object);
    }

    [Fact]
    public async Task GetTransferDetails_ShouldReturnOk_WhenTransferDetailsExist()
    {
        // Arrange
        var request = new GetBookingRequest
        {
            BookingReference = "123",
            LastName = "Doe",
            Date = new DateTime(2026, 10, 10)
        };
        var transferDetails = new TransferDetailsResponse { BookingReference = request.BookingReference };

        _bookingTransfersServiceMock
            .Setup(s => s.GetTransferDetailsFor(
                It.Is<GetBookingRequest>(r =>
                    r.BookingReference == request.BookingReference && r.LastName == request.LastName &&
                    r.Date == request.Date),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(transferDetails);

        // Act
        var result = await _controller.GetTransferDetails(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<TransferDetailsResponse>(okResult.Value);
        Assert.Equal(request.BookingReference, response.BookingReference);
        _metricsServiceMock.Verify(m => m.IncrementCounter(
            CancellationMetricConstants.TransferDetailsRequestTotal,
            1,
            It.Is<KeyValuePair<string, object>[]>(labels => HasStatusLabel(labels, MetricConstants.SuccessMetricStatus))), Times.Once);
    }

    [Fact]
    public async Task GetTransferDetails_ShouldReturnBadRequest_WhenBookingReferenceIsEmpty()
    {
        // Arrange
        var request = new GetBookingRequest { BookingReference = string.Empty, LastName = "Doe", Date = DateTime.UtcNow.Date };

        // Act
        var result = await _controller.GetTransferDetails(request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal("Booking reference cannot be null or empty.", badRequestResult.Value);
    }

    [Fact]
    public async Task GetTransferDetails_ShouldReturnBadRequest_WhenLastNameIsEmpty()
    {
        // Arrange
        var request = new GetBookingRequest { BookingReference = "123", LastName = string.Empty, Date = DateTime.UtcNow.Date };

        // Act
        var result = await _controller.GetTransferDetails(request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal("Lead passenger last name cannot be null or empty.", badRequestResult.Value);
    }

    [Fact]
    public async Task GetTransferDetails_ShouldReturnBadRequest_WhenDateIsDefault()
    {
        // Arrange
        var request = new GetBookingRequest { BookingReference = "123", LastName = "Doe", Date = default };

        // Act
        var result = await _controller.GetTransferDetails(request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal("Departure date is required.", badRequestResult.Value);
    }

    [Fact]
    public async Task GetTransferDetails_ShouldReturnNotFound_WhenTransferDetailsDoNotExist()
    {
        // Arrange
        var request = new GetBookingRequest { BookingReference = "123", LastName = "Doe", Date = DateTime.UtcNow.Date };

        _bookingTransfersServiceMock
            .Setup(s => s.GetTransferDetailsFor(It.IsAny<GetBookingRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TransferDetailsResponse?)null);

        // Act
        var result = await _controller.GetTransferDetails(request);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result.Result);
        Assert.Equal($"No transfer details found for booking reference: {request.BookingReference}", notFoundResult.Value);
        _metricsServiceMock.Verify(m => m.IncrementCounter(
            CancellationMetricConstants.TransferDetailsRequestTotal,
            1,
            It.Is<KeyValuePair<string, object>[]>(labels => HasStatusLabel(labels, "not_found"))), Times.Once);
    }

    [Fact]
    public async Task GetTransferDetails_ShouldIncrementFailureMetric_WhenServiceThrows()
    {
        // Arrange
        var request = new GetBookingRequest { BookingReference = "123", LastName = "Doe", Date = DateTime.UtcNow.Date };

        _bookingTransfersServiceMock
            .Setup(s => s.GetTransferDetailsFor(It.IsAny<GetBookingRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("service failure"));

        // Act
        await Assert.ThrowsAsync<InvalidOperationException>(() => _controller.GetTransferDetails(request));

        // Assert
        _metricsServiceMock.Verify(m => m.IncrementCounter(
            CancellationMetricConstants.TransferDetailsRequestTotal,
            1,
            It.Is<KeyValuePair<string, object>[]>(labels => HasStatusLabel(labels, MetricConstants.FailureMetricStatus))), Times.Once);
    }

    private static bool HasStatusLabel(KeyValuePair<string, object>[] labels, string expectedStatus)
    {
        return labels.Any(label =>
            label.Key == "status" &&
            string.Equals(label.Value.ToString(), expectedStatus, StringComparison.Ordinal));
    }
}