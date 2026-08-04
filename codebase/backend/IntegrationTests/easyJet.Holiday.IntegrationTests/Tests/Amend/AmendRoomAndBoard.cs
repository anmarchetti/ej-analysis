using Allure.Xunit.Attributes;
using Allure.XUnit.Attributes.Steps;
using easyJet.Holiday.IntegrationTests.Infrastructure.Repeat;
using easyJet.Holiday.IntegrationTests.Infrastructure.TestApi;
using easyJet.Holiday.IntegrationTests.Shared.Constants;
using easyJet.Holiday.IntegrationTests.Shared.Models.Booking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.RoomAndBoard;
using easyJet.Holidays.Api.Domain.Data.Booking;
using FluentAssertions;
using Refit;
using System.Net;
using Xunit.Abstractions;

namespace easyJet.Holiday.IntegrationTests.Tests.Amend
{
    [AllureSuite("Amendment tests")]
    [AllureSubSuite("Amend passengers")]
    public class AmendRoomAndBoard : BaseTest
    {
        public AmendRoomAndBoard(
            IHttpClientFactory _httpClientFactory,
            TestApiHttpClient testApiHttpClient,
            ITestOutputHelper testOutputHelper)
            : base(_httpClientFactory, testApiHttpClient, testOutputHelper) { }


        [Fact(DisplayName = "Validate room and board for random booking.")]
        [AllureDescription("Validate room and board for random booking.")]
        public async Task ValidateRB_RandomBooking_GetHasCahcedOffers()
        {
            var offers =
                await RepeatDecorator<AmendRoomVariantsResponse>
                .Create()
                .RepeatTimes(3)
                .Execute(async () =>
                {
                    //1. Create booking
                    var bookingContextResponse = await CreateBookingWithAltRooms();
                    var bookingContext = bookingContextResponse.Content;
                    var loginCookie = await LoginAsAdminUserStep(bookingContext.CustomerCredentials);

                    //2. get cahce date from room and board amend
                    var offers = await GetCacheRoomAndBoardDataStep(bookingContext, loginCookie);
                    return offers.Content;
                });

            offers.Should().NotBeNull();
        }

        [Fact(DisplayName = "Validate room and board for random booking.")]
        [AllureDescription("Validate room and board for random booking.")]
        public async Task ValidateRB_RandomBooking_GetLivePrice()
        {
            var validated =
                await RepeatDecorator<ApiResponse<List<AmendRoomVariant>>>
                .Create()
                .RepeatTimes(3)
                .Execute(async () =>
                {
                    //1. Create booking
                    var bookingContextResponse = await CreateBookingWithAltRooms();
                    var bookingContext = bookingContextResponse.Content;
                    var loginCookie = await LoginAsAdminUserStep(bookingContext.CustomerCredentials);

                    //2. get cahce date from room and board amend
                    var offerResponse = await GetCacheRoomAndBoardDataStep(bookingContext, loginCookie);
                    var offers = offerResponse.Content;
                    var validated = await ValidateAlternativeRoomBoardOption(bookingContext, offers.RoomVariants.ToArray()[0]);
                    return validated;
                });


            validated.StatusCode.Should().Be(HttpStatusCode.OK);
            validated.Content[0].BookingPrice.Should().NotBe(0);
            validated.Content[0].OfferPrice.Should().NotBe(0);
        }

