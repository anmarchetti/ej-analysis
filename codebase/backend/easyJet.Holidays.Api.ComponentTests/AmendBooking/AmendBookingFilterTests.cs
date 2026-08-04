using easyJet.Holidays.Tests.Domain.ComponentTests;
using easyJet.Holidays.Tests.Domain.Integration;
using FluentAssertions;
using Microsoft.Net.Http.Headers;
using System.Net;
using System.Text;
using WireMock.RequestBuilders;
using WireMock.ResponseBuilders;
using WireMock.Server;
using WireMock.Settings;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.AmendBooking;


public class AmendBookingFilterTests : BaseComponentTest
{
    [Fact]
    public async Task GetAvailableFlightsOption_LoggedInAsLeadPax_Success()
    {
        // Arrange
        var server = ConfigureCmsServer();

        ApplyConfigurationField("Cms:Host", server.Url);

        Client.DefaultRequestHeaders.Add(HeaderNames.Cookie, $"eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e3a6aca8c7b03b9615e9c9ba0410e9c9085e321e4cb2f7a489795c200eb5760cf&CookieTypeKey=1; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax; httponly");
        Client.DefaultRequestHeaders.Add(HeaderNames.Cookie, $"ejHolidaysUserId=someid; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax;");
        Client.DefaultRequestHeaders.Add(HeaderNames.Cookie, $"ejHolidaysSessionId=sessionid; expires=Mon, 26 Aug 2019 12:41:26 GMT; domain=localhost; path=/; secure; samesite=lax; httponly");

        var requestEndpoint = $"/api/v1.0/amend/amend-dates/flights";
        var requestJson = await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "AmendController", "DatesEndpoints", "GetAvailableFlightsOption.json"));

        var response = await Client.PostAsync(requestEndpoint, new StringContent(requestJson, Encoding.UTF8, "application/json"));

        response.Should().BeSuccessful();
    }

    [Fact]
    public async Task GetAvailableFlightsOption_NotLoggedInAsLeadPax_NotAuthorized()
    {
        // Arrange
        var server = ConfigureCmsServer();

        ApplyConfigurationField("Cms:Host", server.Url);

        var requestEndpoint = $"/api/v1.0/amend/amend-dates/flights";
        var requestJson = await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "AmendController", "DatesEndpoints", "GetAvailableFlightsOption.json"));
        var response = await Client.PostAsync(requestEndpoint, new StringContent(requestJson, Encoding.UTF8, "application/json"));

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    private WireMockServer ConfigureCmsServer()
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
}