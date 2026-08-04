using Allure.Xunit.Attributes;
using easyJet.Holiday.IntegrationTests.Infrastructure.Repeat;
using easyJet.Holiday.IntegrationTests.Infrastructure.TestApi;
using easyJet.Holiday.IntegrationTests.Shared.Models.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using FluentAssertions;
using FluentAssertions.Execution;
using Xunit.Abstractions;

namespace easyJet.Holiday.IntegrationTests.Tests.SharedServices
{
    [AllureSuite("Shared services tests")]
    [AllureSubSuite("Cancel booking")]
    [AllureOwner("EUX team")]
    public class CancelBookingTests : BaseTest
    {
        public CancelBookingTests(
            IHttpClientFactory _httpClientFactory,
            TestApiHttpClient testApiHttpClient,
            ITestOutputHelper testOutputHelper)
            : base(_httpClientFactory, testApiHttpClient, testOutputHelper) { }

        [Theory(DisplayName = "Cancel booking. Success cancel. Correct language, marketCode and currency")]
        [InlineData("en", "GBP", "UK")]
        [InlineData("fr-CH", "CHF", "CH")]
        [InlineData("de-CH", "CHF", "CH")]
        [InlineData("fr-FR", "EUR", "FR")]
        [InlineData("de-DE", "EUR", "DE")]
        public async Task CreateBooking_RandomBooking_ConsistentCurrencyAndLanguage(string language, string currency, string marketCode)
        {
            var booking =
                await RepeatDecorator<BookingResponse>
                .Create()
                .RepeatTimes(5)
                .Execute(async () =>
                {
                    var bookingContext = await CreateBookingStep(new CreateBookingRequest { Language = language });
                    return bookingContext.Content.BookingResponse;
                });

            var cancelBooking = await RepeatDecorator<BookingResponse>
                .Create()
                .RepeatTimes(5)
                .Execute(async () =>
                {
                    var cancelBookingContext = await CancelBookingStep(new Holidays.Api.Domain.Data.SharedServices.Booking.CancelBookingRequest
                    {
                        BookingReference = booking.BookingReference,
                        Language = language,
                        MarketCode = marketCode
                    });

                    return cancelBookingContext.Content.BookingResponse;
                });

            using (new AssertionScope())
            {
                cancelBooking.Should().NotBeNull();
                cancelBooking.Currency.Code.Should().Be(currency);
                cancelBooking.Language.Should().Be(language);
                cancelBooking.MarketCode.Should().Be(marketCode);
            }
        }
    }
}
