using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Controllers.Booking;
using easyJet.Holidays.Api.Controllers.SharedServices;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace easyJet.Holidays.Api.Tests.Controllers.SharedServicesTests;

public class BookingCancellationSharedServicesControllerTests
{
    [Fact]
    public async Task CancelBookingCustomerLed_WhenSendProperRequest_ShouldReturnResult()
    {
        // Arrange
        BookingCancellationRequest request = new();
        CancellationExtendedResponse response = new();
        CancellationToken cancellationToken = new();
        var bookingCancellationServiceMock = new Mock<IBookingCancellationService>();
        bookingCancellationServiceMock
            .Setup(x => x.CancelBooking(request, BookingCancellationReason.CustomerLed, null, It.IsAny<bool>(), It.IsAny<bool>(), cancellationToken))
            .ReturnsAsync(response);

        var controller =
            new BookingCancellationSharedServicesController(bookingCancellationServiceMock.Object);

        // Act
        var result = await controller.CancelBookingCustomerLed(request, cancellationToken);

        // Assert
        bookingCancellationServiceMock.Verify(
            x => x.CancelBooking(request, BookingCancellationReason.CustomerLed, null, true, false, cancellationToken), Times.Once);
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnValue = Assert.IsType<CancellationExtendedResponse>(okResult.Value);
        returnValue.Should().BeEquivalentTo(response);
    }

    [Fact]
    public async Task CancelBookingCustomerLed_WhenBookingException_ShouldReturnException()
    {
        // Arrange
        BookingCancellationRequest request = new();
        CancellationToken cancellationToken = new();
        var bookingCancellationServiceMock = new Mock<IBookingCancellationService>();
        bookingCancellationServiceMock
            .Setup(x => x.CancelBooking(request, BookingCancellationReason.CustomerLed, null, It.IsAny<bool>(), It.IsAny<bool>(), cancellationToken))
#pragma warning disable CA2201
            .Throws(() => new Exception("test"));
#pragma warning restore CA2201

        var controller =
            new BookingCancellationSharedServicesController(bookingCancellationServiceMock.Object);

        // Act
        Func<Task<IActionResult>> f = async () => await controller.CancelBookingCustomerLed(request, cancellationToken);

        // Assert
        await f.Should().ThrowAsync<Exception>().Where(x => x.Message == "test");
        bookingCancellationServiceMock.Verify(
            x => x.CancelBooking(request, BookingCancellationReason.CustomerLed, null, true, false, cancellationToken), Times.Once);
    }

    [Fact]
    public async Task CancelBookingCustomerLed_WhenApiException_ShouldReturnApiException()
    {
        // Arrange
        BookingCancellationRequest request = new();
        CancellationToken cancellationToken = new();
        var bookingCancellationServiceMock = new Mock<IBookingCancellationService>();
        bookingCancellationServiceMock
            .Setup(x => x.CancelBooking(request, BookingCancellationReason.CustomerLed, null, It.IsAny<bool>(), It.IsAny<bool>(), cancellationToken))
            .Throws(() => new ApiException(new ExceptionCode()));

        var controller =
            new BookingCancellationSharedServicesController(bookingCancellationServiceMock.Object);

        // Act
        Func<Task<IActionResult>> f = async () => await controller.CancelBookingCustomerLed(request, cancellationToken);

        // Assert
        await f.Should().ThrowAsync<ApiException>();
        bookingCancellationServiceMock.Verify(
            x => x.CancelBooking(request, BookingCancellationReason.CustomerLed, null, true, false, cancellationToken), Times.Once);
    }

    [Fact]
    public async Task CancellationSummaryCustomerLed_WhenSendProperRequest_ShouldReturnResult()
    {
        // Arrange
        BookingCancellationSummaryRequest request = new BookingCancellationSummaryRequest();
        CancellationSummaryResponse response = new CancellationSummaryResponse();
        CancellationToken cancellationToken = new();
        var bookingCancellationServiceMock = new Mock<IBookingCancellationService>();
        bookingCancellationServiceMock
            .Setup(x => x.GetCancellationSummary(request, BookingCancellationReason.CustomerLed, null, It.IsAny<bool>(), It.IsAny<bool>(), cancellationToken))
            .ReturnsAsync(response);

        var controller =
            new BookingCancellationSharedServicesController(bookingCancellationServiceMock.Object);

        // Act
        var result = await controller.CancellationSummaryCustomerLed(request, cancellationToken);

        // Assert
        bookingCancellationServiceMock.Verify(
            x => x.GetCancellationSummary(request, BookingCancellationReason.CustomerLed, null, true, false, cancellationToken),
            Times.Once);
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnValue = Assert.IsType<CancellationSummaryResponse>(okResult.Value);
        returnValue.Should().BeEquivalentTo(response);
    }

