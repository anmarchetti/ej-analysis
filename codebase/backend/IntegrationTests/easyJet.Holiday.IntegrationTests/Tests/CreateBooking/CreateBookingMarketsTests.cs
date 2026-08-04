using Allure.Xunit.Attributes;
using easyJet.Holiday.IntegrationTests.Infrastructure.Repeat;
using easyJet.Holiday.IntegrationTests.Infrastructure.TestApi;
using easyJet.Holiday.IntegrationTests.Shared.Models.Booking;
using easyJet.Holiday.IntegrationTests.Shared.Models.CallCentre;
using easyJet.Holiday.IntegrationTests.Shared.Models.Customers;
using easyJet.Holidays.Api.Domain.Data.Booking;
using FluentAssertions;
using FluentAssertions.Execution;
using Xunit.Abstractions;

namespace easyJet.Holiday.IntegrationTests.Tests.CreateBooking
{
    [AllureSuite("Booking tests")]
    [AllureSubSuite("Market data")]
    [AllureOwner("EUX team")]
    public class CreateBookingMarketsTests : BaseTest
    {
        public CreateBookingMarketsTests(
            IHttpClientFactory _httpClientFactory,
            TestApiHttpClient testApiHttpClient,
            ITestOutputHelper testOutputHelper)
            : base(_httpClientFactory, testApiHttpClient, testOutputHelper) { }

        [Theory(DisplayName = "Create booking. Success commit. Consistent language and currency")]
        [InlineData("en", "GBP")]
        [InlineData("fr-CH", "CHF")]
        [InlineData("de-CH", "CHF")]
        [InlineData("fr-FR", "EUR")]
        [InlineData("de-DE", "EUR")]
        public async Task CreateBooking_RandomBooking_ConsistentCurrencyAndLanguage(string language, string currency)
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

            using (new AssertionScope())
            {
                booking.Should().NotBeNull();
                booking.Currency.Code.Should().Be(currency);
                booking.Language.Should().Be(language);
            }
        }

        [Theory(DisplayName = "Create booking with cross border departure airport. Success commit. Correct language and currency")]
        [InlineData("fr-CH", "LYS", "CHF", "CH")]
        [InlineData("de-CH", "LYS", "CHF", "CH")]
        [InlineData("fr-FR", "BSL", "EUR", "FR")]
        [InlineData("de-DE", "BSL", "EUR", "DE")]
        public async Task CreateBooking_CrossMarketAirport_ProperCurrencyAndLanguage(string language, string departure, string currency, string marketCode)
        {
            var booking =
                await RepeatDecorator<BookingResponse>
                .Create()
                .RepeatTimes(5)
                .Execute(async () =>
                {
                    var bookingContext = await CreateBookingStep(new CreateBookingRequest
                    {
                        Language = language,
                        BookingCreationParams = new BookingCreationParams { Departure = departure }
                    });
                    return bookingContext.Content.BookingResponse;
                });

            using (new AssertionScope())
            {
                booking.Should().NotBeNull();
                booking.Currency.Code.Should().Be(currency);
                booking.MarketCode.Should().Be(marketCode);
                booking.Language.Should().Be(language);
            }
        }

        [Theory(DisplayName = "Create booking. Pay remaining balance. Consistent language and currency")]
        [InlineData("en", "GBP")]
        [InlineData("fr-CH", "CHF")]
        [InlineData("de-CH", "CHF")]
        [InlineData("fr-FR", "EUR")]
        [InlineData("de-DE", "EUR")]
        public async Task CreateBooking_RandomBooking_PayRemainingBalance_ConsistentCurrencyAndLanguage(string language, string currency)
        {
            var booking =
                await RepeatDecorator<BookingResponse>
                .Create()
                .RepeatTimes(5)
                .Execute(async () =>
                {
                    var bookingContext = await CreateBookingStep(new CreateBookingRequest
                    {
                        Language = language,
                        BookingCreationParams = new BookingCreationParams
                        {
                            IsDeposit = true
                        }
                    });
                    var booking = bookingContext.Content.BookingResponse;

                    booking = await PayRemainingBalanceStep(booking.BookingReference, booking.Guests[0].LastName, booking.Package.Transport.OutboundFlight.DepDate.ToString(), 100);

                    return booking;
                });

            using (new AssertionScope())
            {
                booking.Should().NotBeNull();
                booking.Currency.Code.Should().Be(currency);
                booking.Language.Should().Be(language);
            }
        }

        [Theory(DisplayName = "Create booking. Pay with credits only. Consistent language and currency")]
        [InlineData("en", "GBP")]
        [InlineData("fr-CH", "CHF")]
        [InlineData("de-CH", "CHF")]
        [InlineData("fr-FR", "EUR")]
        [InlineData("de-DE", "EUR")]
        public async Task CreateBooking_RandomBooking_PayWithCreditsOnly_ConsistentCurrencyAndLanguage(string language, string currency)
        {
            var customerCreateRequest = new CreateCustomerRequest
            {
                Customer = customerFaker.Generate(),
                Password = "!Qwerty_123",
                RememberMe = true
            };

            var customer = await CreateAccountStep(customerCreateRequest);

            await AddCreditsToAccountStep(new AddCreditsRequest
            {
                EmailAddress = customerCreateRequest.Customer.Email!,
                Amount = 100000,
                Currency = currency,
                Reason = "giftcard",
                BookingReference = "12345"
            });

            var booking =
                await RepeatDecorator<BookingResponse>
                .Create()
                .RepeatTimes(5)
                .Execute(async () =>
                {
                    var bookingContext = await CreateBookingStep(new CreateBookingRequest
                    {
                        Language = language,
                        CustomerCredentials = new CustomerCredentials
                        {
                            Email = customerCreateRequest.Customer.Email!,
                            Password = "!Qwerty_123"
                        },
                        BookingCreationParams = new BookingCreationParams
                        {
                            CreditsOnlyPaymentParams = new CreditsOnlyPaymentParams
                            {
                                Currency = currency
                            },
                        }
                    });

                    var booking = bookingContext.Content.BookingResponse;

                    return booking;
                });

            using (new AssertionScope())
            {
                booking.Should().NotBeNull();
                booking.Currency.Code.Should().Be(currency);
                booking.Language.Should().Be(language);
            }
        }
    }
}
