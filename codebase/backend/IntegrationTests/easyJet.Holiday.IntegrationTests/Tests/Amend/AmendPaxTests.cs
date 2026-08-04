using Allure.Xunit.Attributes;
using Allure.XUnit.Attributes.Steps;
using easyJet.Holiday.IntegrationTests.Infrastructure.Repeat;
using easyJet.Holiday.IntegrationTests.Infrastructure.TestApi;
using easyJet.Holiday.IntegrationTests.Shared.Constants;
using easyJet.Holiday.IntegrationTests.Shared.Mappers;
using easyJet.Holiday.IntegrationTests.Shared.Models.Booking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.Payment;
using FluentAssertions;
using Newtonsoft.Json;
using Refit;
using Xunit.Abstractions;

namespace easyJet.Holiday.IntegrationTests.Tests.Amend;

[AllureSuite("Amendment tests")]
[AllureSubSuite("Amend passengers")]
public class AmendPaxTests : BaseTest
{

    public AmendPaxTests(IHttpClientFactory _httpClientFactory, TestApiHttpClient testApiHttpClient, ITestOutputHelper testOutputHelper)
        : base(_httpClientFactory, testApiHttpClient, testOutputHelper)
    {
    }

    [Fact(DisplayName = "Change non lead passenger information ones.")]
    public async Task AmendPaxName_ChangeOnce_Success()
    {
        var (updatedBooking, amendResponse, bookingContext) =
            await RepeatDecorator<(BookingResponse, BookingResponse, CreateBookingResponse)>
            .Create()
            .RepeatTimes(3)
            .Execute(async () =>
            {
                // 1. Create booking
                var bookingContext = await CreateBookingStep(new CreateBookingRequest());

                var loginCookie = await LoginAsAdminUserStep(bookingContext.Content.CustomerCredentials);

                // 3. Commit booking changes
                var amendResponse = await AmendNonLeadPassengerInformation(bookingContext.Content.BookingResponse, "x", loginCookie);

                // 4. Receive updated booking
                var updatedBooking = await LoadBookingStep(
                        bookingContext.Content.BookingResponse.BookingReference,
                        bookingContext.Content.Customer.LastName,
                        bookingContext.Content.BookingResponse.Package.Accom.StartDate);

                return (updatedBooking, amendResponse.Content, bookingContext.Content);
            });

        //Assert
        updatedBooking.Guests[1].Should().BeEquivalentTo(amendResponse.Guests[1], options => options.ExcludingMissingMembers());
        updatedBooking.Guests[0].Should().BeEquivalentTo(bookingContext.BookingResponse.Guests[0], options => options.ExcludingMissingMembers());
    }

    [Fact(DisplayName = "Change non lead passenger information few times.")]
    public async Task AmendPaxName_ChangeMoreThanXTimes_Success()
    {
        var errorResponse =
            await RepeatDecorator<Dictionary<string, string>>
            .Create()
            .RepeatTimes(3)
            .Execute(async () =>
            {
                var amendSettings = await GetAmendBookingSettingsStep();

                var bookingContext = await CreateBookingStep(new CreateBookingRequest());

                var loginCookie = await LoginAsAdminUserStep(bookingContext.Content.CustomerCredentials);

                ApiResponse<BookingResponse?> amendResponse = null;

                for (int i = 0; i < amendSettings.AmendPassengerNameCount + 1; i++)
                {
                    amendResponse =
                        await AmendNonLeadPassengerInformation(bookingContext.Content.BookingResponse, new string('x', i + 1), loginCookie);
                }
                return JsonConvert.DeserializeObject<Dictionary<string, string>>(amendResponse.Error.Content);
            });


        errorResponse["code"].Should().Be("API-ERR-240008");
    }

    [Fact(DisplayName = "Change few digits in non lead passenger information.")]
    public async Task AmendPaxName_ChangeMoreThanThreeDigits_Fail()
    {
        var (updatedBooking, bookingContext, errorResponse) =
            await RepeatDecorator<(BookingResponse, CreateBookingResponse, Dictionary<string, string>)>
            .Create()
            .RepeatTimes(3)
            .Execute(async () =>
            {
                var amendSettings = await GetAmendBookingSettingsStep();

                var bookingContext = await CreateBookingStep(new CreateBookingRequest());

                var loginCookie = await LoginAsAdminUserStep(bookingContext.Content.CustomerCredentials);

                var amendResponse =
                    await AmendNonLeadPassengerInformation(
                        bookingContext.Content.BookingResponse,
                        new string('x', amendSettings.AmendPassengerNameCharacterCount.Value + 1),
                        loginCookie);

                var errorResponse = JsonConvert.DeserializeObject<Dictionary<string, string>>(amendResponse.Error.Content);

                var updatedBooking = await LoadBookingStep(
                    bookingContext.Content.BookingResponse.BookingReference,
                    bookingContext.Content.Customer.LastName,
                    bookingContext.Content.BookingResponse.Package.Accom.StartDate);

                return (updatedBooking, bookingContext.Content, errorResponse);
            });


        updatedBooking.Guests[1].Should().BeEquivalentTo(bookingContext.BookingResponse.Guests[1], options => options.ExcludingMissingMembers());
        updatedBooking.Guests[0].Should().BeEquivalentTo(bookingContext.BookingResponse.Guests[0], options => options.ExcludingMissingMembers());

        errorResponse["code"].Should().Be("API-ERR-240009");
    }

