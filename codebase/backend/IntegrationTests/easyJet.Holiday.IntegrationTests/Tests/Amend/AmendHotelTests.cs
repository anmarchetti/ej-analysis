using Allure.Xunit.Attributes;
using Allure.Xunit.Attributes.Steps;
using easyJet.Holiday.IntegrationTests.Infrastructure.Repeat;
using easyJet.Holiday.IntegrationTests.Infrastructure.TestApi;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Hotel;
using FluentAssertions;
using FluentAssertions.Execution;
using Refit;
using System.Globalization;
using System.Net;
using Xunit.Abstractions;
using GetAmendHotelListRequest = easyJet.Holidays.Api.Domain.Data.AmendBooking.Hotel.GetAmendHotelListRequest;

namespace easyJet.Holiday.IntegrationTests.Tests.Amend;

[AllureSuite("Amendment tests")]
[AllureSubSuite("Amend hotel")]
[AllureOwner("Manage team")]
public class AmendHotelTests(
    IHttpClientFactory httpClientFactory,
    TestApiHttpClient testApiHttpClient,
    ITestOutputHelper testOutputHelper)
    : BaseTest(httpClientFactory, testApiHttpClient, testOutputHelper)
{
    [Fact(DisplayName = "Load alternative hotel option.")]
    public async Task AmendHotel_LoadAlternativeHotelList_WithoutFilter_Success()
    {
        var response = await RepeatDecorator<ApiResponse<GetAmendHotelListResponse>>
            .Create()
            .RepeatTimes(3)
            .Execute(async () =>
            {
                var bookingContext = await CreateBookingStep();
                var loginCookie = bookingContext.Content?.CustomerCredentials!.LoginCookie;
                var request = new GetAmendHotelListRequest
                {
                    BookingRef = bookingContext.Content?.BookingResponse.BookingReference
                };
                var alternativeHotelList = await GetAlternativeHotelListStep(request, loginCookie);
                return alternativeHotelList;
            });

        using (new AssertionScope())
        {
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            response.Content?.AmendHotelOffers.Should().NotBeNullOrEmpty();
            response.Content?.Filters.Should().NotBeNullOrEmpty();
        }
    }
    
    [Fact(DisplayName = "Load alternative hotel option with star rating more than 4")]
    public async Task AmendHotel_LoadAlternativeHotelList_WithStartRatingFilter_Success()
    {
        var response = await RepeatDecorator<ApiResponse<GetAmendHotelListResponse>>
            .Create()
            .RepeatTimes(3)
            .Execute(async () =>
            {
                var bookingContext = await CreateBookingStep();
                var loginCookie = bookingContext.Content?.CustomerCredentials!.LoginCookie;
                var request = new GetAmendHotelListRequest
                {
                    BookingRef = bookingContext.Content?.BookingResponse.BookingReference,
                    SearchParameters = new SearchParameters
                    {
                        PageSize = 10,
                        Page = 1,
                        StarRating = "4"
                    }
                };
                var alternativeHotelList = await GetAlternativeHotelListStep(request, loginCookie);
                return alternativeHotelList;
            });

        using (new AssertionScope())
        {
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            response.Content?.AmendHotelOffers.Should().NotBeNullOrEmpty();
            response.Content?.Filters.Should().NotBeNullOrEmpty();
            response.Content?.AmendHotelOffers.Select(x => Convert.ToDouble(x.Hotel.StarRating, CultureInfo.InvariantCulture)).Should().AllSatisfy(x =>
            {
                x.Should().BeGreaterThanOrEqualTo(4d);
            });
        }
    }
    
    [Fact(DisplayName = "Load alternative hotel option with trip advisor rating more than 4")]
    public async Task AmendHotel_LoadAlternativeHotelList_WithTripAdvisorRatingFilter_Success()
    {
        var response = await RepeatDecorator<ApiResponse<GetAmendHotelListResponse>>
            .Create()
            .RepeatTimes(3)
            .Execute(async () =>
            {
                var bookingContext = await CreateBookingStep();
                var loginCookie = bookingContext.Content?.CustomerCredentials!.LoginCookie;
                var request = new GetAmendHotelListRequest
                {
                    BookingRef = bookingContext.Content?.BookingResponse.BookingReference,
                    SearchParameters = new SearchParameters
                    {
                        PageSize = 10,
                        Page = 1,
                        TripAdvisorRating = 4
                    }
                };
                var alternativeHotelList = await GetAlternativeHotelListStep(request, loginCookie);
                return alternativeHotelList;
            });

        using (new AssertionScope())
        {
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            response.Content?.AmendHotelOffers.Should().NotBeNullOrEmpty();
            response.Content?.Filters.Should().NotBeNullOrEmpty();
            response.Content?.AmendHotelOffers.Select(x => x.Hotel.TripAdvisorRating).Should().AllSatisfy(x =>
            {
                x.Should().BeGreaterThan(4d);
            });
        }
    }
    
    [Fact(DisplayName = "Load alternative hotel option with 'HB' board")]
    public async Task AmendHotel_LoadAlternativeHotelList_WithBoardFilter_Success()
    {
        var response = await RepeatDecorator<ApiResponse<GetAmendHotelListResponse>>
            .Create()
            .RepeatTimes(3)
            .Execute(async () =>
            {
                var bookingContext = await CreateBookingStep();
                var loginCookie = bookingContext.Content?.CustomerCredentials!.LoginCookie;
                var request = new GetAmendHotelListRequest
                {
                    BookingRef = bookingContext.Content?.BookingResponse.BookingReference,
                    SearchParameters = new SearchParameters
                    {
                        PageSize = 10,
                        Page = 1,
                        BoardType = "HB"
                    }
                };
                var alternativeHotelList = await GetAlternativeHotelListStep(request, loginCookie);
                return alternativeHotelList;
            });

        using (new AssertionScope())
        {
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            response.Content?.AmendHotelOffers.Should().NotBeNullOrEmpty();
            response.Content?.Filters.Should().NotBeNullOrEmpty();
            response.Content?.AmendHotelOffers.SelectMany(x => x.Accom.Unit.Select(y=>y.Board)).Should().AllSatisfy(x =>
            {
                x.Should().Be("HB");
            });
        }
    }
    
    [Fact(DisplayName = "Load alternative hotel option with 'Spa' facilities")]
    public async Task AmendHotel_LoadAlternativeHotelList_WithFacilitiesFilter_Success()
    {
        var response = await RepeatDecorator<ApiResponse<GetAmendHotelListResponse>>
            .Create()
            .RepeatTimes(3)
            .Execute(async () =>
            {
                var bookingContext = await CreateBookingStep();
                var loginCookie = bookingContext.Content?.CustomerCredentials!.LoginCookie;
                var request = new GetAmendHotelListRequest
                {
                    BookingRef = bookingContext.Content?.BookingResponse.BookingReference,
                    SearchParameters = new SearchParameters
                    {
                        PageSize = 10,
                        Page = 1,
                        Facilities = "74-620"
                    }
                };
                var alternativeHotelList = await GetAlternativeHotelListStep(request, loginCookie);
                return alternativeHotelList;
            });

        using (new AssertionScope())
        {
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            response.Content?.AmendHotelOffers.Should().NotBeNullOrEmpty();
            response.Content?.Filters.Should().NotBeNullOrEmpty();
            response.Content?.AmendHotelOffers.Should().AllSatisfy(x =>
            {
                x.Hotel.Facilities.SelectMany(y => y.Items).Should().Contain(z =>
                    z.Name.Equals("Spa centre", StringComparison.OrdinalIgnoreCase));
            });
        }
    }
    
    [Fact(DisplayName = "Load alternative hotel option in the selected price range")]
    public async Task AmendHotel_LoadAlternativeHotelList_WithPriceFilter_Success()
    {
        var response = await RepeatDecorator<ApiResponse<GetAmendHotelListResponse>>
            .Create()
            .RepeatTimes(3)
            .Execute(async () =>
            {
                var bookingContext = await CreateBookingStep();
                var loginCookie = bookingContext.Content?.CustomerCredentials!.LoginCookie;
                var request = new GetAmendHotelListRequest
                {
                    BookingRef = bookingContext.Content?.BookingResponse.BookingReference,
                    SearchParameters = new SearchParameters
                    {
                        PageSize = 10,
                        Page = 1,
                        PriceFrom = 1400,
                        PriceTo = 1600
                    }
                };
                var alternativeHotelList = await GetAlternativeHotelListStep(request, loginCookie);
                return alternativeHotelList;
            });

        using (new AssertionScope())
        {
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            response.Content?.AmendHotelOffers.Should().NotBeNullOrEmpty();
            response.Content?.Filters.Should().NotBeNullOrEmpty();
            response.Content?.AmendHotelOffers.Should().AllSatisfy(x =>
            {
                x.AmendmentChargesInfo.BookingPrice.Should().BeInRange(1400, 1600);
            });
        }
    }
    
    [Fact(DisplayName = "Load sorted by PRICE ASC alternative hotel option")]
    public async Task AmendHotel_LoadAlternativeHotelList_SortedByPriceAsc_Success()
    {
        var response = await RepeatDecorator<ApiResponse<GetAmendHotelListResponse>>
            .Create()
            .RepeatTimes(3)
            .Execute(async () =>
            {
                var bookingContext = await CreateBookingStep();
                var loginCookie = bookingContext.Content?.CustomerCredentials!.LoginCookie;
                var request = new GetAmendHotelListRequest
                {
                    BookingRef = bookingContext.Content?.BookingResponse.BookingReference,
                    SearchParameters = new SearchParameters
                    {
                        PageSize = 10,
                        Page = 1,
                        SortingBy = SortParameter.PriceAsc
                    }
                };
                var alternativeHotelList = await GetAlternativeHotelListStep(request, loginCookie);
                return alternativeHotelList;
            });

        using (new AssertionScope())
        {
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            response.Content?.AmendHotelOffers.Should().NotBeNullOrEmpty();
            response.Content?.Filters.Should().NotBeNullOrEmpty();
            response.Content?.AmendHotelOffers.Should()
                .BeInAscendingOrder(x => x.AmendmentChargesInfo.FullAmendmentCharges);
        }
    }
    
    [Fact(DisplayName = "Load sorted by PRICE DESC alternative hotel option")]
    public async Task AmendHotel_LoadAlternativeHotelList_SortedByPriceDesc_Success()
    {
        var response = await RepeatDecorator<ApiResponse<GetAmendHotelListResponse>>
            .Create()
            .RepeatTimes(3)
            .Execute(async () =>
            {
                var bookingContext = await CreateBookingStep();
                var loginCookie = bookingContext.Content?.CustomerCredentials!.LoginCookie;
                var request = new GetAmendHotelListRequest
                {
                    BookingRef = bookingContext.Content?.BookingResponse.BookingReference,
                    SearchParameters = new SearchParameters
                    {
                        PageSize = 10,
                        Page = 1,
                        SortingBy = SortParameter.PriceDesc
                    }
                };
                var alternativeHotelList = await GetAlternativeHotelListStep(request, loginCookie);
                return alternativeHotelList;
            });

        using (new AssertionScope())
        {
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            response.Content?.AmendHotelOffers.Should().NotBeNullOrEmpty();
            response.Content?.Filters.Should().NotBeNullOrEmpty();
            response.Content?.AmendHotelOffers.Should()
                .BeInDescendingOrder(x => x.AmendmentChargesInfo.FullAmendmentCharges);
        }
    }
    
    [Fact(DisplayName = "Load sorted by TRIPADVISOR Desc alternative hotel option")]
    public async Task AmendHotel_LoadAlternativeHotelList_SortedByTripAdvisor_Success()
    {
        var response = await RepeatDecorator<ApiResponse<GetAmendHotelListResponse>>
            .Create()
            .RepeatTimes(3)
            .Execute(async () =>
            {
                var bookingContext = await CreateBookingStep();
                var loginCookie = bookingContext.Content?.CustomerCredentials!.LoginCookie;
                var request = new GetAmendHotelListRequest
                {
                    BookingRef = bookingContext.Content?.BookingResponse.BookingReference,
                    SearchParameters = new SearchParameters
                    {
                        PageSize = 10,
                        Page = 1,
                        SortingBy = SortParameter.TripAdvisorDesc
                    }
                };
                var alternativeHotelList = await GetAlternativeHotelListStep(request, loginCookie);
                return alternativeHotelList;
            });

        using (new AssertionScope())
        {
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            response.Content?.AmendHotelOffers.Should().NotBeNullOrEmpty();
            response.Content?.Filters.Should().NotBeNullOrEmpty();
            response.Content?.AmendHotelOffers.Should()
                .BeInDescendingOrder(x => x.Hotel.TripAdvisorRating);
        }
    }

    [Fact(DisplayName = "Can not to load hotel list as unauthorized or non lead passenger user")]
    public async Task AmendHotel_LoadAlternativeHotelList_UnAuthorized()
    {
        var response = await RepeatDecorator<ApiResponse<GetAmendHotelListResponse>>
            .Create()
            .RepeatTimes(3)
            .Execute(async () =>
            {
                var bookingContext = await CreateBookingStep();
                var loginCookie = bookingContext.Content?.CustomerCredentials!.LoginCookie;
                var request = new GetAmendHotelListRequest
                {
                    BookingRef = bookingContext.Content?.BookingResponse.BookingReference
                };
                var alternativeHotelList = await GetAlternativeHotelListStep(request, "Salt");
                return alternativeHotelList;
            });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
    
    [Fact(DisplayName = "Can not to validate hotel as unauthorized or non lead passenger user")]
    public async Task AmendHotel_ValidateAlternative_UnAuthorized()
    {
        var response = await RepeatDecorator<ApiResponse<AmendHotelResponse>>
            .Create()
            .RepeatTimes(3)
            .Execute(async () =>
            {
                var bookingContext = await CreateBookingStep();
                var loginCookie = bookingContext.Content?.CustomerCredentials!.LoginCookie;
                var request = new AmendHotelRequest
                {
                    BookingRef = "Tests",
                    AmendHotelOffer = new AmendHotelOffer()
                };
                var validateAlternativeHotel = await ValidateAlternativeHotel(request, "Salt");
                return validateAlternativeHotel;
            });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
    
    [Fact(DisplayName = "Invalid validation request")]
    public async Task AmendHotel_ValidateAlternative_InvalidRequest()
    {
        var response = await RepeatDecorator<ApiResponse<AmendHotelResponse>>
            .Create()
            .RepeatTimes(3)
            .Execute(async () =>
            {
                var bookingContext = await CreateBookingStep();
                var loginCookie = bookingContext.Content?.CustomerCredentials!.LoginCookie;
                var request = new AmendHotelRequest
                {
                    BookingRef = "",
                    AmendHotelOffer = new AmendHotelOffer()
                };
                var validateAlternativeHotel = await ValidateAlternativeHotel(request, loginCookie);
                return validateAlternativeHotel;
            });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
    
    [Fact(DisplayName = "Success validation for alternative hotel option.")]
    public async Task AmendHotel_ValidateAlternative_Success()
    {
        var response = await RepeatDecorator<ApiResponse<AmendHotelResponse>>
            .Create()
            .RepeatTimes(3)
            .Execute(async () =>
            {
                var bookingContext = await CreateBookingStep();
                var loginCookie = bookingContext.Content?.CustomerCredentials!.LoginCookie;
                var request = new GetAmendHotelListRequest
                {
                    BookingRef = bookingContext.Content?.BookingResponse.BookingReference,
                    SearchParameters = new SearchParameters
                    {
                        PageSize = 10,
                        Page = 1
                    }
                };
                var alternativeHotelList = await GetAlternativeHotelListStep(request, loginCookie);

                var validationRequest = new AmendHotelRequest
                {
                    BookingRef = bookingContext.Content?.BookingResponse.BookingReference,
                    AmendHotelOffer = alternativeHotelList.Content?.AmendHotelOffers.First()
                };
                
                var validateAlternativeHotel = await ValidateAlternativeHotel(validationRequest, loginCookie);
                return validateAlternativeHotel;
            });

        using (new AssertionScope())
        {
            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }
    }
    
    [Fact(DisplayName = "Load alternative rooms for selected hotel option.")]
    public async Task AmendHotel_LoadAlternativeRooms_Success()
    {
        var alternativeRoomsApiResponse = await RepeatDecorator<ApiResponse<GetAmendHotelRoomsResponse>>
            .Create()
            .RepeatTimes(3)
            .Execute(async () =>
            {
                var bookingContext = await CreateBookingStep();
                var loginCookie = bookingContext.Content?.CustomerCredentials!.LoginCookie;
                var request = new GetAmendHotelListRequest
                {
                    BookingRef = bookingContext.Content?.BookingResponse.BookingReference,
                    SearchParameters = new SearchParameters
                    {
                        PageSize = 10,
                        Page = 1
                    }
                };
                var alternativeHotelList = await GetAlternativeHotelListStep(request, loginCookie);

                var validationRequest = new AmendHotelRequest
                {
                    BookingRef = bookingContext.Content?.BookingResponse.BookingReference,
                    AmendHotelOffer = alternativeHotelList.Content?.AmendHotelOffers.First()
                };
                
                var loadAlternativeRooms = await LoadAlternativeRooms(validationRequest, loginCookie);
                return loadAlternativeRooms;
            });

        using (new AssertionScope())
        {
            alternativeRoomsApiResponse.StatusCode.Should().Be(HttpStatusCode.OK);
            alternativeRoomsApiResponse.Content?.UpsellAmount.Should().BeGreaterOrEqualTo(0);
            alternativeRoomsApiResponse.Content?.AmendHotelOffers.Count().Should().BeGreaterOrEqualTo(0);
        }
    }
    
    [Fact(DisplayName = "Can not load alternative rooms for selected hotel option as unauthorized or non lead passenger.")]
    public async Task AmendHotel_LoadAlternativeRooms_Unauthorized()
    {
        var alternativeRoomsApiResponse = await RepeatDecorator<ApiResponse<GetAmendHotelRoomsResponse>>
            .Create()
            .RepeatTimes(3)
            .Execute(async () =>
            {
                var bookingContext = await CreateBookingStep();
                var loginCookie = bookingContext.Content?.CustomerCredentials!.LoginCookie;
                var request = new GetAmendHotelListRequest
                {
                    BookingRef = bookingContext.Content?.BookingResponse.BookingReference,
                    SearchParameters = new SearchParameters
                    {
                        PageSize = 10,
                        Page = 1
                    }
                };
                var alternativeHotelList = await GetAlternativeHotelListStep(request, loginCookie);

                var validationRequest = new AmendHotelRequest
                {
                    BookingRef = bookingContext.Content?.BookingResponse.BookingReference,
                    AmendHotelOffer = alternativeHotelList.Content?.AmendHotelOffers.First()
                };
                
                var loadAlternativeRooms = await LoadAlternativeRooms(validationRequest, "SALT");
                return loadAlternativeRooms;
            });

        using (new AssertionScope())
        {
            alternativeRoomsApiResponse.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }
    }
    
    [Fact(DisplayName = "Invalid request for get alternative rooms request for selected hotel.")]
    public async Task AmendHotel_LoadAlternativeRooms_BadRequest()
    {
        var alternativeRoomsApiResponse = await RepeatDecorator<ApiResponse<GetAmendHotelRoomsResponse>>
            .Create()
            .RepeatTimes(3)
            .Execute(async () =>
            {
                var bookingContext = await CreateBookingStep();
                var loginCookie = bookingContext.Content?.CustomerCredentials!.LoginCookie;
                var request = new GetAmendHotelListRequest
                {
                    BookingRef = bookingContext.Content?.BookingResponse.BookingReference,
                    SearchParameters = new SearchParameters
                    {
                        PageSize = 10,
                        Page = 1
                    }
                };
                var alternativeHotelList = await GetAlternativeHotelListStep(request, loginCookie);

                var validationRequest = new AmendHotelRequest
                {
                    BookingRef = "",
                    AmendHotelOffer = alternativeHotelList.Content?.AmendHotelOffers.First()
                };
                
                var loadAlternativeRooms = await LoadAlternativeRooms(validationRequest, loginCookie);
                return loadAlternativeRooms;
            });

        using (new AssertionScope())
        {
            alternativeRoomsApiResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }
    }
    
    [Fact(DisplayName = "Load alternative transfer for selected hotel option.")]
    public async Task AmendHotel_LoadAlternativeTransfer_Success()
    {
        var alternativeTransferApiResponse = await RepeatDecorator<ApiResponse<IEnumerable<AmendHotelResponse>>>
            .Create()
            .RepeatTimes(3)
            .Execute(async () =>
            {
                var bookingContext = await CreateBookingStep();
                var loginCookie = bookingContext.Content?.CustomerCredentials!.LoginCookie;
                var request = new GetAmendHotelListRequest
                {
                    BookingRef = bookingContext.Content?.BookingResponse.BookingReference,
                    SearchParameters = new SearchParameters
                    {
                        PageSize = 10,
                        Page = 1
                    }
                };
                var alternativeHotelList = await GetAlternativeHotelListStep(request, loginCookie);

                var validationRequest = new AmendHotelRequest
                {
                    BookingRef = bookingContext.Content?.BookingResponse.BookingReference,
                    AmendHotelOffer = alternativeHotelList.Content?.AmendHotelOffers.First()
                };
                
                var loadAlternativeTransfer = await LoadAlternativeTransfer(validationRequest, loginCookie);
                return loadAlternativeTransfer;
            });

        using (new AssertionScope())
        {
            alternativeTransferApiResponse.StatusCode.Should().Be(HttpStatusCode.OK);
            alternativeTransferApiResponse.Content?.Count().Should().BeInRange(1,2);
        }
    }
    
    [Fact(DisplayName = "Can not load alternative transfer for selected hotel option as unauthorized or non lead passenger.")]
    public async Task AmendHotel_LoadAlternativeTransfer_Unauthorized()
    {
        var alternativeTransferApiResponse = await RepeatDecorator<ApiResponse<IEnumerable<AmendHotelResponse>>>
            .Create()
            .RepeatTimes(3)
            .Execute(async () =>
            {
                var bookingContext = await CreateBookingStep();
                var loginCookie = bookingContext.Content?.CustomerCredentials!.LoginCookie;
                var request = new GetAmendHotelListRequest
                {
                    BookingRef = bookingContext.Content?.BookingResponse.BookingReference,
                    SearchParameters = new SearchParameters
                    {
                        PageSize = 10,
                        Page = 1
                    }
                };
                var alternativeHotelList = await GetAlternativeHotelListStep(request, loginCookie);

                var validationRequest = new AmendHotelRequest
                {
                    BookingRef = bookingContext.Content?.BookingResponse.BookingReference,
                    AmendHotelOffer = alternativeHotelList.Content?.AmendHotelOffers.First()
                };
                
                var loadAlternativeTransfer = await LoadAlternativeTransfer(validationRequest, "SALT");
                return loadAlternativeTransfer;
            });

        using (new AssertionScope())
        {
            alternativeTransferApiResponse.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }
    }
    
    [Fact(DisplayName = "Invalid request for get alternative transfer request for selected hotel.")]
    public async Task AmendHotel_LoadAlternativeTransfer_BadRequest()
    {
        var alternativeTransferApiResponse = await RepeatDecorator<ApiResponse<IEnumerable<AmendHotelResponse>>>
            .Create()
            .RepeatTimes(3)
            .Execute(async () =>
            {
                var bookingContext = await CreateBookingStep();
                var loginCookie = bookingContext.Content?.CustomerCredentials!.LoginCookie;
                var request = new GetAmendHotelListRequest
                {
                    BookingRef = bookingContext.Content?.BookingResponse.BookingReference,
                    SearchParameters = new SearchParameters
                    {
                        PageSize = 10,
                        Page = 1
                    }
                };
                var alternativeHotelList = await GetAlternativeHotelListStep(request, loginCookie);

                var validationRequest = new AmendHotelRequest
                {
                    BookingRef = "",
                    AmendHotelOffer = alternativeHotelList.Content?.AmendHotelOffers.First()
                };
                
                var loadAlternativeTransfer = await LoadAlternativeTransfer(validationRequest, loginCookie);
                return loadAlternativeTransfer;
            });

        using (new AssertionScope())
        {
            alternativeTransferApiResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }
    }

    [AllureStep("Load alternative hotel list.")]
    private async Task<ApiResponse<GetAmendHotelListResponse>> GetAlternativeHotelListStep(
        GetAmendHotelListRequest getAmendHotelListRequest, string? loginCookie)
    {
        var result = await amendBookingApi.GetAmendHotelList(getAmendHotelListRequest, loginCookie!);
        return result;
    }

    [AllureStep("Validate selected hotel option.")]
    private async Task<ApiResponse<AmendHotelResponse>> ValidateAlternativeHotel(AmendHotelRequest request, string? loginCookie)
    {
        var result = await amendBookingApi.ValidateAlternativeHotel(request, loginCookie!);
        return result;
    }
    
    [AllureStep("Load alternative room for selected hotel option.")]
    private async Task<ApiResponse<GetAmendHotelRoomsResponse>> LoadAlternativeRooms(AmendHotelRequest request, string? loginCookie)
    {
        var result = await amendBookingApi.GetAlternativeRoomAndBoardForHotel(request, loginCookie!);
        return result;
    }
    
    [AllureStep("Load alternative transfer for selected hotel option.")]
    private async Task<ApiResponse<IEnumerable<AmendHotelResponse>>> LoadAlternativeTransfer(AmendHotelRequest request, string? loginCookie)
    {
        var result = await amendBookingApi.GetAlternativeTransfersForHotel(request, loginCookie!);
        return result;
    }
}