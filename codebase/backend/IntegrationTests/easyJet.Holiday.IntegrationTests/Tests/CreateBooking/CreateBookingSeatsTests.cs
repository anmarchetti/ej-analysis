using Allure.Xunit.Attributes;
using easyJet.Holiday.IntegrationTests.Infrastructure.Repeat;
using easyJet.Holiday.IntegrationTests.Infrastructure.TestApi;
using easyJet.Holiday.IntegrationTests.Shared.Models.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using FluentAssertions;
using FluentAssertions.Execution;
using Xunit.Abstractions;

namespace easyJet.Holiday.IntegrationTests.Tests.CreateBooking
{
    [AllureSuite("Booking tests")]
    [AllureSubSuite("Seats")]
    [AllureOwner("ANC team")]
    public class CreateBookingSeatsTests : BaseTest
    {
        public CreateBookingSeatsTests(
            IHttpClientFactory _httpClientFactory,
            TestApiHttpClient testApiHttpClient,
            ITestOutputHelper testOutputHelper)
            : base(_httpClientFactory, testApiHttpClient, testOutputHelper) { }

        [Theory(DisplayName = "Create booking with seats for non-infants. Success commit. Seats for all guests confirmed")]
        [InlineData(2, 2)]
        [InlineData(6, 0)]
        public async Task CreateBooking_RandomBooking_SeatsForAllGuests(int adultCount, int childrenCount)
        {
            var booking =
                await RepeatDecorator<BookingResponse>
                .Create()
                .RepeatTimes(20)
                .Execute(async () =>
                {
                    var bookingContext = await CreateBookingStep(new CreateBookingRequest
                    {
                        Language = "en",
                        BookingCreationParams = new BookingCreationParams
                        {
                            AdultsNumber = adultCount,
                            ChildrenNumber = childrenCount,
                            BookSeatsForAllNonInfants = true
                        }
                    });
                    return bookingContext.Content.BookingResponse;
                });

            using (new AssertionScope())
            {
                booking.Should().NotBeNull();
                booking.SeatSelection.Should().NotBeNull();
                foreach (var seatMap in booking.SeatSelection)
                {
                    seatMap.Seats.Should().NotBeEmpty();
                    seatMap.Seats.Count.Should().Be(booking.Guests.Count);
                }
            }
        }

        [Theory(DisplayName = "Create booking with seats for adults and infants. Success commit. Seats for infants match adult seats")]
        [InlineData(2, 2)]
        [InlineData(3, 1)]
        public async Task CreateBooking_RandomBooking_InfantSeatsMatchAdultSeats(int adultCount, int infantCount)
        {
            var booking =
                await RepeatDecorator<BookingResponse>
                    .Create()
                    .RepeatTimes(20)
                    .Execute(async () =>
                    {
                        var bookingContext = await CreateBookingStep(new CreateBookingRequest
                        {
                            Language = "en",
                            BookingCreationParams = new BookingCreationParams
                            {
                                AdultsNumber = adultCount,
                                InfantsNumber = infantCount,
                                BookSeatsForAllNonInfants = true
                            }
                        });

                        var booking = await LoadBookingStep(
                            bookingContext.Content.BookingResponse.BookingReference,
                            bookingContext.Content.Customer.LastName,
                            bookingContext.Content.BookingResponse.Package.Accom.StartDate);

                        return booking;
                    });

            using (new AssertionScope())
            {
                booking.Should().NotBeNull();
                booking.SeatSelection.Should().NotBeNull();
                foreach (var seatMap in booking.SeatSelection)
                {
                    seatMap.Seats.Should().NotBeEmpty();
                    seatMap.Seats.Count.Should().Be(booking.Guests.Count);

                    int firstInfantIndex = int.Parse(booking.Guests.First(g => g.Type == PersonType.Infant).Index);
                    for (int i = firstInfantIndex; i < firstInfantIndex + infantCount; i++)
                    {
                        var infantSeat = seatMap.Seats.First(s => s.PaxIndex == i);
                        var adultSeat = seatMap.Seats.First(s => s.PaxIndex == i - adultCount);

                        infantSeat.SeatNumber.Should().Be(adultSeat.SeatNumber);
                    }
                }
            }
        }
    }
}
