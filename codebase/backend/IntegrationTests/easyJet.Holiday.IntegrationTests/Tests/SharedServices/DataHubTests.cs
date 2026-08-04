using Allure.Xunit.Attributes;
using Allure.Xunit.Attributes.Steps;
using easyJet.Holiday.IntegrationTests.Infrastructure.Repeat;
using easyJet.Holiday.IntegrationTests.Infrastructure.TestApi;
using easyJet.Holiday.IntegrationTests.Shared.Models.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.SharedServices.DataHub;
using FluentAssertions;
using FluentAssertions.Execution;
using Refit;
using Xunit.Abstractions;

namespace easyJet.Holiday.IntegrationTests.Tests.SharedServices
{
    [AllureSuite("Shared services [DataHub] tests")]
    [AllureSubSuite("Synchronize Pnr")]
    [AllureOwner("BOA team")]
    public class DataHubTests : BaseTest
    {
        public DataHubTests(
            IHttpClientFactory _httpClientFactory,
            TestApiHttpClient testApiHttpClient,
            ITestOutputHelper testOutputHelper)
            : base(_httpClientFactory, testApiHttpClient, testOutputHelper) { }

        [Fact(DisplayName = " Synchronize seats. Success.")]
        public async Task SynchronizeSeats_RandomBooking_Success()
        {
            var booking =
                await RepeatDecorator<BookingResponse>
                .Create()
                .RepeatTimes(10)
                .Execute(async () =>
                {
                    var bookingContext = await CreateBookingStep(new CreateBookingRequest { Language = "en" });
                    return bookingContext.Content.BookingResponse;
                });

            var synchronizeResponse = await RepeatDecorator<DatahubSyncResponse>
                .Create()
                .Execute(async () =>
                {
                    var responseContext = await SynchronizeSeatsStep(new DatahubSyncRequest
                    {
                        Reservations = [new ReservationRequest
                        {
                            ReservationId = booking.BookingReference
                        }
                        ]
                    });

                    return responseContext.Content;
                });

            using (new AssertionScope())
            {
                //TODO add other assertions
                //Atcom is sending a wrong response after atcom side resolves their bug, we will add proper assertions
                synchronizeResponse.Should().NotBeNull();
            }
        }

        [AllureStep("Synchronize pnr step.")]
        internal async Task<ApiResponse<DatahubSyncResponse>> SynchronizeSeatsStep(DatahubSyncRequest request)
        {
            var result = await sharedServicesDataHubTestApi.SynchronizeSeats(request);

            return result;
        }
    }
}
