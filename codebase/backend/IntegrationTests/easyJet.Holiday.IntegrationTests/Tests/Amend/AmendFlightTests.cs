using Allure.Xunit.Attributes;
using Allure.XUnit.Attributes.Steps;
using easyJet.Holiday.IntegrationTests.Infrastructure.Repeat;
using easyJet.Holiday.IntegrationTests.Infrastructure.TestApi;
using easyJet.Holiday.IntegrationTests.Shared.Constants;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Extensions;
using FluentAssertions;
using Refit;
using Xunit.Abstractions;

namespace easyJet.Holiday.IntegrationTests.Tests.Amend;

[AllureSuite("Amendment tests")]
[AllureSubSuite("Amend flight")]
[AllureOwner("CSS team")]


public class AmendFlightTests : BaseTest
{
    public AmendFlightTests(IHttpClientFactory _httpClientFactory, TestApiHttpClient testApiHttpClient, ITestOutputHelper testOutputHelper)
        : base(_httpClientFactory, testApiHttpClient, testOutputHelper)
    {
    }

    [Fact(DisplayName = "Amend flight for random booking with promocode.")]
    [AllureIssue("CSSDA-649")]
    public async Task AmendFlight_RandomBookingWithPromocode_ChangeToAvailableFlight()
    {
        var (updatedBooking, amendTransfer) =
            await RepeatDecorator<(BookingResponse, AmendTransport)>
            .Create()
            .RepeatTimes(3)
            .Execute(async () =>
            {
                var bookingContext = await CreateBookingStep();

                var loginCookie = await LoginAsAdminUserStep(bookingContext.Content.CustomerCredentials);

                var availableFlightOffers = await GetAltFlightOffersStep(bookingContext.Content.BookingResponse.BookingReference, loginCookie);

                var validatedOffers = await ValidateFlightOffesr(bookingContext.Content.BookingResponse.BookingReference, availableFlightOffers.Content.Offers, loginCookie);

                var validatedOffer = validatedOffers.Content.AmendTransports.First();

                var amendResponse = await AmendFlightStep(bookingContext.Content.BookingResponse, validatedOffer, loginCookie);

                var updatedBooking =
                    await LoadBookingStep(
                        bookingContext.Content.BookingResponse.BookingReference,
                        bookingContext.Content.Customer.LastName,
                        bookingContext.Content.BookingResponse.Package.Accom.StartDate);
                return (updatedBooking, validatedOffer);
            });

        AssertFlights(updatedBooking, amendTransfer);
    }

    [Fact(DisplayName = "Amend flight for random booking.")]
    [AllureIssue("CSSDA-649")]
    public async Task AmendFlight_RandomBooking_ChangeToAvailableFlight()
    {
        var (updatedBooking, amendTransfer) =
            await RepeatDecorator<(BookingResponse, AmendTransport)>
            .Create()
            .RepeatTimes(3)
            .Execute(async () =>
            {
                var bookingContext = await CreateBookingWithPromocodeStep();

                var loginCookie = await LoginAsAdminUserStep(bookingContext.Content.CustomerCredentials);

                var availableFlightOffers = await GetAltFlightOffersStep(bookingContext.Content.BookingResponse.BookingReference, loginCookie);

                var validatedOffers = await ValidateFlightOffesr(bookingContext.Content.BookingResponse.BookingReference, availableFlightOffers.Content.Offers, loginCookie);

                var validatedOffer = validatedOffers.Content.AmendTransports.First();

                var amendResponse = await AmendFlightStep(bookingContext.Content.BookingResponse, validatedOffer, loginCookie);

                var updatedBooking =
                    await LoadBookingStep(
                        bookingContext.Content.BookingResponse.BookingReference,
                        bookingContext.Content.Customer.LastName,
                        bookingContext.Content.BookingResponse.Package.Accom.StartDate);
                return (updatedBooking, validatedOffer);
            });

        AssertFlights(updatedBooking, amendTransfer);
        updatedBooking.DiscountCode.Should().NotBeNull();
    }

