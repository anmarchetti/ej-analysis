using Allure.Xunit.Attributes;
using Allure.XUnit.Attributes.Steps;
using easyJet.Holiday.IntegrationTests.Infrastructure.Repeat;
using easyJet.Holiday.IntegrationTests.Infrastructure.TestApi;
using easyJet.Holiday.IntegrationTests.Shared.Constants;
using easyJet.Holiday.IntegrationTests.Shared.Models.Booking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Dates;
using easyJet.Holidays.Api.Domain.Data.Booking;
using FluentAssertions;
using FluentAssertions.Execution;
using Newtonsoft.Json;
using Refit;
using Xunit.Abstractions;

namespace easyJet.Holiday.IntegrationTests.Tests.Amend;

[AllureSuite("Amendment tests")]
[AllureSubSuite("Amend date")]
[AllureOwner("CSS team")]
public class AmendDateTests : BaseTest
{
    private const int CalendarPageRange = 360;
    private const string AmendDateMemoCode = "AMD8";

    public AmendDateTests(
        IHttpClientFactory _httpClientFactory,
        TestApiHttpClient testApiHttpClient,
        ITestOutputHelper testOutputHelper)
        : base(_httpClientFactory, testApiHttpClient, testOutputHelper) { }

    [Fact(DisplayName = "Load available date for calendar page.")]
    [AllureIssue("CSSDA-10")]
    public async Task AmendDate_RandomBooking_LoadAvailableDate()
    {
        var availableDate =
            await RepeatDecorator<ApiResponse<AmendDateInfoResponse>>
                .Create()
                .RepeatTimes(5)
                .Execute(async () =>
                {
                    var bookingContext = await CreateBookingStep();

                    var loginCookie = await LoginAsAdminUserStep(bookingContext.Content.CustomerCredentials);

                    return await GetAvailableDatesStep(bookingContext.Content.BookingResponse, loginCookie);
                });

        using (new AssertionScope())
        {
            availableDate?.Content?.AmendDates.Count().Should().Be(CalendarPageRange + 1);

            if (availableDate?.Content?.AmendDates.Any(x => x.IsAvailable == true) == true)
            {
                availableDate?.Content?.AvailableHoliday.Should().BeTrue();
            }
            else
            {
                availableDate?.Content?.AvailableHoliday.Should().BeFalse();
            }
        }
    }

    [Fact(DisplayName = "Load summary page information")]
    [AllureIssue("CSSDA-10")]
    public async Task AmendDate_RandomBooking_ChangeDateSummaryPageInformation()
    {
        var (summaryPageInfo, bookingContext, selectedDate) =
            await RepeatDecorator<(AmendDatesOffer, CreateBookingResponse, string)>
            .Create()
            .RepeatTimes(5)
            .Execute(async () =>
            {
                var bookingContext = await CreateBookingStep();

                var loginCookie = await LoginAsAdminUserStep(bookingContext.Content.CustomerCredentials);

                var availableDate = await GetAvailableDatesStep(bookingContext.Content.BookingResponse, loginCookie);

                var selectedDate = availableDate.Content.AmendDates.First(x => x.IsAvailable).Date;

                var summaryPageInfo =
                    await GetSummaryPageInfoStep(bookingContext.Content.BookingResponse, selectedDate, loginCookie);

                return (summaryPageInfo.Content, bookingContext.Content, selectedDate);
            });

        using (new AssertionScope())
        {
            selectedDate.Should().NotBeNullOrEmpty();
            summaryPageInfo?.Offer?.Date.Should().NotBeNull();
            summaryPageInfo?.Offer?.Date.Should().Be(DateTime.Parse(selectedDate));
            summaryPageInfo?.BookingPrice.Should().Be(bookingContext?.BookingResponse?.PaymentInfo?.TotalPrice);
            (summaryPageInfo?.OfferPrice - bookingContext?.BookingResponse?.PaymentInfo?.TotalPrice).Should().Be(summaryPageInfo?.AmendmentDatesCharges);
        }
    }

