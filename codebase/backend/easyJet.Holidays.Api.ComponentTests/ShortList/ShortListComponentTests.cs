using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Api.Domain.Data.ShortList;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using easyJet.Holidays.Tests.Domain.Integration;
using FluentAssertions;
using Microsoft.Net.Http.Headers;
using Newtonsoft.Json;
using System.Net;
using System.Text;
using WireMock.RequestBuilders;
using WireMock.ResponseBuilders;
using WireMock.Settings;
using Xunit;


namespace easyJet.Holidays.Api.ComponentTests.ShortList;

/// <summary>
/// Component tests for <see cref="ShortListController"/>
/// </summary>
public class ShortListComponentTests : BaseComponentTest
{
    private const string SessionCookie =
        "eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e162a8bd69ecd779b866bdc09574776ae&CookieTypeKey=1;";

    private void SetupCmsGiataLookupMock(Dictionary<string, List<string>> giataToAtcomMap = null)
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
                .WithPath("/api/DestinationsSearch/GetAtcomIdsByGiataCodes")
                .UsingPost()
        )
        .RespondWith(
            Response.Create()
                .WithStatusCode(200)
                .WithBodyAsJson(giataToAtcomMap ?? new Dictionary<string, List<string>>())
        );

        ApplyConfigurationField("Cms:Host", server.Url);
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/shortlist/status")]
    [Fact]
    public async Task Status_WithAuthenticatedUser_ReturnsOkWithStatus()
    {
        // Arrange
        SetupCmsGiataLookupMock();
        var message = new HttpRequestMessage(HttpMethod.Get, "/api/v1.0/shortlist/status");
        message.Headers.Add(HeaderNames.Cookie, SessionCookie);

        // Act
        var response = await Client.SendAsync(message);
        var responseContent = await response.Content.ReadAsStringAsync();

        var result = JsonConvert.DeserializeObject<ShortListStatus>(responseContent);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        result.Should().NotBeNull();
        result!.SavedOffersCount.Should().BeGreaterThanOrEqualTo(0);
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/shortlist")]
    [Fact]
    public async Task Create_WithValidRequest_ReturnsOkWithStatus()
    {
        // Arrange
        SetupCmsGiataLookupMock();

        var requestBody = new
        {
            AccommodationId = "TESTACCOM001",
            ITheme = "BO",
            IDepAirport = "LGW",
            IArrAirport = "PMI",
            StartDate = "2027-08-01",
            Departure = "LGW",
            OutboundRouteId = "1",
            InboundRouteId = "2",
            PackageId = "PKG001",
            Duration = new[] { 7 },
            Room = new[] { new { Adults = 2, Children = 0, Infants = 0, RoomCode = "DBL" } }
        };

        var message = new HttpRequestMessage(HttpMethod.Post, "/api/v1.0/shortlist")
        {
            Content = new StringContent(JsonConvert.SerializeObject(requestBody), Encoding.UTF8, "application/json")
        };
        message.Headers.Add(HeaderNames.Cookie, SessionCookie);

        // Act
        var response = await Client.SendAsync(message);
        var responseContent = await response.Content.ReadAsStringAsync();

        var result = JsonConvert.DeserializeObject<ShortListStatus>(responseContent);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        result.Should().NotBeNull();
        result!.SavedOffersCount.Should().BeGreaterThan(0);
        result.CreatedID.Should().NotBeNullOrEmpty();
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/shortlist/hotel")]
    [Fact]
    public async Task CreateHotel_WithValidRequest_ReturnsOkWithStatus()
    {
        // Arrange
        SetupCmsGiataLookupMock(new Dictionary<string, List<string>>
        {
            { "TESTHOTEL001", new List<string> { "ATCOM_TEST_001" } }
        });

        var requestBody = new
        {
            GiataCode = "TESTHOTEL001",
            ITheme = "BL"
        };

        var message = new HttpRequestMessage(HttpMethod.Post, "/api/v1.0/shortlist/hotel")
        {
            Content = new StringContent(JsonConvert.SerializeObject(requestBody), Encoding.UTF8, "application/json")
        };
        message.Headers.Add(HeaderNames.Cookie, SessionCookie);

        // Act
        var response = await Client.SendAsync(message);
        var responseContent = await response.Content.ReadAsStringAsync();

        var result = JsonConvert.DeserializeObject<ShortListStatus>(responseContent);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        result.Should().NotBeNull();
        result!.SavedOffersCount.Should().BeGreaterThan(0);
        result.CreatedID.Should().NotBeNullOrEmpty();
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/shortlist/delete")]
    [Fact]
    public async Task Delete_WithIds_ReturnsOkWithStatus()
    {
        // Arrange — first create an entry to delete
        SetupCmsGiataLookupMock();

        var createBody = new
        {
            AccommodationId = "DELACCOM001",
            ITheme = "BO",
            IDepAirport = "LGW",
            IArrAirport = "PMI",
            StartDate = "2027-09-01",
            Departure = "LGW",
            OutboundRouteId = "1",
            InboundRouteId = "2",
            PackageId = "PKG002",
            Duration = new[] { 7 },
            Room = new[] { new { Adults = 2, Children = 0, Infants = 0, RoomCode = "DBL" } }
        };

        var createMessage = new HttpRequestMessage(HttpMethod.Post, "/api/v1.0/shortlist")
        {
            Content = new StringContent(JsonConvert.SerializeObject(createBody), Encoding.UTF8, "application/json")
        };
        createMessage.Headers.Add(HeaderNames.Cookie, SessionCookie);

        var createResponse = await Client.SendAsync(createMessage);
        var createContent = await createResponse.Content.ReadAsStringAsync();
        var created = JsonConvert.DeserializeObject<ShortListStatus>(createContent);
        var createdId = created!.CreatedID;

        

        // Act — delete the created entry
        var deleteMessage = new HttpRequestMessage(HttpMethod.Post, $"/api/v1.0/shortlist/delete?ids={createdId}");
        deleteMessage.Headers.Add(HeaderNames.Cookie, SessionCookie);

        var response = await Client.SendAsync(deleteMessage);
        var responseContent = await response.Content.ReadAsStringAsync();

        var result = JsonConvert.DeserializeObject<ShortListStatus>(responseContent);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        result.Should().NotBeNull();
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/shortlist/hotelStatus")]
    [Fact]
    public async Task HotelStatus_WithAccomCode_ReturnsOkWithStatus()
    {
        // Arrange 
        SetupCmsGiataLookupMock(new Dictionary<string, List<string>>
        {
            { "HSTATACCOM01", new List<string> { "ATCOM123" } }
        });

        // Arrange — first create a hotel shortlist entry
        var createBody = new
        {
            GiataCode = "HSTATACCOM01",
            ITheme = "BL"
        };

        var createMessage = new HttpRequestMessage(HttpMethod.Post, "/api/v1.0/shortlist/hotel")
        {
            Content = new StringContent(JsonConvert.SerializeObject(createBody), Encoding.UTF8, "application/json")
        };
        createMessage.Headers.Add(HeaderNames.Cookie, SessionCookie);

        await Client.SendAsync(createMessage);

        // Act
        var message = new HttpRequestMessage(HttpMethod.Get, "/api/v1.0/shortlist/hotelStatus/HSTATACCOM01");
        message.Headers.Add(HeaderNames.Cookie, SessionCookie);

        var response = await Client.SendAsync(message);
        var responseContent = await response.Content.ReadAsStringAsync();

        var result = JsonConvert.DeserializeObject<ShortListStatus>(responseContent);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        result.Should().NotBeNull();
        result!.SavedOffersCount.Should().Be(1);
        result.CreatedID.Should().NotBeNullOrEmpty();
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/shortlist/status")]
    [Fact]
    public async Task Status_WithoutCookie_ReturnsUnauthorized()
    {
        // Arrange
        var message = new HttpRequestMessage(HttpMethod.Get, "/api/v1.0/shortlist/status");

        // Act
        var response = await Client.SendAsync(message);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
