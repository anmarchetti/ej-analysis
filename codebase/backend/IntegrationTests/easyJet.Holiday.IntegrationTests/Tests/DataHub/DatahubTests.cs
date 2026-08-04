using Allure.Xunit.Attributes;
using Allure.Xunit.Attributes.Steps;
using easyJet.Holiday.IntegrationTests.Infrastructure.Repeat;
using easyJet.Holiday.IntegrationTests.Infrastructure.TestApi;
using easyJet.Holidays.Api.Domain.Data.SharedServices.DataHub;
using FluentAssertions;
using FluentAssertions.Execution;
using Refit;
using Xunit.Abstractions;

namespace easyJet.Holiday.IntegrationTests.Tests.DataHub
{

    [AllureSuite("DatahubTests tests")]
    [AllureSubSuite("Synchronize PNR")]
    [AllureOwner("BOA team")]
    public class DatahubTests : BaseTest
    {
        public DatahubTests(
        IHttpClientFactory _httpClientFactory,
        TestApiHttpClient testApiHttpClient,
        ITestOutputHelper testOutputHelper) : base(_httpClientFactory, testApiHttpClient, testOutputHelper) { }

        [Fact(DisplayName = "Synchronize seats for existing booking.")]
        [AllureIssue("BOA-316")]
        public async Task SynchronizeSeats_Success()
        {
            string? usedBookingReference = string.Empty;

            var availableDate =
                await RepeatDecorator<ApiResponse<DatahubSyncResponse>>
                    .Create()
                    .RepeatTimes(5)
                    .Execute(async () =>
                    {
                        var bookingContext = await CreateBookingStep();
                        usedBookingReference = bookingContext.Content?.BookingResponse.BookingReference;

                        return await DatahubSyncSeatRequest(usedBookingReference);
                    });

            using (new AssertionScope())
            {
                usedBookingReference.Should().NotBeNullOrWhiteSpace();
                availableDate?.Content?.Results.Should().ContainKey(usedBookingReference);
                availableDate!.Content!.Results[usedBookingReference].Status.Should().Be(SyncStatus.Queued);
            }
        }

        [Fact(DisplayName = "Synchronize flights for existing booking.")]
        [AllureIssue("BOA-343")]
        public async Task SynchronizeFlights_Success()
        {
            string? usedFlightReference = string.Empty;

            var availableDate =
                await RepeatDecorator<ApiResponse<DatahubSyncResponse>>
                    .Create()
                    .RepeatTimes(5)
                    .Execute(async () =>
                    {
                        var bookingContext = await CreateBookingStep();

                        usedFlightReference = bookingContext?.Content?.BookingResponse.Package.Transport.Routes[0].ExtRefId;

                        return await DatahubSyncFlightRequest(usedFlightReference);
                    });

            using (new AssertionScope())
            {
                usedFlightReference.Should().NotBeNullOrWhiteSpace();
                availableDate?.Content?.Results.Should().ContainKey(usedFlightReference);
                availableDate!.Content!.Results[usedFlightReference].Status.Should().Be(SyncStatus.Queued);
            }
        }

        [AllureStep("Send Synchronize seat Request")]
        internal async Task<ApiResponse<DatahubSyncResponse>> DatahubSyncSeatRequest(string? bookingRef)
        {
            var request = new DatahubSyncRequest { Reservations = [new ReservationRequest { ReservationId = bookingRef ?? string.Empty }] };

            var synchronizeResponse = await sharedServicesDataHubTestApi.SynchronizeSeats(request);

            return synchronizeResponse;
        }

        [AllureStep("Send Synchronize seat Request")]
        internal async Task<ApiResponse<DatahubSyncResponse>> DatahubSyncFlightRequest(string? bookingRef)
        {
            var request = new DatahubSyncRequest { Reservations = [new ReservationRequest { ReservationId = bookingRef ?? string.Empty }] };

            var synchronizeResponse = await sharedServicesDataHubTestApi.SynchronizeFlights(request);

            return synchronizeResponse;
        }
    }
}
