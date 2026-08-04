using Allure.Xunit.Attributes;
using easyJet.Holiday.IntegrationTests.Infrastructure.Repeat;
using easyJet.Holiday.IntegrationTests.Infrastructure.TestApi;
using easyJet.Holiday.IntegrationTests.Shared.Models.Booking;
using easyJet.Holidays.Api.Domain.Data.ContactUs;
using FluentAssertions;
using FluentAssertions.Execution;
using Xunit.Abstractions;

namespace easyJet.Holiday.IntegrationTests.Tests.ContactUs
{
    [AllureSuite("ContactUs tests")]
    [AllureOwner("NEPTUNE team")]
    public class ContactUsTests : BaseTest
    {
        public ContactUsTests(IHttpClientFactory _httpClientFactory, TestApiHttpClient testApiHttpClient, ITestOutputHelper testOutputHelper) : base(_httpClientFactory, testApiHttpClient, testOutputHelper)
        {
        }

        [Theory(DisplayName = "Create contact us case. Successful response")]
        [InlineData("en")]
        [InlineData("fr-CH")]
        [InlineData("de-CH")]
        [InlineData("fr-FR")]
        [InlineData("de-DE")]
        public async Task CreateCase_PastHolidayFalse_SuccessfullResponse(string language)
        {
            var result =
                await RepeatDecorator<ContactUsResult>
                .Create()
                .RepeatTimes(5)
                .Execute(async () =>
                {
                    var bookingContext = await CreateBookingStep(new CreateBookingRequest { Language = language });
                    var booking = bookingContext.Content.BookingResponse;

                    var response = await contactUsApi.CreateCase(new ContactFormRequest
                    {
                        BookingReference = booking.BookingReference,
                        About = "Cancel booking",
                        ContactNumber = "0123456789",
                        DepartureAndReturnDate = "TestDepartureAndReturnDate",
                        EmailAddress = "test@test.com",
                        LeadPassengerFirstName = "Test",
                        LeadPassengerLastName = "Tester",
                        Question = "TestQuestion",
                        IsPastHoliday = false,
                    });

                    return response.Content;
                });

            using (new AssertionScope())
            {
                result.IsSuccessful.Should().Be(true);
            }
        }

        [Theory(DisplayName = "Create contact us case. Successful response")]
        [InlineData("en")]
        [InlineData("fr-CH")]
        [InlineData("de-CH")]
        [InlineData("fr-FR")]
        [InlineData("de-DE")]
        public async Task CreateCase_PastHolidayTrue_SuccessfullResponse(string language)
        {
            var result =
                await RepeatDecorator<ContactUsResult>
                .Create()
                .RepeatTimes(5)
                .Execute(async () =>
                {
                    var bookingContext = await CreateBookingStep(new CreateBookingRequest { Language = language });
                    var booking = bookingContext.Content.BookingResponse;

                    var response = await contactUsApi.CreateCase(new ContactFormRequest
                    {
                        BookingReference = booking.BookingReference,
                        About = "Airport",
                        ContactNumber = "0123456789",
                        DepartureAndReturnDate = "TestDepartureAndReturnDate",
                        EmailAddress = "test@test.com",
                        LeadPassengerFirstName = "Test",
                        LeadPassengerLastName = "Tester",
                        Question = "TestQuestion",
                        IsPastHoliday = true,
                    });

                    return response.Content;
                });

            using (new AssertionScope())
            {
                result.IsSuccessful.Should().Be(true);
            }
        }
    }
}
