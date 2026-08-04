using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Controllers.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace easyJet.Holidays.Api.Tests.Controllers.Booking;

public class BookingCancellationControllerTests
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
            .Setup(x => x.CancelBooking(request, BookingCancellationReason.CustomerLed, null, false, false, cancellationToken))
            .ReturnsAsync(response);
        var mockAuthenticationService = new Mock<IAuthenticationService>();
        var infoCancellationServiceMock = new Mock<IInfoCancellationService>();

        var controller =
            new BookingCancellationController(bookingCancellationServiceMock.Object, infoCancellationServiceMock.Object,
                mockAuthenticationService.Object);

        // Act
        var result = await controller.CancelBookingCustomerLed(request, cancellationToken);

        // Assert
        bookingCancellationServiceMock.Verify(
            x => x.CancelBooking(request, BookingCancellationReason.CustomerLed, null, false, false, cancellationToken), Times.Once);
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnValue = Assert.IsType<CancellationResponse>(okResult.Value);
        returnValue.Should().BeEquivalentTo(response, options => options
            .Excluding(x => x.BookingRefundList)
            .Excluding(x => x.CreatedVoucherList));
    }

    [Fact]
    public async Task CancelBookingCustomerLed_WhenBookingException_ShouldReturnException()
    {
        // Arrange
        BookingCancellationRequest request = new();
        CancellationToken cancellationToken = new();
        var bookingCancellationServiceMock = new Mock<IBookingCancellationService>();
        bookingCancellationServiceMock
            .Setup(x => x.CancelBooking(request, BookingCancellationReason.CustomerLed, null, false, false, cancellationToken))
#pragma warning disable CA2201
            .Throws(() => new Exception("test"));
#pragma warning restore CA2201
        var mockAuthenticationService = new Mock<IAuthenticationService>();
        var infoCancellationServiceMock = new Mock<IInfoCancellationService>();

        var controller =
            new BookingCancellationController(bookingCancellationServiceMock.Object, infoCancellationServiceMock.Object,
                mockAuthenticationService.Object);

        // Act
        Func<Task<IActionResult>> f = async () => await controller.CancelBookingCustomerLed(request, cancellationToken);

        // Assert
        await f.Should().ThrowAsync<Exception>().Where(x => x.Message == "test");
        bookingCancellationServiceMock.Verify(
            x => x.CancelBooking(request, BookingCancellationReason.CustomerLed, null, false, false, cancellationToken), Times.Once);
    }

    [Fact]
    public async Task CancelBookingCustomerLed_WhenApiException_ShouldReturnApiException()
    {
        // Arrange
        BookingCancellationRequest request = new();
        CancellationToken cancellationToken = new();
        var bookingCancellationServiceMock = new Mock<IBookingCancellationService>();
        bookingCancellationServiceMock
            .Setup(x => x.CancelBooking(request, BookingCancellationReason.CustomerLed, null, false, false, cancellationToken))
            .Throws(() => new ApiException(new ExceptionCode()));
        var mockAuthenticationService = new Mock<IAuthenticationService>();
        var infoCancellationServiceMock = new Mock<IInfoCancellationService>();

        var controller =
            new BookingCancellationController(bookingCancellationServiceMock.Object, infoCancellationServiceMock.Object,
                mockAuthenticationService.Object);

        // Act
        Func<Task<IActionResult>> f = async () => await controller.CancelBookingCustomerLed(request, cancellationToken);

        // Assert
        await f.Should().ThrowAsync<ApiException>();
        bookingCancellationServiceMock.Verify(
            x => x.CancelBooking(request, BookingCancellationReason.CustomerLed, null, false, false, cancellationToken), Times.Once);
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
            .Setup(x => x.GetCancellationSummary(request, BookingCancellationReason.CustomerLed, null, false, false, cancellationToken))
            .ReturnsAsync(response);
        var mockAuthenticationService = new Mock<IAuthenticationService>();
        var infoCancellationServiceMock = new Mock<IInfoCancellationService>();

        var controller =
            new BookingCancellationController(bookingCancellationServiceMock.Object, infoCancellationServiceMock.Object,
                mockAuthenticationService.Object);

        // Act
        var result = await controller.CancellationSummaryCustomerLed(request, cancellationToken);

        // Assert
        bookingCancellationServiceMock.Verify(
            x => x.GetCancellationSummary(request, BookingCancellationReason.CustomerLed, null, false, false, cancellationToken),
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
            .Setup(x => x.GetCancellationSummary(request, BookingCancellationReason.CustomerLed, null, false, false, cancellationToken))
#pragma warning disable CA2201
            .Throws(() => new Exception("test"));
#pragma warning restore CA2201
        var mockAuthenticationService = new Mock<IAuthenticationService>();
        var infoCancellationServiceMock = new Mock<IInfoCancellationService>();

        var controller =
            new BookingCancellationController(bookingCancellationServiceMock.Object, infoCancellationServiceMock.Object,
                mockAuthenticationService.Object);

        // Act
        Func<Task<IActionResult>> f = async () =>
            await controller.CancellationSummaryCustomerLed(request, cancellationToken);

        // Assert
        await f.Should().ThrowAsync<Exception>().Where(x => x.Message == "test");
        bookingCancellationServiceMock.Verify(
            x => x.GetCancellationSummary(request, BookingCancellationReason.CustomerLed, null, false, false, cancellationToken),
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
            .Setup(x => x.GetCancellationSummary(request, BookingCancellationReason.CustomerLed, null, false, false, cancellationToken))
            .Throws(() => new ApiException(new ExceptionCode()));
        var mockAuthenticationService = new Mock<IAuthenticationService>();
        var infoCancellationServiceMock = new Mock<IInfoCancellationService>();

        var controller =
            new BookingCancellationController(bookingCancellationServiceMock.Object, infoCancellationServiceMock.Object,
                mockAuthenticationService.Object);

        // Act
        Func<Task<IActionResult>> f = async () =>
            await controller.CancellationSummaryCustomerLed(request, cancellationToken);

        // Assert
        await f.Should().ThrowAsync<ApiException>();
        bookingCancellationServiceMock.Verify(
            x => x.GetCancellationSummary(request, BookingCancellationReason.CustomerLed, null, false, false, cancellationToken),
            Times.Once);
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
    
    [Fact]
    public async Task CancelBookingTradeLed_WhenSendProperRequest_ShouldReturnResult()
    {
        // Arrange
        BookingCancellationRequest request = new();
        CancellationExtendedResponse response = new();
        CancellationToken cancellationToken = new();
        var bookingCancellationServiceMock = new Mock<IBookingCancellationService>();
        bookingCancellationServiceMock
            .Setup(x => x.CancelBooking(request, BookingCancellationReason.TradeLed, null, false, true, cancellationToken))
            .ReturnsAsync(response);
        var mockAuthenticationService = new Mock<IAuthenticationService>();
        var infoCancellationServiceMock = new Mock<IInfoCancellationService>();

        var controller =
            new BookingCancellationController(bookingCancellationServiceMock.Object, infoCancellationServiceMock.Object,
                mockAuthenticationService.Object);

        // Act
        var result = await controller.CancelBookingTradeLed(request, cancellationToken);

        // Assert
        bookingCancellationServiceMock.Verify(
            x => x.CancelBooking(request, BookingCancellationReason.TradeLed, null, false, true, cancellationToken), Times.Once);
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnValue = Assert.IsType<CancellationResponse>(okResult.Value);
        returnValue.Should().BeEquivalentTo(response, options => options
            .Excluding(x => x.BookingRefundList)
            .Excluding(x => x.CreatedVoucherList));
    }

    [Fact]
    public async Task CancelBookingTradeLed_WhenBookingException_ShouldReturnException()
    {
        // Arrange
        BookingCancellationRequest request = new();
        CancellationToken cancellationToken = new();
        var bookingCancellationServiceMock = new Mock<IBookingCancellationService>();
        bookingCancellationServiceMock
            .Setup(x => x.CancelBooking(request, BookingCancellationReason.TradeLed, null, false, true, cancellationToken))
#pragma warning disable CA2201
            .Throws(() => new Exception("test"));
#pragma warning restore CA2201
        var mockAuthenticationService = new Mock<IAuthenticationService>();
        var infoCancellationServiceMock = new Mock<IInfoCancellationService>();

        var controller =
            new BookingCancellationController(bookingCancellationServiceMock.Object, infoCancellationServiceMock.Object,
                mockAuthenticationService.Object);

        // Act
        Func<Task<IActionResult>> f = async () => await controller.CancelBookingTradeLed(request, cancellationToken);

        // Assert
        await f.Should().ThrowAsync<Exception>().Where(x => x.Message == "test");
        bookingCancellationServiceMock.Verify(
            x => x.CancelBooking(request, BookingCancellationReason.TradeLed, null, false, true, cancellationToken), Times.Once);
    }

    [Fact]
    public async Task CancelBookingTradeLed_WhenApiException_ShouldReturnApiException()
    {
        // Arrange
        BookingCancellationRequest request = new();
        CancellationToken cancellationToken = new();
        var bookingCancellationServiceMock = new Mock<IBookingCancellationService>();
        bookingCancellationServiceMock
            .Setup(x => x.CancelBooking(request, BookingCancellationReason.TradeLed, null, false, true, cancellationToken))
            .Throws(() => new ApiException(new ExceptionCode()));
        var mockAuthenticationService = new Mock<IAuthenticationService>();
        var infoCancellationServiceMock = new Mock<IInfoCancellationService>();

        var controller =
            new BookingCancellationController(bookingCancellationServiceMock.Object, infoCancellationServiceMock.Object,
                mockAuthenticationService.Object);

        // Act
        Func<Task<IActionResult>> f = async () => await controller.CancelBookingTradeLed(request, cancellationToken);

        // Assert
        await f.Should().ThrowAsync<ApiException>();
        bookingCancellationServiceMock.Verify(
            x => x.CancelBooking(request, BookingCancellationReason.TradeLed, null, false, true, cancellationToken), Times.Once);
    }

    [Fact]
    public async Task CancellationSummaryTradeLed_WhenSendProperRequest_ShouldReturnResult()
    {
        // Arrange
        BookingCancellationSummaryRequest request = new BookingCancellationSummaryRequest();
        CancellationSummaryResponse response = new CancellationSummaryResponse();
        CancellationToken cancellationToken = new();
        var bookingCancellationServiceMock = new Mock<IBookingCancellationService>();
        bookingCancellationServiceMock
            .Setup(x => x.GetCancellationSummary(request, BookingCancellationReason.TradeLed, null, false, true, cancellationToken))
            .ReturnsAsync(response);
        var mockAuthenticationService = new Mock<IAuthenticationService>();
        var infoCancellationServiceMock = new Mock<IInfoCancellationService>();

        var controller =
            new BookingCancellationController(bookingCancellationServiceMock.Object, infoCancellationServiceMock.Object,
                mockAuthenticationService.Object);

        // Act
        var result = await controller.CancellationSummaryTradeLed(request, cancellationToken);

        // Assert
        bookingCancellationServiceMock.Verify(
            x => x.GetCancellationSummary(request, BookingCancellationReason.TradeLed, null, false, true, cancellationToken),
            Times.Once);
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnValue = Assert.IsType<CancellationSummaryResponse>(okResult.Value);
        returnValue.Should().BeEquivalentTo(response);
    }

    [Fact]
    public async Task CancellationSummaryTradeLed_WhenException_ShouldReturnException()
    {
        // Arrange
        BookingCancellationSummaryRequest request = new();
        CancellationToken cancellationToken = new();
        var bookingCancellationServiceMock = new Mock<IBookingCancellationService>();
        bookingCancellationServiceMock
            .Setup(x => x.GetCancellationSummary(request, BookingCancellationReason.TradeLed, null, false, true, cancellationToken))
#pragma warning disable CA2201
            .Throws(() => new Exception("test"));
#pragma warning restore CA2201
        var mockAuthenticationService = new Mock<IAuthenticationService>();
        var infoCancellationServiceMock = new Mock<IInfoCancellationService>();

        var controller =
            new BookingCancellationController(bookingCancellationServiceMock.Object, infoCancellationServiceMock.Object,
                mockAuthenticationService.Object);

        // Act
        Func<Task<IActionResult>> f = async () =>
            await controller.CancellationSummaryTradeLed(request, cancellationToken);

        // Assert
        await f.Should().ThrowAsync<Exception>().Where(x => x.Message == "test");
        bookingCancellationServiceMock.Verify(
            x => x.GetCancellationSummary(request, BookingCancellationReason.TradeLed, null, false, true, cancellationToken),
            Times.Once);
    }

    [Fact]
    public async Task CancellationSummaryTradeLed_WhenApiException_ShouldReturnApiException()
    {
        // Arrange
        BookingCancellationSummaryRequest request = new();
        CancellationToken cancellationToken = new();
        var bookingCancellationServiceMock = new Mock<IBookingCancellationService>();
        bookingCancellationServiceMock
            .Setup(x => x.GetCancellationSummary(request, BookingCancellationReason.TradeLed, null, false, true, cancellationToken))
            .Throws(() => new ApiException(new ExceptionCode()));
        var mockAuthenticationService = new Mock<IAuthenticationService>();
        var infoCancellationServiceMock = new Mock<IInfoCancellationService>();

        var controller =
            new BookingCancellationController(bookingCancellationServiceMock.Object, infoCancellationServiceMock.Object,
                mockAuthenticationService.Object);

        // Act
        Func<Task<IActionResult>> f = async () =>
            await controller.CancellationSummaryTradeLed(request, cancellationToken);

        // Assert
        await f.Should().ThrowAsync<ApiException>();
        bookingCancellationServiceMock.Verify(
            x => x.GetCancellationSummary(request, BookingCancellationReason.TradeLed, null, false, true, cancellationToken),
            Times.Once);
    }
}