    [Fact]
    public async Task CancellationSummaryCustomerLed_WhenException_ShouldReturnException()
    {
        // Arrange
        BookingCancellationSummaryRequest request = new();
        CancellationToken cancellationToken = new();
        var bookingCancellationServiceMock = new Mock<IBookingCancellationService>();
        bookingCancellationServiceMock
            .Setup(x => x.GetCancellationSummary(request, BookingCancellationReason.CustomerLed, It.IsAny<decimal?>(), It.IsAny<bool>(), It.IsAny<bool>(), cancellationToken))
#pragma warning disable CA2201
            .Throws(() => new Exception("test"));
#pragma warning restore CA2201

        var controller =
            new BookingCancellationSharedServicesController(bookingCancellationServiceMock.Object);

        // Act
        Func<Task<IActionResult>> f = async () =>
            await controller.CancellationSummaryCustomerLed(request, cancellationToken);

        // Assert
        await f.Should().ThrowAsync<Exception>().Where(x => x.Message == "test");
        bookingCancellationServiceMock.Verify(
            x => x.GetCancellationSummary(request, BookingCancellationReason.CustomerLed, null, true, false, cancellationToken),
            Times.Once);
    }

    [Fact]
    public async Task CancellationSummaryCustomerLed_WhenApiException_ShouldReturnApiException()
    {
        // Arrange
        BookingCancellationSummaryRequest request = new();
        CancellationToken cancellationToken = new();
        var bookingCancellationServiceMock = new Mock<IBookingCancellationService>();
        bookingCancellationServiceMock
            .Setup(x => x.GetCancellationSummary(request, BookingCancellationReason.CustomerLed, It.IsAny<decimal?>(), It.IsAny<bool>(), It.IsAny<bool>(), cancellationToken))
            .Throws(() => new ApiException(new ExceptionCode()));

        var controller =
            new BookingCancellationSharedServicesController(bookingCancellationServiceMock.Object);

        // Act
        Func<Task<IActionResult>> f = async () =>
            await controller.CancellationSummaryCustomerLed(request, cancellationToken);

        // Assert
        await f.Should().ThrowAsync<ApiException>();
        bookingCancellationServiceMock.Verify(
            x => x.GetCancellationSummary(request, BookingCancellationReason.CustomerLed, null, true, false, cancellationToken),
            Times.Once);
    }

    [Fact]
    public async Task CancelBookingCustomerLedOverrideFee_WhenSendProperRequest_ShouldReturnResult()
    {
        // Arrange
        BookingCancellationWithFeeOverrideRequest request = new();
        CancellationExtendedResponse response = new();
        CancellationToken cancellationToken = new();
        var bookingCancellationServiceMock = new Mock<IBookingCancellationService>();
        bookingCancellationServiceMock
            .Setup(x => x.CancelBooking(request, BookingCancellationReason.CustomerLed, request.Fee, It.IsAny<bool>(), It.IsAny<bool>(), cancellationToken))
            .ReturnsAsync(response);

        var controller =
            new BookingCancellationSharedServicesController(bookingCancellationServiceMock.Object);

        // Act
        var result = await controller.CancelBookingCustomerLedOverrideFee(request, cancellationToken);

        // Assert
        bookingCancellationServiceMock.Verify(
            x => x.CancelBooking(request, BookingCancellationReason.CustomerLed, request.Fee, true, false, cancellationToken),
            Times.Once);
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnValue = Assert.IsType<CancellationExtendedResponse>(okResult.Value);
        returnValue.Should().BeEquivalentTo(response);
    }

    [Fact]
    public async Task CancelBookingCustomerLedOverrideFee_WhenException_ShouldReturnException()
    {
        // Arrange
        BookingCancellationWithFeeOverrideRequest request = new();
        CancellationToken cancellationToken = new();
        var bookingCancellationServiceMock = new Mock<IBookingCancellationService>();
        bookingCancellationServiceMock
            .Setup(x => x.CancelBooking(request, BookingCancellationReason.CustomerLed, request.Fee, It.IsAny<bool>(), It.IsAny<bool>(), cancellationToken))
#pragma warning disable CA2201
            .Throws(() => new Exception("test"));
#pragma warning restore CA2201

        var controller =
            new BookingCancellationSharedServicesController(bookingCancellationServiceMock.Object);

        // Act
        Func<Task<IActionResult>> f = async () =>
            await controller.CancelBookingCustomerLedOverrideFee(request, cancellationToken);

        // Assert
        await f.Should().ThrowAsync<Exception>().Where(x => x.Message == "test");
        bookingCancellationServiceMock.Verify(
            x => x.CancelBooking(request, BookingCancellationReason.CustomerLed, request.Fee, true, false, cancellationToken),
            Times.Once);
    }

    [Fact]
    public async Task CancelBookingEasyjetLed_WhenSendProperRequest_ShouldReturnResult()
    {
        // Arrange
        BookingCancellationRequest request = new();
        CancellationExtendedResponse response = new();
        CancellationToken cancellationToken = new();
        var bookingCancellationServiceMock = new Mock<IBookingCancellationService>();
        bookingCancellationServiceMock
            .Setup(x => x.CancelBooking(request, BookingCancellationReason.EasyJetLed, null, It.IsAny<bool>(), It.IsAny<bool>(), cancellationToken))
            .ReturnsAsync(response);

        var controller = new BookingCancellationSharedServicesController(bookingCancellationServiceMock.Object);

        // Act
        var result = await controller.CancelBookingEasyjetLed(request, cancellationToken);

        // Assert
        bookingCancellationServiceMock.Verify(
            x => x.CancelBooking(request, BookingCancellationReason.EasyJetLed, null, true, false, cancellationToken), Times.Once);
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnValue = Assert.IsType<CancellationExtendedResponse>(okResult.Value);
        returnValue.Should().BeEquivalentTo(response);
    }