        [Fact(DisplayName = "Amend room and board for random booking.")]
        [AllureDescription("Amend room for random booking")]
        public async Task AmendRoomAndBoard_RandomBooking_ChangeToAvailableBoard()
        {
            var (response, unitToChange, updatedBooking) =
                await RepeatDecorator<(ApiResponse<BookingResponse>, AmendRoomVariant, BookingResponse)>
                .Create()
                .RepeatTimes(5)
                .Execute(async () =>
                {
                    //1. Create booking
                    var bookingContextResponse = await CreateBookingWithAltRooms();
                    var bookingContext = bookingContextResponse.Content;
                    var loginCookie = await LoginAsAdminUserStep(bookingContext.CustomerCredentials);

                    //2. get cahce date from room and board amend
                    var offerResponse = await GetCacheRoomAndBoardDataStep(bookingContext, loginCookie);
                    var offers = offerResponse.Content;


                    var roomCode = bookingContext.BookingResponse.Package.Accom.Rooms.First().Code;
                    var boardCode = bookingContext.BookingResponse.Package.Accom.Rooms.First().Board;

                    var unitToChange = offers.RoomVariants.FirstOrDefault(x => x.Units.FirstOrDefault(x => x.Code == roomCode && x.Board != boardCode) is not null);

                    var validated = await ValidateAlternativeRoomBoardOption(bookingContext, unitToChange);

                    var result = await CommitRoomAndBoard(bookingContext.BookingResponse, unitToChange, loginCookie);
                    var updatedBooking =
                        await LoadBookingStep(
                            bookingContext.BookingResponse.BookingReference,
                            bookingContext.Customer.LastName,
                            bookingContext.BookingResponse.Package.Accom.StartDate);

                    return (result, unitToChange, updatedBooking);
                });

            response.StatusCode.Should().Be(HttpStatusCode.OK);
            response.Content.Package.Accom.Rooms.First().Code.Should().Be(unitToChange.Units.First().Code);
            response.Content.Package.Accom.Rooms.First().Board.Should().Be(unitToChange.Units.First().Board);
            updatedBooking.Memo.Any(x => x.Code == "AMD5").Should().NotBe(false);
        }

        [Fact(DisplayName = "Amend room and board for random booking.")]
        [AllureDescription("Amend room for random booking")]
        public async Task AmendRoomAndBoard_RandomBooking_ChangeToAvailableRoom()
        {
            var (response, unitToChange, updatedBooking) =
                await RepeatDecorator<(ApiResponse<BookingResponse>, AmendRoomVariant, BookingResponse)>
                .Create()
                .RepeatTimes(5)
                .Execute(async () =>
                {
                    //1. Create booking
                    var bookingContextResponse = await CreateBookingWithAltRooms();
                    var bookingContext = bookingContextResponse.Content;
                    var loginCookie = await LoginAsAdminUserStep(bookingContext.CustomerCredentials);

                    //2. get cahce date from room and board amend
                    var offerResponse = await GetCacheRoomAndBoardDataStep(bookingContext, loginCookie);
                    var offers = offerResponse.Content;

                    var roomCode = bookingContext.BookingResponse.Package.Accom.Rooms.First().Code;
                    var boardCode = bookingContext.BookingResponse.Package.Accom.Rooms.First().Board;

                    var unitToChange = offers.RoomVariants.FirstOrDefault(x => x.Units.FirstOrDefault(x => x.Code != roomCode && x.Board == boardCode) is not null);

                    var validated = await ValidateAlternativeRoomBoardOption(bookingContext, unitToChange);

                    var result = await CommitRoomAndBoard(bookingContext.BookingResponse, unitToChange, loginCookie);
                    var updatedBooking =
                        await LoadBookingStep(
                            bookingContext.BookingResponse.BookingReference,
                            bookingContext.Customer.LastName,
                            bookingContext.BookingResponse.Package.Accom.StartDate);
                    return (result, unitToChange, updatedBooking);
                });

            response.StatusCode.Should().Be(HttpStatusCode.OK);
            response.Content.Package.Accom.Rooms.First().Code.Should().Be(unitToChange.Units.First().Code);
            response.Content.Package.Accom.Rooms.First().Board.Should().Be(unitToChange.Units.First().Board);
            updatedBooking.Memo.Any(x => x.Code == "AMD6").Should().NotBe(false);
        }