    [Fact(DisplayName = "Amend date full pipeline for random booking. Success commit.")]
    [AllureIssue("CSSDA-10")]
    public async Task AmendDate_RandomBooking_CommitChangeDate()
    {
        var (updatedBooking, summaryPageInfo, selectedDate) =
            await RepeatDecorator<(BookingResponse, AmendDatesOffer, string)>
            .Create()
            .RepeatTimes(5)
            .Execute(async () =>
            {
                var bookingContext = await CreateBookingStep();
                var loginCookie = await LoginAsAdminUserStep(bookingContext.Content.CustomerCredentials);

                var availableDate = await GetAvailableDatesStep(bookingContext.Content.BookingResponse, loginCookie);

                var selectedDate = availableDate.Content.AmendDates.First(x => x.IsAvailable).Date;

                var summaryPageInfo =
                    await GetSummaryPageInfoStep(bookingContext.Content.BookingResponse, selectedDate, loginCookie);

                if (summaryPageInfo.Error is not null)
                    throw summaryPageInfo.Error;

                var amendBooking = await AmendDateStep(bookingContext.Content.BookingResponse, summaryPageInfo.Content, loginCookie);

                var updatedBooking =
                    await LoadBookingStep(
                        amendBooking.Content.BookingReference,
                        bookingContext.Content.Customer.LastName,
                        amendBooking.Content.Package.Accom.StartDate);

                return (updatedBooking, summaryPageInfo.Content, selectedDate);
            });

        using (new AssertionScope())
        {
            updatedBooking?.Package?.Accom?.StartDate?.Should().NotBeNull();
            updatedBooking?.PaymentInfo?.Should().NotBeNull();
            updatedBooking?.Package?.Accom?.StartDate?.Should().Be(selectedDate);
            updatedBooking?.PaymentInfo?.TotalPrice.Should().Be(summaryPageInfo?.OfferPrice);
            updatedBooking?.PaymentInfo?.PaymentHistory?.Last()?.Amount.Should().Be(summaryPageInfo?.AmendmentDatesCharges);
            updatedBooking?.PaymentInfo?.BalanceDueAmount.Should().Be(0);
            updatedBooking?.Memo?.Should().NotBeNull();
            updatedBooking?.Memo.Should().ContainSingle(x => string.Equals(x.Code, AmendDateMemoCode, StringComparison.InvariantCultureIgnoreCase));
        }

    }

    [Fact(DisplayName = "Try to amend dates more than X times.")]
    [AllureIssue("CSSDA-10")]
    public async Task AmendDate_RandomBooking_TryAmendDateXTimes()
    {
        var errorResponse =
            await RepeatDecorator<Dictionary<string, string>>
            .Create()
            .RepeatTimes(5)
            .Execute(async () =>
            {
                var bookingContext = await CreateBookingStep();

                var loginCookie = await LoginAsAdminUserStep(bookingContext.Content.CustomerCredentials);

                var amendSettings = await GetAmendBookingSettingsStep();

                ApiResponse<BookingResponse> amendBooking = null;

                for (int i = 0; i < amendSettings.AmendChangeDateCount + 1; i++)
                {
                    var availableDate = await GetAvailableDatesStep(bookingContext.Content.BookingResponse, loginCookie);

                    var selectedDate = availableDate.Content.AmendDates.First(x => x.IsAvailable).Date;

                    var summaryPageInfo =
                        await GetSummaryPageInfoStep(bookingContext.Content.BookingResponse, selectedDate, loginCookie);

                    amendBooking = await AmendDateStep(bookingContext.Content.BookingResponse, summaryPageInfo.Content, loginCookie);
                }

                return JsonConvert.DeserializeObject<Dictionary<string, string>>(amendBooking.Error.Content);
            });

        errorResponse.Should().NotBeNull();
        errorResponse.TryGetValue("code", out var errorcode);
        errorcode.Should().Be("API-ERR-240015");
    }

    [Fact(DisplayName = "Load available transfer options on change date flow.")]
    [AllureIssue("CSSDA-10")]
    public async Task AmendDate_RandomBooking_AvailableTransfers()
    {
        var transferOptions =
            await RepeatDecorator<ApiResponse<IEnumerable<AmendDatesOffer>>>
            .Create()
            .RepeatTimes(5)
            .Execute(async () =>
            {
                var bookingContext = await CreateBookingStep();

                var loginCookie = await LoginAsAdminUserStep(bookingContext.Content.CustomerCredentials);

                var availableDate = await GetAvailableDatesStep(bookingContext.Content.BookingResponse, loginCookie);

                var selectedDate = availableDate.Content.AmendDates.First(x => x.IsAvailable).Date;

                var summaryPageInfo =
                    await GetSummaryPageInfoStep(bookingContext.Content.BookingResponse, selectedDate, loginCookie);

                var availableTransferOptions = await GetAvailableTransferOptionsForChangeDateStep(summaryPageInfo.Content, loginCookie);
                return availableTransferOptions;
            });

        transferOptions?.IsSuccessStatusCode.Should().BeTrue();
    }

    [Fact(DisplayName = "Load available flight options on change date flow.")]
    [AllureIssue("CSSDA-10")]
    public async Task AmendDate_RandomBooking_AvailableFlights()
    {
        var transferOptions =
            await RepeatDecorator<ApiResponse<IEnumerable<AmendDatesOffer>>>
            .Create()
            .RepeatTimes(5)
            .Execute(async () =>
            {
                var bookingContext = await CreateBookingStep();

                var loginCookie = await LoginAsAdminUserStep(bookingContext.Content.CustomerCredentials);

                var availableDate = await GetAvailableDatesStep(bookingContext.Content.BookingResponse, loginCookie);

                var selectedDate = availableDate.Content.AmendDates.First(x => x.IsAvailable).Date;

                var summaryPageInfo =
                    await GetSummaryPageInfoStep(bookingContext.Content.BookingResponse, selectedDate, loginCookie);

                var transferOptions = await GetAvailableFlightsOptionsForChangeDateStep(summaryPageInfo.Content, loginCookie);

                return transferOptions;
            });

        transferOptions?.IsSuccessStatusCode.Should().BeTrue();
    }

