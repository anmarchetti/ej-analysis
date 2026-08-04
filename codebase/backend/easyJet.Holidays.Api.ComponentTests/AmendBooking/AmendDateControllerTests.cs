using easyJet.Holidays.Api.Domain.Data.AmendBooking.Dates;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using easyJet.Holidays.Tests.Domain.Integration;
using FluentAssertions;
using Microsoft.Net.Http.Headers;
using Newtonsoft.Json;
using System.Net;
using System.Text;
using WireMock.RequestBuilders;
using WireMock.ResponseBuilders;
using WireMock.Server;
using WireMock.Settings;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.AmendBooking;

public class AmendDateControllerTests : BaseComponentTest
{
    [Fact]
    public async Task GetAmendDateSummary_ReturnFullyMatchedOffer()
    {
        // Arrange
        var server = ServerWithEmptyOkForGetHotelTransfersAndGetHotelCodes();

        ApplyConfigurationField("Cms:Host", server.Url);
        SetupApiAuthorizationForClient();

        var boardType = "BB";
        var transferCode = "W2MS006892PP";
        var roomCode = "SW01";
        var accomId = "ESTF0007";

        var requestEndpoint =
            $"/api/v1.0/amend/amend-dates/summary?selectedDate=2023-09-11&boardType={boardType}&transferCode={transferCode}&Duration=6&AccomId={accomId}&room[0].children=0&room[0].infants=0&room[0].adults=2&room[0].roomCode={roomCode}&outboundDepTime=2023-10-11T12:50:00&inboundDepTime=2023-10-11T17:15:00&bookingRef=70176122";

        // Act
        var response = await Client.GetStringAsync(requestEndpoint);

        // Assert
        var result = JsonConvert.DeserializeObject<AmendDatesOffer>(response);

        result.Offer.Accom.Code.Should().Be(accomId);
        result.Offer.Accom.Unit.Should().AllSatisfy(unit => unit.Board.Should().Be(boardType));
        result.Offer.Accom.Unit.Should().AllSatisfy(unit => unit.Code.Should().Be(roomCode));
        result.Offer.Transfers.First().Code.Should().Be(transferCode);
        result.SeatsChangeEnabled.Should().BeTrue();
    }

    [Fact]
    public async Task GetAmendDateSummary_ReturnCheapest()
    {
        // Arrange
        var server = ServerWithEmptyOkForGetHotelTransfersAndGetHotelCodes();

        ApplyConfigurationField("Cms:Host", server.Url);
        SetupApiAuthorizationForClient();

        var boardType = "BB";
        var transferCode = "W2MS006892PP";
        var roomCode = "SW01";
        var accomId = "ESTF0007_CHEAP";

        var requestEndpoint =
            $"/api/v1.0/amend/amend-dates/summary?selectedDate=2023-09-11&boardType={boardType}&transferCode={transferCode}&Duration=6&AccomId={accomId}&room[0].children=0&room[0].infants=0&room[0].adults=2&room[0].roomCode={roomCode}&outboundDepTime=2023-10-11T12:50:00&inboundDepTime=2023-10-11T17:15:00&bookingRef=70176122";

        // Act
        var response = await Client.GetStringAsync(requestEndpoint);

        // Assert
        var result = JsonConvert.DeserializeObject<AmendDatesOffer>(response);

        result.Offer.Accom.Unit.Should().AllSatisfy(unit => unit.Board.Should().Be(boardType));
        result.Offer.Accom.Unit.Should().AllSatisfy(unit => unit.Code.Should().Be(roomCode));
        result.SeatsChangeEnabled.Should().BeTrue();
        result.Offer.Transfers.First().Code.Should().Be(transferCode);
    }