    [Fact(DisplayName = "Changing lead pax name should fail")]
    public async Task AmendPaxName_ChangeLeadPessanger_Fail()
    {
        var (updatedBooking, bookingContext, errorResponse) =
            await RepeatDecorator<(BookingResponse, CreateBookingResponse, Dictionary<string, string>)>
            .Create()
            .RepeatTimes(3)
            .Execute(async () =>
            {
                var bookingContext = await CreateBookingStep(new CreateBookingRequest());

                var loginCookie = await LoginAsAdminUserStep(bookingContext.Content.CustomerCredentials);

                var amendResponse = await AmendLeadPassengerStep(bookingContext.Content.BookingResponse, "x", loginCookie);

                var errorResponse = JsonConvert.DeserializeObject<Dictionary<string, string>>(amendResponse.Error.Content);

                var updatedBooking = await LoadBookingStep(
                    bookingContext.Content.BookingResponse.BookingReference,
                    bookingContext.Content.Customer.LastName,
                    bookingContext.Content.BookingResponse.Package.Accom.StartDate);

                updatedBooking.Guests[1].Should().BeEquivalentTo(bookingContext.Content.BookingResponse.Guests[1], options => options.ExcludingMissingMembers());
                updatedBooking.Guests[0].Should().BeEquivalentTo(bookingContext.Content.BookingResponse.Guests[0], options => options.ExcludingMissingMembers());

                return (updatedBooking, bookingContext.Content, errorResponse);
            });

        errorResponse["code"].Should().Be("API-ERR-240010");
    }

    [AllureStep("Load amend booking settings.")]
    private async Task<AmendBookingSetting> GetAmendBookingSettingsStep()
    {
        var result = await sitecoreApi.GetAmendBookingSettings();

        return result.Content;
    }

    [AllureStep("Update passenger information for LEAD passenger.")]
    private async Task<ApiResponse<BookingResponse>> AmendLeadPassengerStep(BookingResponse booking, string updatePart, [Skip] string loginCookie)
    {
        var amendBookingRequest = new AmendBookingRequest
        {
            BookingReference = booking.BookingReference,
            BrowserInfo = BrowserInfoConstants.DefaultBrowserInfo(),
            ConvertType = ConvertType.CREDIT,
            Date = booking.BookingDate.DateTime,
            DeviceId = Guid.NewGuid().ToString(),
            LastName = booking.Guests.Single(x => x.IsLead).LastName,
            PaymentInfo = new CardPaymentInfo
            {
                Amount = 0
            },
            Pax = new List<AmendPersonWithDetails>
            {
                UpdateGuestInfo(booking.Guests[0], "x"),
                booking.Guests[1].MapToAmendPersonWithDetails()
            }
        };

        var amendResponse = await amendBookingApi.AmmendBooking(amendBookingRequest, Guid.NewGuid().ToString(), loginCookie);

        return amendResponse;
    }

    [AllureStep("Update passenger information for NON LEAD passenger.")]
    private async Task<ApiResponse<BookingResponse>> AmendNonLeadPassengerInformation(BookingResponse booking, string updatePart, [Skip] string loginCookie)
    {
        // 3. Create amend request
        var amendBookingRequest = new AmendBookingRequest
        {
            BookingReference = booking.BookingReference,
            BrowserInfo = BrowserInfoConstants.DefaultBrowserInfo(),
            ConvertType = ConvertType.CREDIT,
            Date = booking.BookingDate.DateTime,
            DeviceId = Guid.NewGuid().ToString(),
            LastName = booking.Guests.Single(x => x.IsLead).LastName,
            PaymentInfo = new CardPaymentInfo
            {
                Amount = 0
            },
            Pax = new List<AmendPersonWithDetails>
            {
                booking.Guests[0].MapToAmendPersonWithDetails(),
                UpdateGuestInfo(booking.Guests[1], updatePart)
            }
        };

        // 4. Commit booking changes
        var amendResponse = await amendBookingApi.AmmendBooking(amendBookingRequest, Guid.NewGuid().ToString(), loginCookie);

        return amendResponse;
    }

    private AmendPersonWithDetails UpdateGuestInfo(PersonWithDetails guest, string updatePart)
    {
        var result = guest.MapToAmendPersonWithDetails();

        result.FirstName = result.FirstName + updatePart;

        return result;
    }
}
