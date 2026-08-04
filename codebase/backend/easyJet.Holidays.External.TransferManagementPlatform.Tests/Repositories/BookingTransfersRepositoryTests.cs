using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Models.Api.Payload;
using easyJet.Holidays.External.TransferManagementPlatform.Models;
using easyJet.Holidays.External.TransferManagementPlatform.Repositories;
using easyJet.Holidays.External.TransferManagementPlatform.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.TransferManagementPlatform.Tests.Repositories;

public class BookingTransfersRepositoryTests
{
    [Fact]
    public async Task GetTransferDetails_ShouldReturnExpectedTransferDetails()
    {
        // Arrange
        var apiServiceMock = new Mock<IApiService>();
        var provider = CreateEndpointsProvider();

        var repository = new BookingTransfersRepository(
            apiServiceMock.Object,
            provider
        );
        var bookingReference = "ABC123";
        var response = new DetailsResponse
        {
            Payload = new JsonApiPayload<TransferDetailsPayload>
            {
                Body = new TransferDetailsPayload
                {
                    BookingReference = "ABC123",
                    NoOfPax = 2,
                    ResortId = "ESCDBE",
                    CreatedAt = new DateTimeOffset(2026, 3, 4, 10, 26, 55, TimeSpan.Zero),
                    UpdatedAt = new DateTimeOffset(2026, 3, 4, 13, 18, 20, TimeSpan.Zero),
                    Inbound = new TransferDirectionPayload
                    {
                        PickupLocationDescription = "PMI Airport Terminal 1",
                        PickupTime = new DateTimeOffset(2026, 3, 1, 14, 45, 0, TimeSpan.Zero),
                        PickupLatitude = 39.5517f,
                        PickupLongitude = 2.7388f,
                        VehicleRego = "AB-123-CD",
                        VehicleDriver = "Max Mustermann",
                        VehicleColor = "White",
                        VehicleType = "Minibus",
                        DriverContact = "+49123456789",
                        TransferType = "private",
                        Airport = "MLA",
                        FlightNo = "EJU8078",
                        FlightArrival = new DateTimeOffset(2026, 4, 20, 8, 5, 0, TimeSpan.Zero),
                        FlightDeparture = new DateTimeOffset(2026, 4, 20, 6, 10, 0, TimeSpan.Zero),
                        TransferMinutes = null,
                        Instructions = "Inbound instructions",
                        ProviderName = "Jumbo Tours"
                    },
                    Outbound = new TransferDirectionPayload
                    {
                        WhatThreeWords = "desk.arrivals.transfer",
                        DeskLatitude = 35.8997f,
                        DeskLongitude = 14.5146f,
                        DeskName = "easyJet holidays desk",
                        DeskDescription = "Opposite the cafe",
                        TransferType = "private",
                        Airport = "MLA",
                        FlightNo = "EJU8077",
                        FlightArrival = new DateTimeOffset(2026, 4, 14, 0, 10, 0, TimeSpan.Zero),
                        FlightDeparture = new DateTimeOffset(2026, 4, 13, 20, 15, 0, TimeSpan.Zero),
                        TransferMinutes = 42,
                        Instructions = "Outbound instructions",
                        ProviderName = "Jumbo Tours"
                    }
                }
            }
        };

        apiServiceMock
            .Setup(x => x.GetResponseContentAsync<DetailsRequest, DetailsResponse>(It.IsAny<DetailsRequest>()))
            .ReturnsAsync(response);


        var cancellationToken = CancellationToken.None;

        // Act
        var result = await repository.GetTransferDetails(bookingReference, cancellationToken);

        // Assert
        result.Should().NotBeNull();
        result!.BookingReference.Should().Be(bookingReference);
        result.Inbound.Should().NotBeNull();
        result.Inbound!.PickupLocationDescription.Should().Be("PMI Airport Terminal 1");
        result.Inbound.PickupLatitude.Should().Be(39.5517f);
        result.Inbound.PickupLongitude.Should().Be(2.7388f);
        result.Inbound.ProviderName.Should().Be("Jumbo Tours");
        result.Outbound.Should().NotBeNull();
        result.Outbound!.DeskLatitude.Should().Be(35.8997f);
        result.Outbound.DeskLongitude.Should().Be(14.5146f);
        result.Outbound.WhatThreeWords.Should().Be("desk.arrivals.transfer");
    }

    private static EndpointsProvider CreateEndpointsProvider()
    {
        var transferManagementSettingsMock = new Mock<IOptions<TransferManagementPlatformSettings>>();
        transferManagementSettingsMock.Setup(s => s.Value).Returns(new TransferManagementPlatformSettings
        {
            Host = "https://api.example.com",
            Api = new TransferManagementApiSettings { BookingTransferDetails = "/transfer/details" }
        });
        var envBehaviorSettingsMock = new Mock<IOptions<EnvironmentBehaviourSettings>>();
        envBehaviorSettingsMock.Setup(e => e.Value).Returns(new EnvironmentBehaviourSettings());
        var cookiesServiceMock = new Mock<ICookiesService>();
        var endpointsProviderLoggerMock = new Mock<ILogger<EndpointsProvider>>();

        return new EndpointsProvider(
            transferManagementSettingsMock.Object,
            envBehaviorSettingsMock.Object,
            cookiesServiceMock.Object,
            endpointsProviderLoggerMock.Object
        );
    }
}