    [AllureStep("Amend booking date.")]
    private async Task<ApiResponse<BookingResponse>> AmendDateStep(BookingResponse bookingResponse, AmendDatesOffer summaryPageInfo, string loginCookie)
    {
        var amendBookingRequest = new AmendBookingRequest
        {
            BookingReference = bookingResponse.BookingReference,
            BrowserInfo = BrowserInfoConstants.DefaultBrowserInfo(),
            Date = bookingResponse.BookingDate.DateTime,
            DeviceId = Guid.NewGuid().ToString(),
            LastName = bookingResponse.Guests.Single(x => x.IsLead).LastName,
            PaymentInfo = PaymentInfoConstants.CreatePaymentInfo(summaryPageInfo.AmendmentDatesCharges),
            Offer = summaryPageInfo.Offer,
            ConvertType = summaryPageInfo.AmendmentDatesCharges <= 0 ? ConvertType.CREDIT : null
        };

        var amendResponse = await amendBookingApi.AmmendBooking(amendBookingRequest, Guid.NewGuid().ToString(), loginCookie);

        return amendResponse;
    }

    [AllureStep("Get available dates for calendar page.")]
    private async Task<ApiResponse<AmendDateInfoResponse>> GetAvailableDatesStep(BookingResponse bookingResponse, string loginCookie)
    {
        var availableDates = await amendBookingApi.GetAmendDatesCalendarData(
            startDate: DateTime.Now,
            endDate: DateTime.Now.AddDays(CalendarPageRange),
            duration: (DateTime.Parse(bookingResponse.Package.Accom.EndDate) - DateTime.Parse(bookingResponse.Package.Accom.StartDate)).Days,
            departure: bookingResponse.Package.Transport.OutboundFlight.DepPt,
            accommodationId: bookingResponse.Package.Accom.Code,
            children: bookingResponse.Package.Accom.Rooms.Sum(x => x.Occupation.Children),
            infants: bookingResponse.Package.Accom.Rooms.Sum(x => x.Occupation.Infants),
            adults: bookingResponse.Package.Accom.Rooms.Sum(x => x.Occupation.Adults),
            roomCode: bookingResponse.Package.Accom.Rooms.First().Code,
            loginCookie
            );

        return availableDates;
    }

    [AllureStep("Get amend date summary page information")]
    private async Task<ApiResponse<AmendDatesOffer>> GetSummaryPageInfoStep(BookingResponse bookingResponse, string selectedDate, string loginCookie)
    {
        var summaryPageInfo = await amendBookingApi.GetAmendDatesSummary(
            bookingRef: bookingResponse.BookingReference,
            selectedDate: selectedDate,
            duration: (DateTime.Parse(bookingResponse.Package.Accom.EndDate) -
                       DateTime.Parse(bookingResponse.Package.Accom.StartDate)).Days,
            accommodationId: bookingResponse.Package.Accom.Code,
            children: bookingResponse.Package.Accom.Rooms.Sum(x => x.Occupation.Children),
            infants: bookingResponse.Package.Accom.Rooms.Sum(x => x.Occupation.Infants),
            adults: bookingResponse.Package.Accom.Rooms.Sum(x => x.Occupation.Adults),
            roomCode: bookingResponse.Package.Accom.Rooms.First().Code,
            board: bookingResponse.Package.Accom.Rooms.First().Board,
            transferCode: bookingResponse.Transfers?.First().Code,
            outboundDepTime: bookingResponse.Package.Transport.OutboundFlight.DepDate,
            inboundDepTime: bookingResponse.Package.Transport.ReturnFlight.DepDate,
            loginCookie
        );

        return summaryPageInfo;
    }

    [AllureStep("Get available transfer options for change date.")]
    private async Task<ApiResponse<IEnumerable<AmendDatesOffer>>> GetAvailableTransferOptionsForChangeDateStep(AmendDatesOffer amendDatesOffer, string loginCookie)
    {
        var result = await amendBookingApi.GetAvailableTransferOptionForChangeDateFlow(amendDatesOffer, loginCookie);

        return result;
    }

    [AllureStep("Get available flights options for change date.")]
    private async Task<ApiResponse<IEnumerable<AmendDatesOffer>>> GetAvailableFlightsOptionsForChangeDateStep(AmendDatesOffer amendDatesOffer, string loginCookie)
    {
        var result = await amendBookingApi.GetAlternativeFlightOptionForChangeDateFlow(amendDatesOffer, loginCookie);

        return result;
    }
}
