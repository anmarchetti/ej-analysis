#nullable enable
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Services.Booking;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking;

public class BookingTransfersServiceTests
{
    private readonly Mock<IBookingTransfersRepository> _bookingTransfersRepositoryMock;
    private readonly Mock<IBookingFetchService> _bookingFetchServiceMock;
    private readonly BookingTransfersService _service;

    public BookingTransfersServiceTests()
    {
        _bookingTransfersRepositoryMock = new Mock<IBookingTransfersRepository>();
        _bookingFetchServiceMock = new Mock<IBookingFetchService>();
        _service = new BookingTransfersService(_bookingTransfersRepositoryMock.Object, _bookingFetchServiceMock.Object);
    }

    [Fact]
    public async Task GetTransferDetailsFor_ShouldReturnTransferDetails_WhenRequestIsValid()
    {
        // Arrange
        var request = new GetBookingRequest
        {
            BookingReference = "BR123",
            LastName = "Doe",
            Date = new DateTime(2026, 3, 1)
        };
        var inboundPickupTime = new DateTimeOffset(2026, 3, 1, 14, 45, 0, TimeSpan.Zero);
        var outboundPickupTime = new DateTimeOffset(2026, 4, 13, 20, 15, 0, TimeSpan.Zero);

        var payload = new TransferDetailsPayload()
        {
            BookingReference = request.BookingReference,
            NoOfPax = 2,
            ResortId = "RESORT123",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
            Inbound = new TransferDirectionPayload
            {
                TransferType = "Private",
                Airport = "MLA",
                FlightNo = "EJ123",
                FlightArrival = DateTimeOffset.UtcNow.AddHours(1),
                FlightDeparture = DateTimeOffset.UtcNow,
                PickupTime = inboundPickupTime,
                TransferMinutes = null,
                PickupLocationDescription = "PMI Airport Terminal 1",
                PickupLatitude = 39.5517f,
                PickupLongitude = 2.7388f,
                Instructions = "For your return journey, your detailed transfer pick up information and time will be available on our portal 24 hours before your flight home.",
                VehicleRego = "AB-123-CD",
                VehicleDriver = "Max Mustermann",
                DriverContact = "+49123456789",
                VehicleType = "Minibus",
                VehicleColor = "White",
                ProviderName = "Jumbo Tours"
            },
            Outbound = new TransferDirectionPayload
            {
                TransferType = "Private",
                Airport = "MLA",
                FlightNo = "EJ456",
                FlightArrival = DateTimeOffset.UtcNow.AddHours(10),
                FlightDeparture = DateTimeOffset.UtcNow.AddHours(8),
                PickupTime = outboundPickupTime,
                TransferMinutes = 42,
                DeskLatitude = 35.8997f,
                DeskLongitude = 14.5146f,
                DeskName = "easyJet holidays desk",
                DeskDescription = "Outside arrivals, opposite the café.",
                Instructions = "Once you've arrived and collected your luggage, please leave the baggage hall.",
                VehicleRego = "AB-123-CD",
                VehicleDriver = "Max Mustermann",
                DriverContact = "+49123456789",
                VehicleType = "Minibus",
                VehicleColor = "White",
                ProviderName = "Jumbo Tours",
                WhatThreeWords = "desk.arrivals.transfer"
            }
        };

        var expected = new TransferDetailsResponse
        {
            BookingReference = request.BookingReference,
            InboundTransferDetails = new TransferDirection()
            {
                Vehicle = new Vehicle()
                {
                    VehicleRegistration = "AB-123-CD",
                    Provider = "Jumbo Tours",
                    VehicleDriverName = "Max Mustermann",
                    VehicleDriverPhone = "+49123456789",
                    VehicleType = "Minibus",
                    VehicleColour = "White"
                },
                PickupTime = inboundPickupTime,
                PickupDate = inboundPickupTime.UtcDateTime.Date,
                DropoffTime = null,
                DropoffDate = null,
                TransferType = TransferItemType.Private,
                Airport = "MLA",
                PickupLocation = new LocationPoint { Latitude = 39.5517f, Longitude = 2.7388f },
                PickupLocationName = "PMI Airport Terminal 1",
                TransferMinutes = 0,
                PickupLocationInstructions = "For your return journey, your detailed transfer pick up information and time will be available on our portal 24 hours before your flight home.",
                What3WordsLocation = null,
            },
            OutboundTransferDetails = new TransferDirection()
            {
                Vehicle = new Vehicle()
                {
                    VehicleRegistration = "AB-123-CD",
                    Provider = "Jumbo Tours",
                    VehicleDriverName = "Max Mustermann",
                    VehicleDriverPhone = "+49123456789",
                    VehicleType = "Minibus",
                    VehicleColour = "White"
                },
                PickupTime = outboundPickupTime,
                PickupDate = outboundPickupTime.UtcDateTime.Date,
                DropoffTime = null,
                DropoffDate = null,
                TransferType = TransferItemType.Private,
                Airport = "MLA",
                PickupLocation = new LocationPoint { Latitude = 35.8997f, Longitude = 14.5146f },
                PickupLocationName = "easyJet holidays desk",
                TransferMinutes = 42,
                PickupLocationInstructions = "Once you've arrived and collected your luggage, please leave the baggage hall.",
                What3WordsLocation = "desk.arrivals.transfer",
            }
        };

        _bookingFetchServiceMock
            .Setup(service => service.Get(It.IsAny<GetBookingRequest>()))
            .ReturnsAsync(new BookingResponse());

        _bookingTransfersRepositoryMock
            .Setup(repo => repo.GetTransferDetails(request.BookingReference, It.IsAny<CancellationToken>()))
            .ReturnsAsync(payload);

        // Act
        var result = await _service.GetTransferDetailsFor(request, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEquivalentTo(expected);

        _bookingFetchServiceMock.Verify(service => service.Get(It.IsAny<GetBookingRequest>()), Times.Once);
        _bookingTransfersRepositoryMock.Verify(
            repo => repo.GetTransferDetails(request.BookingReference, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetTransferDetailsFor_ShouldReturnNull_WhenNoTransferDetailsExist()
    {
        // Arrange
        var request = new GetBookingRequest
        {
            BookingReference = "InvalidReference",
            LastName = "Doe",
            Date = new DateTime(2026, 3, 1)
        };

        _bookingFetchServiceMock
            .Setup(service => service.Get(It.IsAny<GetBookingRequest>()))
            .ReturnsAsync(new BookingResponse());

        _bookingTransfersRepositoryMock
            .Setup(repo => repo.GetTransferDetails(request.BookingReference, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TransferDetailsPayload?)null);

        // Act
        var result = await _service.GetTransferDetailsFor(request, CancellationToken.None);

        // Assert
        result.Should().BeNull();

        _bookingFetchServiceMock.Verify(service => service.Get(It.IsAny<GetBookingRequest>()), Times.Once);
        _bookingTransfersRepositoryMock.Verify(
            repo => repo.GetTransferDetails(request.BookingReference, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    [InlineData(null, TransferItemType.Unknown)]
    [InlineData("", TransferItemType.Unknown)]
    [InlineData("   ", TransferItemType.Unknown)]
    [InlineData("Private", TransferItemType.Private)]
    [InlineData("private", TransferItemType.Private)]
    [InlineData("pri_vate", TransferItemType.Private)]
    [InlineData("pri-vate", TransferItemType.Private)]
    [InlineData("pri vate", TransferItemType.Private)]
    [InlineData("Shared", TransferItemType.Shared)]
    [InlineData("sh_ared", TransferItemType.Shared)]
    [InlineData("sh-ared", TransferItemType.Shared)]
    [InlineData("sh ared", TransferItemType.Shared)]
    [InlineData("NoTransfer", TransferItemType.NoTransfer)]
    [InlineData("no_transfer", TransferItemType.NoTransfer)]
    [InlineData("no-transfer", TransferItemType.NoTransfer)]
    [InlineData("no transfer", TransferItemType.NoTransfer)]
    [InlineData("public", TransferItemType.Unknown)]
    [InlineData("no_transfer_soon", TransferItemType.Unknown)]
    [InlineData("_", TransferItemType.Unknown)]
    [InlineData("-", TransferItemType.Unknown)]
    public void MapTransferType_ShouldMapExpectedValue(string? transferType, TransferItemType expected)
    {
        // Act
        var result = BookingTransfersService.MapTransferType(transferType);

        // Assert
        result.Should().Be(expected);
    }

    [Fact]
    public async Task GetTransferDetailsFor_ShouldValidateBookingThenReturnTransferDetails()
    {
        // Arrange
        var request = new GetBookingRequest
        {
            BookingReference = "BR123",
            LastName = "Doe",
            Date = new DateTime(2026, 3, 1)
        };

        _bookingFetchServiceMock
            .Setup(service => service.Get(It.Is<GetBookingRequest>(r =>
                r.BookingReference == request.BookingReference
                && r.LastName == request.LastName
                && r.Date == request.Date)))
            .ReturnsAsync(new BookingResponse());

        _bookingTransfersRepositoryMock
            .Setup(repo => repo.GetTransferDetails(request.BookingReference, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TransferDetailsPayload { BookingReference = request.BookingReference });

        // Act
        var result = await _service.GetTransferDetailsFor(request, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result!.BookingReference.Should().Be(request.BookingReference);
        _bookingFetchServiceMock.Verify(service => service.Get(It.IsAny<GetBookingRequest>()), Times.Once);
        _bookingTransfersRepositoryMock.Verify(
            repo => repo.GetTransferDetails(request.BookingReference, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetTransferDetailsFor_ShouldThrow_WhenBookingValidationFails()
    {
        // Arrange
        var request = new GetBookingRequest
        {
            BookingReference = "BR123",
            LastName = "Doe",
            Date = new DateTime(2026, 3, 1)
        };

        _bookingFetchServiceMock
            .Setup(service => service.Get(It.IsAny<GetBookingRequest>()))
            .ThrowsAsync(new ApiException(ApiExceptionCodes.BookingViewError, "Can not find a booking"));

        // Act
        var act = async () => await _service.GetTransferDetailsFor(request, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ApiException>();
        _bookingTransfersRepositoryMock.Verify(
            repo => repo.GetTransferDetails(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}