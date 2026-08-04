using easyJet.Holidays.Api.Domain.Data.AmendBooking.Hotel;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Filters;
using easyJet.Holidays.Api.Domain.Extensions;
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

public class AmendHotelTests : BaseComponentTest
{    

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/amend/amend-hotel/hotel-list")]
    [Fact]
    public async Task AmendHotel_LoadHotelList_InvalidModelState()
    {
        var query = "/api/v1.0/amend/amend-hotel/hotel-list";
        Client.DefaultRequestHeaders.Add(HeaderNames.Cookie,
            $"eJ2Session=238c2ba479046a48d9ef99acf374ad0b4cbc0e410602c7b451c8808023bc171b8481e0ff613a493f4604e60339186a19dd50e8af63e57e83929701b34facac8d&CookieTypeKey=1; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax; httponly");

        var request = new GetAmendHotelListRequest();

        var response = await Client.PostAsJsonAsync(query, request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/amend/amend-hotel/hotel-list")]
    [Fact]
    public async Task AmendHotel_LoadHotelList_Unauthorized()
    {
        var query = "/api/v1.0/amend/amend-hotel/hotel-list";

        var request = new GetAmendHotelListRequest
        {
            BookingRef = "TestBookingRef"
        };

        var response = await Client.PostAsJsonAsync(query, request);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/amend/amend-hotel/hotel-list")]
    [Fact]
    public async Task AmendHotel_LoadHotelList_LoggedAsNonLead()
    {
        var query = "/api/v1.0/amend/amend-hotel/hotel-list";

        Client.DefaultRequestHeaders.Add(HeaderNames.Cookie,
            $"eJ2Session=0cbb0f8ca564b25dc07841e181796f2af0fe6d322a523b768fceba3aa81e9a549afe9ee82f1f7217a89dd7b0c8d520aeb702ad0ea214c58564185e6c8c253ad5&CookieTypeKey=1; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax; httponly");

        var request = new GetAmendHotelListRequest
        {
            BookingRef = "cf7d6549cb4a"
        };

        var response = await Client.PostAsJsonAsync(query, request);
        var content = await response.Content.ReadAsStringAsync();
        var result = JsonConvert.DeserializeObject<Dictionary<string, string>>(content);

        using (new AssertionScope())
        {
            response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
            result!["code"].Should().Be("API-ERR-300002");
        }
    }
    
    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/amend/amend-hotel/hotel-list")]
    [Fact]
    public async Task AmendHotel_LoadHotelList_Success()
    {
        var query = "/api/v1.0/amend/amend-hotel/hotel-list";
        Client.DefaultRequestHeaders.Add(HeaderNames.Cookie,
            $"eJ2Session=238c2ba479046a48d9ef99acf374ad0b4cbc0e410602c7b451c8808023bc171b8481e0ff613a493f4604e60339186a19dd50e8af63e57e83929701b34facac8d&CookieTypeKey=1; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax; httponly");

        var request = new GetAmendHotelListRequest
        {
            BookingRef = "cf7d6549cb4a",
            SearchParameters = new SearchParameters()
        };

        var response = await Client.PostAsJsonAsync(query, request);
        var content = await response.Content.ReadAsStringAsync();
        var result = JsonConvert.DeserializeObject<GetAmendHotelListResponse>(content);

        using (new AssertionScope())
        {
            result!.BookingRef.Should().Be("cf7d6549cb4a");
            result.AmendHotelOffers.Count().Should().Be(1);
            result.AmendHotelOffers.First().Accom.Code.Should().Be("77b1e372f332");
            result.AmendHotelOffers.First().Hotel.Should().NotBeNull();
            result.AmendHotelOffers.First().Transfers.First().Code.Should().Be("ECOV000116SS");
            result.AmendHotelOffers.First().AmendmentChargesInfo.FullAmendmentCharges.Should().Be(-124.15m);
        }
    }
    
    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/amend/amend-hotel/hotel-list")]
    [Fact]
    public async Task AmendHotel_LoadHotelList_GroupPackagesFromDifferentProvider_Success()
    {
        var query = "/api/v1.0/amend/amend-hotel/hotel-list";
        Client.DefaultRequestHeaders.Add(HeaderNames.Cookie,
            $"eJ2Session=238c2ba479046a48d9ef99acf374ad0b4cbc0e410602c7b451c8808023bc171b8481e0ff613a493f4604e60339186a19dd50e8af63e57e83929701b34facac8d&CookieTypeKey=1; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax; httponly");

        var request = new GetAmendHotelListRequest
        {
            BookingRef = "e6405c990657",
            SearchParameters = new SearchParameters()
        };

        var response = await Client.PostAsJsonAsync(query, request);
        var content = await response.Content.ReadAsStringAsync();
        var result = JsonConvert.DeserializeObject<GetAmendHotelListResponse>(content);

        using (new AssertionScope())
        {
            result!.BookingRef.Should().Be("e6405c990657");
            result.AmendHotelOffers.Count().Should().Be(1);
            result.AmendHotelOffers.First().Accom.Code.Should().Be("40c6");
            result.AmendHotelOffers.First().Hotel.Should().NotBeNull();
            result.AmendHotelOffers.First().Transfers.First().Code.Should().Be("ECOV000116SS");
            result.AmendHotelOffers.First().AmendmentChargesInfo.FullAmendmentCharges.Should().Be(-124.15m);
        }
    }
    
    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/amend/amend-hotel/hotel-list")]
    [Fact]
    public async Task AmendHotel_LoadHotelList_CanNotGetBooking()
    {
        var query = "/api/v1.0/amend/amend-hotel/hotel-list";
        Client.DefaultRequestHeaders.Add(HeaderNames.Cookie,
            $"eJ2Session=238c2ba479046a48d9ef99acf374ad0b4cbc0e410602c7b451c8808023bc171b8481e0ff613a493f4604e60339186a19dd50e8af63e57e83929701b34facac8d&CookieTypeKey=1; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax; httponly");

        var request = new GetAmendHotelListRequest
        {
            BookingRef = "b9fb005e9445"
        };

        var response = await Client.PostAsJsonAsync(query, request);
        var content = await response.Content.ReadAsStringAsync();
        var result = JsonConvert.DeserializeObject<Dictionary<string, Object>>(content);

        using (new AssertionScope())
        {
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
            result!["code"].Should().Be("API-ERR-300030");
        }
    }
    
    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/amend/amend-hotel/hotel-list")]
    [Fact]
    public async Task AmendHotel_LoadHotelList_EmptyHotelList()
    {
        var query = "/api/v1.0/amend/amend-hotel/hotel-list";
        Client.DefaultRequestHeaders.Add(HeaderNames.Cookie,
            $"eJ2Session=238c2ba479046a48d9ef99acf374ad0b4cbc0e410602c7b451c8808023bc171b8481e0ff613a493f4604e60339186a19dd50e8af63e57e83929701b34facac8d&CookieTypeKey=1; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax; httponly");

        var request = new GetAmendHotelListRequest
        {
            BookingRef = "d2607de6ceb7"
        };

        var response = await Client.PostAsJsonAsync(query, request);
        var content = await response.Content.ReadAsStringAsync();
        var result = JsonConvert.DeserializeObject<GetAmendHotelListResponse>(content);

        using (new AssertionScope())
        {
            result!.BookingRef.Should().Be("d2607de6ceb7");
            result.AmendHotelOffers.Count().Should().Be(0);
        }
    }
    
    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/amend/amend-hotel/hotel-list")]
    [Fact]
    public async Task AmendHotel_LoadHotelList_ApplyFiltersAndSorting_Success()
    {
        var query = "/api/v1.0/amend/amend-hotel/hotel-list";
        Client.DefaultRequestHeaders.Add(HeaderNames.Cookie,
            $"eJ2Session=238c2ba479046a48d9ef99acf374ad0b4cbc0e410602c7b451c8808023bc171b8481e0ff613a493f4604e60339186a19dd50e8af63e57e83929701b34facac8d&CookieTypeKey=1; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax; httponly");

        var request = new GetAmendHotelListRequest
        {
            BookingRef = "2fa10fe9cdc0",
            SearchParameters = new SearchParameters
            {
                BoardType = "AI",
                Facilities = "73-360",
                TripAdvisorRating = 4,
                StarRating = "4",
                SortingBy = SortParameter.PriceAsc
            }
        };

        var response = await Client.PostAsJsonAsync(query, request);
        var content = await response.Content.ReadAsStringAsync();
        var result = JsonConvert.DeserializeObject<GetAmendHotelListResponse>(content);

        using (new AssertionScope())
        {
            result!.BookingRef.Should().Be("2fa10fe9cdc0");
            result.Filters.Should().Contain(x => x.Code == AvailableFilters.Board);
            result.Filters.Should().Contain(x => x.Code == AvailableFilters.StarRating);
            result.Filters.Should().Contain(x => x.Code == AvailableFilters.TripadvisorRating);
            result.Filters.Should().Contain(x => x.Code == AvailableFilters.Facilities);

            result.Status.Total.Should().Be(2);
            result.Status.MinPrice.Should().Be(-3418.0m);
            result.Status.MaxPrice.Should().Be(-3340.0m);

            result.AmendHotelOffers.ToArray()[0].AmendmentChargesInfo.FullAmendmentCharges.Should().Be(-3418.0m);
            result.AmendHotelOffers.ToArray()[0].Accom.Code.Should().Be("b9fd99daccfa");
            result.AmendHotelOffers.ToArray()[1].AmendmentChargesInfo.FullAmendmentCharges.Should().Be(-3339.51m);
            result.AmendHotelOffers.ToArray()[1].Accom.Code.Should().Be("60f9b863");

            result.SortingBy.Should().NotBeEmpty();
        }
    }
    
    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/amend/amend-hotel/validate")]
    [Fact]
    public async Task AmendHotel_Validate_InvalidModelState()
    {
        var query = "/api/v1.0/amend/amend-hotel/validate";
        Client.DefaultRequestHeaders.Add(HeaderNames.Cookie,
            $"eJ2Session=238c2ba479046a48d9ef99acf374ad0b4cbc0e410602c7b451c8808023bc171b8481e0ff613a493f4604e60339186a19dd50e8af63e57e83929701b34facac8d&CookieTypeKey=1; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax; httponly");

        var request = new AmendHotelRequest();

        var response = await Client.PostAsJsonAsync(query, request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/amend/amend-hotel/validate")]
    [Fact]
    public async Task AmendHotel_Validate_Unauthorized()
    {
        var query = "/api/v1.0/amend/amend-hotel/validate";

        var request = new AmendHotelRequest
        {
            BookingRef = "TestBookingRef",
            AmendHotelOffer = new AmendHotelOffer()
        };

        var response = await Client.PostAsJsonAsync(query, request);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/amend/amend-hotel/validate")]
    [Fact]
    public async Task AmendHotel_Validate_LoggedAsNonLead()
    {
        var query = "/api/v1.0/amend/amend-hotel/validate";

        Client.DefaultRequestHeaders.Add(HeaderNames.Cookie,
            $"eJ2Session=0cbb0f8ca564b25dc07841e181796f2af0fe6d322a523b768fceba3aa81e9a549afe9ee82f1f7217a89dd7b0c8d520aeb702ad0ea214c58564185e6c8c253ad5&CookieTypeKey=1; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax; httponly");

        var request =
            ComponentTestUtils.GetJsonString(
                @"WebApi/AmendController/AmendHotel/AmendHotelRequest_7ceb31bd6b96.json");

        var response = await Client.PostAsync(query, ComponentTestUtils.GetJsonContent(request));
        var content = await response.Content.ReadAsStringAsync();
        var result = JsonConvert.DeserializeObject<Dictionary<string, string>>(content);

        using (new AssertionScope())
        {
            response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
            result!["code"].Should().Be("API-ERR-300002");
        }
    }
    
    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/amend/amend-hotel/alternative-rooms-and-boards")]
    [Fact]
    public async Task AmendHotel_LoadRoomAndBoard_Success()
    {
        var query = "/api/v1.0/amend/amend-hotel/alternative-rooms-and-boards";

        var request =
            ComponentTestUtils.GetJsonString(@"WebApi\AmendController\AmendHotel\RoomAndBoard\room-and-board-success-55d0732d4b3c.json");

        var httpRequestMessage = new HttpRequestMessage(HttpMethod.Post, query)
        {
            Content = ComponentTestUtils.GetJsonContent(request)
        };

        httpRequestMessage.Headers.Add(HeaderNames.Cookie,
            $"eJ2Session=82545b4075d7d427afb80b5b412d398390a0446229a82cd629ed07c4cd47fcf7be4ed32121693b6b883bc5dc9ad11f39bf542ffd3f64e5d36ae7af68c062e50c&CookieTypeKey=1; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax; httponly");

        var response = await Client.SendAsync(httpRequestMessage);
        var content = await response.Content.ReadAsStringAsync();
        var result = JsonConvert.DeserializeObject<GetAmendHotelRoomsResponse>(content);

        using (new AssertionScope())
        {
            result!.UpsellAmount.Should().Be(124);

            result.AmendHotelOffers.Count().Should().Be(5);

            result.AmendHotelOffers.Should().ContainSingle(x =>
                x.AmendHotelOffer.Accom.Unit.First().Code.Equals("STU01") 
                && x.AmendHotelOffer.Accom.Unit.First().Board.Equals("BB")
                && x.AmendHotelOffer.AmendmentChargesInfo.AmendmentCharges == 124
                && x.AmendHotelOffer.AmendmentChargesInfo.FullAmendmentCharges == 11.4m
                && x.AmendHotelOffer.AmendmentChargesInfo.OfferPrice == 1697.92m
                );
            
            result.AmendHotelOffers.Should().ContainSingle(x =>
                x.AmendHotelOffer.Accom.Unit.First().Code.Equals("STU01")
                && x.AmendHotelOffer.Accom.Unit.First().Board.Equals("HB")
                && x.AmendHotelOffer.AmendmentChargesInfo.AmendmentCharges == 484.00m
                && x.AmendHotelOffer.AmendmentChargesInfo.FullAmendmentCharges == 371.40m
                && x.AmendHotelOffer.AmendmentChargesInfo.OfferPrice == 2057.92m
            );

            result.AmendHotelOffers.Should().ContainSingle(x =>
                x.AmendHotelOffer.Accom.Unit.First().Code.Equals("1BA01")
                && x.AmendHotelOffer.Accom.Unit.First().Board.Equals("SC")
                && x.AmendHotelOffer.AmendmentChargesInfo.AmendmentCharges == 163.98m
                && x.AmendHotelOffer.AmendmentChargesInfo.FullAmendmentCharges == 51.38m
                && x.AmendHotelOffer.AmendmentChargesInfo.OfferPrice == 1737.90m
            );

            result.AmendHotelOffers.Should().ContainSingle(x =>
                x.AmendHotelOffer.Accom.Unit.First().Code.Equals("1BA01")
                && x.AmendHotelOffer.Accom.Unit.First().Board.Equals("BB")
                && x.AmendHotelOffer.AmendmentChargesInfo.AmendmentCharges == 307.98m
                && x.AmendHotelOffer.AmendmentChargesInfo.FullAmendmentCharges == 195.38m
                && x.AmendHotelOffer.AmendmentChargesInfo.OfferPrice == 1881.90m
            );

            result.AmendHotelOffers.Should().ContainSingle(x =>
                x.AmendHotelOffer.Accom.Unit.First().Code.Equals("1BA01")
                && x.AmendHotelOffer.Accom.Unit.First().Board.Equals("HB")
                && x.AmendHotelOffer.AmendmentChargesInfo.AmendmentCharges == 667.98m
                && x.AmendHotelOffer.AmendmentChargesInfo.FullAmendmentCharges == 555.38m
                && x.AmendHotelOffer.AmendmentChargesInfo.OfferPrice == 2241.90m
            );
        }
    }
    
    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/amend/amend-hotel/alternative-rooms-and-boards")]
    [Fact]
    public async Task AmendHotel_LoadRoomAndBoard_InvalidModelState()
    {
        var query = "/api/v1.0/amend/amend-hotel/alternative-rooms-and-boards";
        
        var request = new AmendHotelRequest();

        var httpRequestMessage = new HttpRequestMessage(HttpMethod.Post, query)
        {
            Content = ComponentTestUtils.SerializeObjectAsJsonBody(request)
        };

        httpRequestMessage.Headers.Add(HeaderNames.Cookie,
            "eJ2Session=82545b4075d7d427afb80b5b412d398390a0446229a82cd629ed07c4cd47fcf7be4ed32121693b6b883bc5dc9ad11f39bf542ffd3f64e5d36ae7af68c062e50c&CookieTypeKey=1; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax; httponly");

        var response = await Client.SendAsync(httpRequestMessage);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
    
    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/amend/amend-hotel/alternative-rooms-and-boards")]
    [Fact]
    public async Task AmendHotel_LoadRoomAndBoard_Unauthorized()
    {
        var query = "/api/v1.0/amend/amend-hotel/alternative-rooms-and-boards";

        var request = new AmendHotelRequest
        {
            BookingRef = "TestBookingRef",
            AmendHotelOffer = new AmendHotelOffer()
        };

        var response = await Client.PostAsJsonAsync(query, request);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/amend/amend-hotel/alternative-rooms-and-boards")]
    [Fact]
    public async Task AmendHotel_LoadRoomAndBoard_LoggedAsNonLead()
    {
        var query = "/api/v1.0/amend/amend-hotel/alternative-rooms-and-boards";

        Client.DefaultRequestHeaders.Add(HeaderNames.Cookie,
            $"eJ2Session=238c2ba479046a48d9ef99acf374ad0b4cbc0e410602c7b451c8808023bc171b8481e0ff613a493f4604e60339186a19dd50e8af63e57e83929701b34facac8d&CookieTypeKey=1; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax; httponly");

        var request = new AmendHotelRequest
        {
            BookingRef = "4b9f444a32fb",
            AmendHotelOffer = new AmendHotelOffer()
        };

        var response = await Client.PostAsJsonAsync(query, request);
        var content = await response.Content.ReadAsStringAsync();
        var result = JsonConvert.DeserializeObject<Dictionary<string, string>>(content);

        using (new AssertionScope())
        {
            response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
            result!["code"].Should().Be("API-ERR-300002");
        }
    }
    
    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/amend/amend-hotel/alternative-rooms-and-boards")]
    [Fact]
    public async Task AmendHotel_LoadRoomAndBoard_CanNotGetBooking()
    {
        var query = "/api/v1.0/amend/amend-hotel/alternative-rooms-and-boards";
        Client.DefaultRequestHeaders.Add(HeaderNames.Cookie,
            $"eJ2Session=238c2ba479046a48d9ef99acf374ad0b4cbc0e410602c7b451c8808023bc171b8481e0ff613a493f4604e60339186a19dd50e8af63e57e83929701b34facac8d&CookieTypeKey=1; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax; httponly");

        var request = new AmendHotelRequest
        {
            BookingRef = "b9fb005e9445",
            AmendHotelOffer = new AmendHotelOffer()
        };

        var response = await Client.PostAsJsonAsync(query, request);
        var content = await response.Content.ReadAsStringAsync();
        var result = JsonConvert.DeserializeObject<Dictionary<string, Object>>(content);

        using (new AssertionScope())
        {
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
            result!["code"].Should().Be("API-ERR-300030");
        }
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/amend/commit")]
    [Fact]
    public async Task AmendHotel_CommitChanges_Success()
    {
        var query = "/api/v1.0/amend/commit";
        
        Client.DefaultRequestHeaders.Add(HeaderNames.Cookie,
            $"eJ2Session=82545b4075d7d427afb80b5b412d398390a0446229a82cd629ed07c4cd47fcf7be4ed32121693b6b883bc5dc9ad11f39bf542ffd3f64e5d36ae7af68c062e50c&CookieTypeKey=1; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax; httponly");
        
        var request =
            ComponentTestUtils.GetJsonString(@"WebApi/AmendController/AmendHotel/Commit/AmendBookingRequest_14860f53eba2.json");
        
        var response = await Client.PostAsync(query, ComponentTestUtils.GetJsonContent(request));
        var content = await response.Content.ReadAsStringAsync();
        var result = JsonConvert.DeserializeObject<BookingResponse>(content);

        using (new AssertionScope())
        {
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            result!.BookingReference.Should().Be("14860f53eba2");
            result.Package.Accom.Code.Should().Be("d53eb98e");
            result.Package.Accom.Rooms.First().Code.Should().Be("DB01");
            result.Package.Accom.Rooms.First().Board.Should().Be("BB");
        }
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/amend/amend-hotel/alternative-transfers")]
    [Fact]
    public async Task AmendHotel_LoadTransfer_Success()
    {
        var query = "/api/v1.0/amend/amend-hotel/alternative-transfers";
        
        Client.DefaultRequestHeaders.Add(HeaderNames.Cookie,
            $"eJ2Session=82545b4075d7d427afb80b5b412d398390a0446229a82cd629ed07c4cd47fcf7be4ed32121693b6b883bc5dc9ad11f39bf542ffd3f64e5d36ae7af68c062e50c&CookieTypeKey=1; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax; httponly");

        var request = 
            ComponentTestUtils.GetJsonString(@"WebApi/AmendController/AmendHotel/Transfers/transfers-success-ebb25aaf5171.json");

        var response = await Client.PostAsync(query, ComponentTestUtils.GetJsonContent(request));
        var content = await response.Content.ReadAsStringAsync();
        var result = JsonConvert.DeserializeObject<IEnumerable<AmendHotelResponse>>(content)!.ToList();

        using (new AssertionScope())
        {
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            result.IsNullOrEmpty().Should().BeFalse();
            result.Count.Should().Be(2);

            result[0].AmendHotelOffer.Transfers.First().Code.Should().Be("W2MS013809PP");
            result[0].AmendHotelOffer.Transfers.First().Type.Should().Be(TransferItemType.Private);
            result[0].AmendHotelOffer.Transfers.First().IconUrl.Should().NotBeNullOrWhiteSpace();
            result[0].AmendHotelOffer.Transfers.First().TransferInfo.ArrivalInstructions.Should().NotBeNullOrWhiteSpace();
            result[0].AmendHotelOffer.Transfers.First().TransferInfo.DepInstructions.Should().NotBeNullOrWhiteSpace();
            result[0].AmendHotelOffer.Transfers.First().TransferInfo.Duration.Should().Be(30);
            result[0].AmendHotelOffer.AmendmentChargesInfo.BookingPrice.Should().Be(1863.20m);
            result[0].AmendHotelOffer.AmendmentChargesInfo.OfferPrice.Should().Be(1753.78m);
            result[0].AmendHotelOffer.AmendmentChargesInfo.SeatsPrice.Should().Be(0m);
            result[0].AmendHotelOffer.AmendmentChargesInfo.ExtraLuggagePrice.Should().Be(0m);
            result[0].AmendHotelOffer.AmendmentChargesInfo.AmendmentCharges.Should().Be(96.94m);
            result[0].AmendHotelOffer.AmendmentChargesInfo.FullAmendmentCharges.Should().Be(-109.42m);
            
            result[1].AmendHotelOffer.Transfers.First().Code.Should().Be("W2MS013810NS");
            result[1].AmendHotelOffer.Transfers.First().Type.Should().Be(TransferItemType.NoTransfer);
            result[1].AmendHotelOffer.Transfers.First().IconUrl.Should().NotBeNullOrWhiteSpace();
            result[1].AmendHotelOffer.AmendmentChargesInfo.BookingPrice.Should().Be(1863.20m);
            result[1].AmendHotelOffer.AmendmentChargesInfo.OfferPrice.Should().Be(1656.84m);
            result[1].AmendHotelOffer.AmendmentChargesInfo.SeatsPrice.Should().Be(0m);
            result[1].AmendHotelOffer.AmendmentChargesInfo.ExtraLuggagePrice.Should().Be(0m);
            result[1].AmendHotelOffer.AmendmentChargesInfo.AmendmentCharges.Should().Be(0m);
            result[1].AmendHotelOffer.AmendmentChargesInfo.FullAmendmentCharges.Should().Be(-206.36m);
        }
    }
    
    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/amend/amend-hotel/alternative-transfers")]
    [Fact]
    public async Task AmendHotel_LoadTransfer_InvalidModelState()
    {
        var query = "/api/v1.0/amend/amend-hotel/alternative-transfers";
        Client.DefaultRequestHeaders.Add(HeaderNames.Cookie,
            $"eJ2Session=82545b4075d7d427afb80b5b412d398390a0446229a82cd629ed07c4cd47fcf7be4ed32121693b6b883bc5dc9ad11f39bf542ffd3f64e5d36ae7af68c062e50c&CookieTypeKey=1; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax; httponly");
        
        var request = new AmendHotelRequest();

        var response = await Client.PostAsJsonAsync(query, request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
    
    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/amend/amend-hotel/alternative-transfers")]
    [Fact]
    public async Task AmendHotel_LoadTransfer_Unauthorized()
    {
        var query = "/api/v1.0/amend/amend-hotel/alternative-transfers";

        var request = new AmendHotelRequest
        {
            BookingRef = "TestBookingRef",
            AmendHotelOffer = new AmendHotelOffer()
        };

        var response = await Client.PostAsJsonAsync(query, request);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/amend/amend-hotel/alternative-transfers")]
    [Fact]
    public async Task AmendHotel_LoadTransfer_LoggedAsNonLead()
    {
        var query = "/api/v1.0/amend/amend-hotel/alternative-transfers";

        Client.DefaultRequestHeaders.Add(HeaderNames.Cookie,
            $"eJ2Session=238c2ba479046a48d9ef99acf374ad0b4cbc0e410602c7b451c8808023bc171b8481e0ff613a493f4604e60339186a19dd50e8af63e57e83929701b34facac8d&CookieTypeKey=1; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax; httponly");

        var request = new AmendHotelRequest
        {
            BookingRef = "4b9f444a32fb",
            AmendHotelOffer = new AmendHotelOffer()
        };

        var response = await Client.PostAsJsonAsync(query, request);
        var content = await response.Content.ReadAsStringAsync();
        var result = JsonConvert.DeserializeObject<Dictionary<string, string>>(content);

        using (new AssertionScope())
        {
            response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
            result!["code"].Should().Be("API-ERR-300002");
        }
    }
    
    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/amend/amend-hotel/alternative-transfers")]
    [Fact]
    public async Task AmendHotel_LoadTransfer_CanNotGetBooking()
    {
        var query = "/api/v1.0/amend/amend-hotel/alternative-transfers";
        Client.DefaultRequestHeaders.Add(HeaderNames.Cookie,
            $"eJ2Session=238c2ba479046a48d9ef99acf374ad0b4cbc0e410602c7b451c8808023bc171b8481e0ff613a493f4604e60339186a19dd50e8af63e57e83929701b34facac8d&CookieTypeKey=1; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax; httponly");

        var request = new AmendHotelRequest
        {
            BookingRef = "b9fb005e9445",
            AmendHotelOffer = new AmendHotelOffer()
        };

        var response = await Client.PostAsJsonAsync(query, request);
        var content = await response.Content.ReadAsStringAsync();
        var result = JsonConvert.DeserializeObject<Dictionary<string, Object>>(content);

        using (new AssertionScope())
        {
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
            result!["code"].Should().Be("API-ERR-300030");
        }
    }
}