    [AllureStep("Get alternative flight offers for {bookingRef}")]
    private async Task<ApiResponse<AmendFlightOfferResponse>> GetAltFlightOffersStep(string bookingRef, [Skip] string loginCookie)
    {
        return await amendBookingApi.AlternativeFlightsRequest(bookingRef, loginCookie);
    }

    [AllureStep("Validate alternative flight offers for {bookingRef}")]
    private async Task<ApiResponse<AlternativeFlightFullPriceResponse>?> ValidateFlightOffesr(string bookingRef, List<AlternativeFlightOffer> offers, string loginCookie)
    {
        if (offers.IsNullOrEmpty())
            return null;

        var altPackages = new List<AlternativePackage>();
        ApiResponse<AlternativeFlightFullPriceResponse>? validatedResult = null;
        while (validatedResult?.Content?.AmendTransports is null || validatedResult?.Content?.AmendTransports?.IsNullOrEmpty() == true)
        {
            foreach (var offer in offers.Skip(altPackages.Count).Take(3))
            {
                altPackages.Add(new AlternativePackage
                {
                    AlternativePackagePrice = offer.Price,
                    AlternativePackagePricePerPerson = offer.PricePP,
                    Duration = (int)offer.Accom.Stay,
                    Transport = offer.Transport
                });
            }

            var request = new AlternativeFlightFullPriceRequest { BookingReference = bookingRef, AlternativePackages = altPackages.Skip(altPackages.Count - 3).Take(3).ToList() };
            validatedResult = await amendBookingApi.ValidateAlternativeFlightsRequest(request, loginCookie);
        }

        return validatedResult;
    }

    [AllureStep("Amend flight option.")]
    private async Task<ApiResponse<BookingResponse>> AmendFlightStep(BookingResponse booking, AmendTransport transport, [Skip] string loginCookie)
    {
        var paymentInfo = transport.AmendmentCharges.Value < 0
            ? PaymentInfoConstants.AmountOnlyPaymentInfo(transport.AmendmentCharges.Value)
            : PaymentInfoConstants.CreatePaymentInfo(transport.AmendmentCharges.Value);

        var convertType = transport.AmendmentCharges.Value < 0
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
            DiscountCode = booking.DiscountCode,
            Transport = transport
        };

        var amendResponse = await amendBookingApi.AmmendBooking(amendBookingRequest, Guid.NewGuid().ToString(), loginCookie);

        return amendResponse;
    }

    private static void AssertFlights(BookingResponse updatedBooking, AmendTransport amendTransfer)
    {
        updatedBooking.Package.Transport.OutboundFlight.ArrDate.Value.Date.Should().Be(amendTransfer.OutboundFlight.ArrDate.Value.Date);
        updatedBooking.Package.Transport.OutboundFlight.DepDate.Value.Date.Should().Be(amendTransfer.OutboundFlight.DepDate.Value.Date);
        updatedBooking.Package.Transport.OutboundFlight.ArrPt.Should().Be(amendTransfer.OutboundFlight.ArrPt);
        updatedBooking.Package.Transport.OutboundFlight.DepPt.Should().Be(amendTransfer.OutboundFlight.DepPt);

        updatedBooking.Package.Transport.ReturnFlight.ArrDate.Value.Date.Should().Be(amendTransfer.ReturnFlight.ArrDate.Value.Date);
        updatedBooking.Package.Transport.ReturnFlight.DepDate.Value.Date.Should().Be(amendTransfer.ReturnFlight.DepDate.Value.Date);
        updatedBooking.Package.Transport.ReturnFlight.ArrPt.Should().Be(amendTransfer.ReturnFlight.ArrPt);
        updatedBooking.Package.Transport.ReturnFlight.DepPt.Should().Be(amendTransfer.ReturnFlight.DepPt);
    }
}