    [Fact]
    public async Task GetAvailableTransferOption_ReturnAvailableTransfer()
    {
        // Arrange
        var server = ServerWithEmptyOkForGetHotelTransfers();

        ApplyConfigurationField("Cms:Host", server.Url);
        SetupApiAuthorizationForClient();

        var requestEndpoint = $"/api/v1.0/amend/amend-dates/transfer";
        var requestJson = await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "AmendController", "DatesEndpoints", "GetAvailableTransferOptionsRequest.json"));

        // Act
        var response = await Client.PostAsync(requestEndpoint, new StringContent(requestJson, Encoding.UTF8, "application/json"));

        // Assert
        var content = await response.Content.ReadAsStringAsync();
        var responseData = JsonConvert.DeserializeObject<List<AmendDatesOffer>>(content);

        responseData[0].BookingRef.Should().NotBeNullOrEmpty();
        responseData[0].BookingPrice.Should().Be(1035.34M);
        responseData[0].OfferPrice.Should().Be(1430.63M);
        responseData[0].AmendmentDatesCharges.Should().Be(395.29M);
        responseData[0].AmendmentFlowCharges.Should().Be(59.75M);

        responseData[1].BookingRef.Should().NotBeNullOrEmpty();
        responseData[1].BookingPrice.Should().Be(1035.34M);
        responseData[1].OfferPrice.Should().Be(1370.88M);
        responseData[1].AmendmentDatesCharges.Should().Be(335.54M);
        responseData[1].AmendmentFlowCharges.Should().Be(0);
    }

    [Fact]
    public async Task GetAvailableFlightsOption_ReturnAvailableFlights()
    {
        // Arrange
        var server = ServerWithEmptyOkForGetHotelTransfers();

        ApplyConfigurationField("Cms:Host", server.Url);
        SetupApiAuthorizationForClient();

        var requestEndpoint = $"/api/v1.0/amend/amend-dates/flights";
        var requestJson = await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "AmendController", "DatesEndpoints", "GetAvailableFlightsOption.json"));

        // Act
        var response = await Client.PostAsync(requestEndpoint, new StringContent(requestJson, Encoding.UTF8, "application/json"));

        // Assert
        var content = await response.Content.ReadAsStringAsync();
        var responseData = JsonConvert.DeserializeObject<List<AmendDatesOffer>>(content);

        responseData[0].BookingRef.Should().NotBeNullOrEmpty();
        responseData[0].BookingPrice.Should().Be(1792.18M);
        responseData[0].OfferPrice.Should().Be(1486.94M);
        responseData[0].AmendmentDatesCharges.Should().Be(-305.24M);
        responseData[0].AmendmentFlowCharges.Should().Be(0);
    }

    [Fact]
    public async Task GetAlternativeFlightOption_ReturnAvailableFlights()
    {
        // Arrange
        var requestEndpoint = $"/api/v1.0/amend/amend-dates/flights";
        var requestJson = await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "AmendController", "AlternativeFlightEndpoint", "GetAvailableFlightOptionsRequest.json"));
        SetupApiAuthorizationForClient();

        // Act
        var response = await Client.PostAsync(requestEndpoint, new StringContent(requestJson, Encoding.UTF8, "application/json"));

        // Assert
        var content = await response.Content.ReadAsStringAsync();
        var responseData = JsonConvert.DeserializeObject<List<AmendDatesOffer>>(content);

        responseData.Should().AllSatisfy(offer =>
        {
            offer.OfferPrice.Should().BePositive();
            offer.BookingPrice.Should().BePositive();
            offer.Offer.Should().NotBeNull();
            offer.Offer.Transport.Routes.Count.Should().Be(2);
        });
    }

    [Fact]
    public async Task ValidateOffers_ReturnWithCalculatedPrices()
    {
        // Arrange
        var server = ServerWithEmptyOkForGetHotelTransfers();

        ApplyConfigurationField("Cms:Host", server.Url);
        SetupApiAuthorizationForClient();

        var requestEndpoint = $"/api/v1.0/amend/amend-dates/validate";
        var requestJson = await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "AmendController", "ValidateEndpoint", "ValidateOffersRequest.json"));

        // Act
        var response = await Client.PostAsync(requestEndpoint, new StringContent(requestJson, Encoding.UTF8, "application/json"));

        // Assert
        var content = await response.Content.ReadAsStringAsync();
        var responseData = JsonConvert.DeserializeObject<List<AmendDatesOffer>>(content);

        responseData.Should().AllSatisfy(offer =>
        {
            offer.OfferPrice.Should().BePositive();
            offer.BookingPrice.Should().BePositive();
            offer.AmendmentDatesCharges.Should().Be(offer.OfferPrice - offer.BookingPrice);
            offer.Offer.Should().NotBeNull();
        });
    }

    protected override void SetupApiAuthorizationForClient()
    {
        Client.DefaultRequestHeaders.Add(HeaderNames.Cookie, $"eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e3a6aca8c7b03b9615e9c9ba0410e9c9085e321e4cb2f7a489795c200eb5760cf&CookieTypeKey=1; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax; httponly");
        Client.DefaultRequestHeaders.Add(HeaderNames.Cookie, $"ejHolidaysUserId=someid; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax;");
        Client.DefaultRequestHeaders.Add(HeaderNames.Cookie, $"ejHolidaysSessionId=sessionid; expires=Mon, 26 Aug 2019 12:41:26 GMT; domain=localhost; path=/; secure; samesite=lax; httponly");
    }

    private WireMockServer ServerWithEmptyOkForGetHotelTransfers()
    {
        var server = SpawnServer("CmsWireMockServer",
            new WireMockServerSettings
            {
                FileSystemHandler = new CustomFolderFileSystemHandler(WiremockStaticMappingsBaseFolder, "CMS"),
                StartAdminInterface = true,
                ReadStaticMappings = true,
                WatchStaticMappings = true,
                WatchStaticMappingsInSubdirectories = true
            });

        server.Given(
                Request.Create()
                    .WithPath("/api/DestinationsSearch/GetHotelTransfers")
                    .UsingPost()
            )
            .AtPriority(1)
            .RespondWith(
                Response.Create()
                    .WithStatusCode(HttpStatusCode.OK)
            );
        return server;
    }

    private WireMockServer ServerWithEmptyOkForGetHotelTransfersAndGetHotelCodes()
    {
        var server = SpawnServer("CmsWireMockServer",
            new WireMockServerSettings
            {
                FileSystemHandler = new CustomFolderFileSystemHandler(WiremockStaticMappingsBaseFolder, "CMS"),
                StartAdminInterface = true,
                ReadStaticMappings = true,
                WatchStaticMappings = true,
                WatchStaticMappingsInSubdirectories = true
            });

        server.Given(
                Request.Create()
                    .WithPath("/api/DestinationsSearch/GetHotelsCodes")
                    .UsingGet()
            )
            .AtPriority(1)
            .RespondWith(
                Response.Create()
                    .WithStatusCode(HttpStatusCode.OK)
            );

        server.Given(
                Request.Create()
                    .WithPath("/api/DestinationsSearch/GetHotelTransfers")
                    .UsingPost()
            )
            .AtPriority(1)
            .RespondWith(
                Response.Create()
                    .WithStatusCode(HttpStatusCode.OK)
            );
        return server;
    }
}