    [Fact]
    public async Task CancellationSummaryEasyjetLed_WhenSendProperRequest_ShouldReturnResult()
    {
        // Arrange
        BookingCancellationSummaryRequest request = new();
        CancellationSummaryResponse response = new();
        CancellationToken cancellationToken = new();
        var bookingCancellationServiceMock = new Mock<IBookingCancellationService>();
        bookingCancellationServiceMock
            .Setup(x => x.GetCancellationSummary(request, BookingCancellationReason.EasyJetLed, It.IsAny<decimal?>(), It.IsAny<bool>(), It.IsAny<bool>(), cancellationToken))
            .ReturnsAsync(response);

        var controller =
            new BookingCancellationSharedServicesController(bookingCancellationServiceMock.Object);

        // Act
        var result = await controller.CancellationSummaryEasyjetLed(request, cancellationToken);

        // Assert
        bookingCancellationServiceMock.Verify(
            x => x.GetCancellationSummary(request, BookingCancellationReason.EasyJetLed, null, true, false, cancellationToken),
            Times.Once);
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnValue = Assert.IsType<CancellationSummaryResponse>(okResult.Value);
        returnValue.Should().BeEquivalentTo(response);
    }

    [Fact]
    public async Task CancelBookingTradeLed_WhenSendProperRequest_ShouldReturnResult()
    {
        // Arrange
        BookingCancellationRequest request = new();
        CancellationExtendedResponse response = new();
        CancellationToken cancellationToken = new();
        var bookingCancellationServiceMock = new Mock<IBookingCancellationService>();
        bookingCancellationServiceMock
            .Setup(x => x.CancelBooking(request, BookingCancellationReason.TradeLed, null, It.IsAny<bool>(), It.IsAny<bool>(), cancellationToken))
            .ReturnsAsync(response);

        var controller =
            new BookingCancellationSharedServicesController(bookingCancellationServiceMock.Object);

        // Act
        var result = await controller.CancelBookingTradeLed(request, cancellationToken);

        // Assert
        bookingCancellationServiceMock.Verify(
            x => x.CancelBooking(request, BookingCancellationReason.TradeLed, null, true, false, cancellationToken), Times.Once);
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnValue = Assert.IsType<CancellationExtendedResponse>(okResult.Value);
        returnValue.Should().BeEquivalentTo(response);
    }

    [Fact]
    public async Task CancellationSummaryTrade_WhenSendProperRequest_ShouldReturnResult()
    {
        // Arrange
        BookingCancellationSummaryRequest request = new();
        CancellationSummaryResponse response = new();
        CancellationToken cancellationToken = new();
        var bookingCancellationServiceMock = new Mock<IBookingCancellationService>();
        bookingCancellationServiceMock
            .Setup(x => x.GetCancellationSummary(request, BookingCancellationReason.TradeLed, It.IsAny<decimal?>(), It.IsAny<bool>(), It.IsAny<bool>(), cancellationToken))
            .ReturnsAsync(response);

        var controller =
            new BookingCancellationSharedServicesController(bookingCancellationServiceMock.Object);

        // Act
        var result = await controller.CancellationSummaryTrade(request, cancellationToken);

        // Assert
        bookingCancellationServiceMock.Verify(
            x => x.GetCancellationSummary(request, BookingCancellationReason.TradeLed, null, true, false, cancellationToken), Times.Once);
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnValue = Assert.IsType<CancellationSummaryResponse>(okResult.Value);
        returnValue.Should().BeEquivalentTo(response);
    }

    [Fact]
    public async Task GetCancellation_ShouldReturnOkResult_WhenValidRequest()
    {
        // Arrange
        var bookingReference = "ABC123";
        var marketCode = "UK";
        var language = "en";
        var expectedResponse = new InfoCancellationResponse(); // Assuming this is the type returned

        var bookingCancellationServiceMock = new Mock<IBookingCancellationService>();
        var mockAuthenticationService = new Mock<IAuthenticationService>();
        var infoCancellationServiceMock = new Mock<IInfoCancellationService>();
        infoCancellationServiceMock
            .Setup(service => service.GetInfoCancellationAsync(It.IsAny<BookingResponse>()))
            .ReturnsAsync(expectedResponse);

        var controller =
            new BookingCancellationController(bookingCancellationServiceMock.Object, infoCancellationServiceMock.Object,
                mockAuthenticationService.Object);

        // Act
        var result = await controller.GetCancellation(bookingReference, marketCode, language);

        // Assert
        result.Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().Be(expectedResponse);

        infoCancellationServiceMock.Verify(service =>
            service.GetInfoCancellationAsync(It.Is<BookingResponse>(b =>
                b.BookingReference == bookingReference &&
                b.MarketCode == marketCode &&
                b.Language == language)), Times.Once);
    }
}