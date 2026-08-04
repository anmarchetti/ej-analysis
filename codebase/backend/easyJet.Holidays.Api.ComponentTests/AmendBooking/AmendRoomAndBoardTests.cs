using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.RoomAndBoard;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using easyJet.Holidays.Tests.Domain.Integration;
using FluentAssertions;
using FluentAssertions.Execution;
using Microsoft.Net.Http.Headers;
using Newtonsoft.Json;
using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.AmendBooking;

public class AmendRoomAndBoardTests : BaseFixtureAwareComponentTest
{
    private const string SessionCookie = "eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e3a6aca8c7b03b9615e9c9ba0410e9c9085e321e4cb2f7a489795c200eb5760cf&CookieTypeKey=1; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax; httponly";
    private const string CommitSessionCookie = "eJ2Session=0cbb0f8ca564b25dc07841e181796f2af0fe6d322a523b768fceba3aa81e9a549afe9ee82f1f7217a89dd7b0c8d520aeb702ad0ea214c58564185e6c8c253ad5&CookieTypeKey=1; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax; httponly";

    public AmendRoomAndBoardTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    [Trait("Category", "Integration")]
    [Trait("Api", "/api/v1.0/amend/amend-room-and-board/info")]
    [Fact]
    public async Task AlternativeRoomAndBoard_LoadAvailableOption_DI_Hotel_Success()
    {
        var bookingRef = "70285718";
        var query = $"/api/v1.0/amend/amend-room-and-board/info?bookingReference={bookingRef}";

        var message = new HttpRequestMessage(HttpMethod.Get, query);
        message.Headers.Add(HeaderNames.Cookie, SessionCookie);

        var response = await Client.SendAsync(message);

        var responseJson = await response.Content.ReadAsStringAsync();
        var result = JsonConvert.DeserializeObject<AmendRoomVariantsResponse>(responseJson);

        using (new AssertionScope())
        {
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            result!.RoomVariants.Count().Should().Be(4);

            // Assert first variant
            result.RoomVariants.Should().Contain(x =>
                x.Units.Single().Code == "TWN!MEDHB3-6.12" &&
                x.Units.Single().Board == "HB");

            // Assert second variant
            result.RoomVariants.Should().Contain(x =>
                x.Units.Single().Code == "TWN!MEDBB3-6.3" &&
                x.Units.Single().Board == "BB");

            // Assert third variant
            result.RoomVariants.Should().Contain(x =>
                x.Units.Single().Code == "TWSV!MEDHB3-6.12" &&
                x.Units.Single().Board == "HB");

            // Assert fourth variant
            result.RoomVariants.Should().Contain(x =>
                x.Units.Single().Code == "TWSV!MEDBB3-6.3" &&
                x.Units.Single().Board == "BB");

            // Verify amendment charges and prices for all variants
            result.RoomVariants.Should().OnlyContain(x =>
                x.AmendmentPaymentInfo.AmendmentCharges == 12.68m &&
                x.AmendmentPaymentInfo.PackagePriceWithFees == 1213.28m);
        }
    }