        [Fact(DisplayName = "Amend room and board for random booking.")]
        [AllureDescription("Amend room and board for random booking")]
        public async Task AmendRoomAndBoard_RandomBooking_ChangeToAvailableRoomAndBoard()
        {
            var (response, unitToChange, updatedBooking) =
                await RepeatDecorator<(ApiResponse<BookingResponse>, AmendRoomVariant, BookingResponse)>
                .Create()
                .RepeatTimes(10)
                .Execute(async () =>
                {
                    //1. Create booking
                    var bookingContextResponse = await CreateBookingWithAltRooms();
                    var bookingContext = bookingContextResponse.Content;
                    var loginCookie = await LoginAsAdminUserStep(bookingContext.CustomerCredentials);

                    //2. get cahce date from room and board amend
                    var offerResponse = await GetCacheRoomAndBoardDataStep(bookingContext, loginCookie);
                    var offers = offerResponse.Content;

                    var roomCode = bookingContext.BookingResponse.Package.Accom.Rooms.First().Code;
                    var boardCode = bookingContext.BookingResponse.Package.Accom.Rooms.First().Board;

                    var unitToChange = offers.RoomVariants.FirstOrDefault(x => x.Units.FirstOrDefault(x => x.Code != roomCode && x.Board != boardCode) is not null);

                    var validated = await ValidateAlternativeRoomBoardOption(bookingContext, unitToChange);

                    var result = await CommitRoomAndBoard(bookingContext.BookingResponse, unitToChange, loginCookie);

                    var updatedBooking =
                        await LoadBookingStep(
                            bookingContext.BookingResponse.BookingReference,
                            bookingContext.Customer.LastName,
                            bookingContext.BookingResponse.Package.Accom.StartDate);

                    return (result, unitToChange, updatedBooking);
                });

            response.StatusCode.Should().Be(HttpStatusCode.OK);
            response.Content.Package.Accom.Rooms.First().Code.Should().Be(unitToChange.Units.First().Code);
            response.Content.Package.Accom.Rooms.First().Board.Should().Be(unitToChange.Units.First().Board);
            updatedBooking.Memo.Any(x => x.Code == "AMD10").Should().NotBe(false);
        }

        [AllureStep("Validate alternative room and boards with live price")]
        private async Task<ApiResponse<List<AmendRoomVariant>>> ValidateAlternativeRoomBoardOption(CreateBookingResponse bookingContext, AmendRoomVariant amendRoomVariant)
        {
            var validated = await amendBookingApi.ValidateAlternativeRoomAndBoard(new AmendRoomValidationRequest
            {
                BookingRef = bookingContext.BookingResponse.BookingReference,
                SelectedRoomVariant = amendRoomVariant,
                RoomVariants = new List<AmendRoomVariant> { amendRoomVariant },
                DiscountCode = "ORANGESALE150"
            });
            return validated;
        }

        [AllureStep("Amend room and board option.")]
        private async Task<ApiResponse<BookingResponse>> CommitRoomAndBoard(BookingResponse booking, AmendRoomVariant roomVariant, [Skip] string loginCookie)
        {
            var paymentInfo = roomVariant.AmendmentCharges < 0
                ? PaymentInfoConstants.AmountOnlyPaymentInfo(roomVariant.AmendmentCharges)
                : PaymentInfoConstants.CreatePaymentInfo(roomVariant.AmendmentCharges);

            var convertType = roomVariant.AmendmentCharges < 0
                ? ConvertType.CREDIT
                : ConvertType.REFUND;

            var amendBookingRequest = new AmendBookingRequest
            {
                BookingReference = booking.BookingReference,
                BrowserInfo = BrowserInfoConstants.DefaultBrowserInfo(),
                Date = booking.BookingDate.DateTime,
                DeviceId = Guid.NewGuid().ToString(),
                LastName = booking.Guests.Single(x => x.IsLead).LastName,
                PaymentInfo = paymentInfo,
                ConvertType = convertType,
                Units = roomVariant.Units
            };

            var amendResponse = await amendBookingApi.AmmendBooking(amendBookingRequest, Guid.NewGuid().ToString(), loginCookie);

            return amendResponse;
        }

        [AllureStep("Get data about alternative room and boards from atcom cache")]
        internal async Task<ApiResponse<AmendRoomVariantsResponse>> GetCacheRoomAndBoardDataStep(CreateBookingResponse bookingContext, string loginCookie)
        {
            return await amendBookingApi.GetAlternativeRoomAndBoardsFromCache(bookingContext.BookingResponse.BookingReference, loginCookie);
        }

        [AllureStep("Load booking information")]
        internal async Task<BookingResponse> LoadBookingStep(string bookingRef, string lastName, string bookingStartDate)
        {
            var displayBookingRequest = new DisplayBookingRequest
            {
                BookingReference = bookingRef,
                LastName = lastName,
                Date = bookingStartDate
            };

            var updatedBooking = await bookingApi.DisplayBooking(displayBookingRequest);

            return updatedBooking.Content;
        }
    }
}