    [Trait("Category", "Integration")]
    [Trait("Api", "/api/v1.0/amend/amend-room-and-board/info")]
    [Fact]
    public async Task AlternativeRoomAndBoard_LoadAvailableOption_UnAuthorized()
    {
        var bookingRef = "70285718";
        var query = $"/api/v1.0/amend/amend-room-and-board/info?bookingReference={bookingRef}";
        var response = await Client.GetAsync(query);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Trait("Category", "Integration")]
    [Trait("Api", "/api/v1.0/amend/amend-room-and-board/info")]
    [Fact]
    public async Task AlternativeRoomAndBoard_LoadAvailableOption_EmptyBookingRef_BadRequest()
    {
        var query = $"/api/v1.0/amend/amend-room-and-board/info?bookingReference=";

        var message = new HttpRequestMessage(HttpMethod.Get, query);
        message.Headers.Add(HeaderNames.Cookie, SessionCookie);

        var response = await Client.SendAsync(message);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Trait("Category", "Integration")]
    [Trait("Api", "/api/v1.0/amend/amend-room-and-board/validate")]
    [Fact]
    public async Task AlternativeRoomAndBoards_ValidatePriceRequest_UnAuthorized()
    {
        var query = "/api/v1.0/amend/amend-room-and-board/validate";
        var request = new AmendRoomValidationRequest
        {
            BookingRef = "TestRef",
            SelectedRoomVariant = new AmendRoomVariant(),
            RoomVariants = new List<AmendRoomVariant>
            {
                new AmendRoomVariant()
            }
        };
        var response = await Client.PostAsJsonAsync(query, request);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Trait("Category", "Integration")]
    [Trait("Api", "/api/v1.0/amend/amend-room-and-board/validate")]
    [Fact]
    public async Task AlternativeRoomAndBoards_ValidatePriceRequest_EmptyBookingRef()
    {
        var query = "/api/v1.0/amend/amend-room-and-board/validate";

        var request = new AmendRoomValidationRequest
        {
            BookingRef = String.Empty,
            SelectedRoomVariant = new AmendRoomVariant(),
            RoomVariants = new List<AmendRoomVariant>
            {
                new AmendRoomVariant()
            }
        };

        var message = new HttpRequestMessage(HttpMethod.Post, query);
        message.Headers.Add(HeaderNames.Cookie, SessionCookie);
        message.Content = JsonContent.Create(request);

        var response = await Client.SendAsync(message);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Trait("Category", "Integration")]
    [Trait("Api", "/api/v1.0/amend/amend-room-and-board/validate")]
    [Fact]
    public async Task AlternativeRoomAndBoards_ValidatePriceRequest_EmptySelectedRoomVariant()
    {
        var query = "/api/v1.0/amend/amend-room-and-board/validate";

        var request = new AmendRoomValidationRequest
        {
            BookingRef = "TestRef",
            SelectedRoomVariant = null,
            RoomVariants = new List<AmendRoomVariant>
            {
                new AmendRoomVariant()
            }
        };

        var message = new HttpRequestMessage(HttpMethod.Post, query);
        message.Headers.Add(HeaderNames.Cookie, SessionCookie);
        message.Content = JsonContent.Create(request);

        var response = await Client.SendAsync(message);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Trait("Category", "Integration")]
    [Trait("Api", "/api/v1.0/amend/amend-room-and-board/validate")]
    [Fact]
    public async Task AlternativeRoomAndBoards_ValidatePriceRequest_EmptyRoomVariantArray()
    {
        var query = "/api/v1.0/amend/amend-room-and-board/validate";

        var request = new AmendRoomValidationRequest
        {
            BookingRef = "TestRef",
            SelectedRoomVariant = new AmendRoomVariant(),
            RoomVariants = Enumerable.Empty<AmendRoomVariant>()
        };

        var message = new HttpRequestMessage(HttpMethod.Post, query);
        message.Headers.Add(HeaderNames.Cookie, SessionCookie);
        message.Content = JsonContent.Create(request);

        var response = await Client.SendAsync(message);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Trait("Category", "Integration")]
    [Trait("Api", "/api/v1.0/amend/amend-room-and-board/validate")]
    [Fact]
    public async Task AlternativeRoomAndBoards_ValidatePriceRequest_Success()
    {
        var query = "/api/v1.0/amend/amend-room-and-board/validate";

        var request = new AmendRoomValidationRequest
        {
            BookingRef = "50026858",
            SelectedRoomVariant = new AmendRoomVariant
            {
                Units = new List<Unit>
                {
                    new Unit
                    {
                        Code = "DB01",
                        Board = "HB"
                    }
                },
                OfferPrice = 3442.78m
            },
            RoomVariants = new List<AmendRoomVariant>
            {
                new AmendRoomVariant
                {
                    Units = new List<Unit>
                    {
                        new Unit
                        {
                            Code = "DB01",
                            Board = "HB"
                        }
                    }
                },
                new AmendRoomVariant
                {
                    Units = new List<Unit>
                    {
                        new Unit
                        {
                            Code = "DB01",
                            Board = "HB+"
                        }
                    }
                }
            }
        };

        var message = new HttpRequestMessage(HttpMethod.Post, query);
        message.Headers.Add(HeaderNames.Cookie, SessionCookie);
        message.Content = JsonContent.Create(request);

        var response = await Client.SendAsync(message);
        var responseJson = await response.Content.ReadAsStringAsync();
        var result = JsonConvert.DeserializeObject<List<AmendRoomVariant>>(responseJson);

        using (new AssertionScope())
        {
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            result!.Count.Should().Be(2);
            result.Count(x => x.Units.Any(y => y.Code == "DB01" && y.Board == "HB")).Should().Be(1);
            result.Count(x => x.Units.Any(y => y.Code == "DB01" && y.Board == "HB+")).Should().Be(1);
        }
    }

    [Trait("Category", "Integration")]
    [Trait("Api", "/api/v1.0/amend/commit")]
    [Fact]
    public async Task AlternativeRoomAndBoard_CommitChanges_Success()
    {
        var query = "/api/v1.0/amend/commit";

        var requestJson = await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "AmendController", "RoomAndBoard", "room_and_board_success_commit_request_50039038.json"));

        var message = new HttpRequestMessage(HttpMethod.Post, query);
        message.Headers.Add(HeaderNames.Cookie, CommitSessionCookie);
        message.Content = ComponentTestUtils.GetJsonContent(requestJson);

        var response = await Client.SendAsync(message);

        var content = await response.Content.ReadAsStringAsync();
        var result = JsonConvert.DeserializeObject<BookingResponse>(content);

        using (new AssertionScope())
        {
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            result!.Package.Accom.Rooms.FirstOrDefault()?.Board.Should().Be("HB-");
            result.Package.Accom.Rooms.FirstOrDefault()?.Code.Should().Be("SW04");
        }
    }

    [Trait("Category", "Integration")]
    [Trait("Api", "/api/v1.0/amend/commit")]
    [Fact]
    public async Task AlternativeRoomAndBoard_CommitChanges_AmendmentRestrictions()
    {
        var query = "/api/v1.0/amend/commit";

        var requestJson = await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "AmendController", "RoomAndBoard", "room_and_board_success_commit_request_50039039.json"));

        var message = new HttpRequestMessage(HttpMethod.Post, query);
        message.Headers.Add(HeaderNames.Cookie, CommitSessionCookie);
        message.Content = ComponentTestUtils.GetJsonContent(requestJson);

        var response = await Client.SendAsync(message);
        var content = await response.Content.ReadAsStringAsync();
        var result = JsonConvert.DeserializeObject<Dictionary<string, string>>(content);

        using (new AssertionScope())
        {
            response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
            result!["code"].Should().Be("API-ERR-240017");
        }
    }
}