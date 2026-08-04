using Allure.Xunit.Attributes;
using Allure.XUnit.Attributes.Steps;
using easyJet.Holiday.IntegrationTests.Infrastructure.Repeat;
using easyJet.Holiday.IntegrationTests.Infrastructure.TestApi;
using easyJet.Holiday.IntegrationTests.Shared.Constants;
using easyJet.Holiday.IntegrationTests.Shared.Helpers;
using easyJet.Holiday.IntegrationTests.Shared.Models.Booking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Seats;
using FluentAssertions;
using FluentAssertions.Execution;
using Refit;
using Xunit.Abstractions;
using Product = easyJet.Holidays.Api.Domain.Data.Booking.Product;

namespace easyJet.Holiday.IntegrationTests.Tests.Amend;

[AllureSuite("Amendment tests")]
[AllureSubSuite("Amend seats")]
[AllureOwner("ANC team")]
public class AmendSeatsTests : BaseTest
{
    public AmendSeatsTests(
        IHttpClientFactory _httpClientFactory,
        TestApiHttpClient testApiHttpClient,
        ITestOutputHelper testOutputHelper)
        : base(_httpClientFactory, testApiHttpClient, testOutputHelper) { }

    [Theory(DisplayName = "Add seats for non-infants")]
    [InlineData(2, 1)]
    [InlineData(6, 0)]
    public async Task CreateRandomBookingWithoutSeats_SuccessfullyAddSeatsForAllNonInfants(int adultCount, int childrenCount)
    {
        var (booking, amendedBooking) =
            await RepeatDecorator<(BookingResponse?, BookingResponse?)>
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
                            ChildrenNumber = childrenCount
                        }
                    });

                    var loginCookie = await LoginAsAdminUserStep(bookingContext.Content.CustomerCredentials);
                    var (_, amendedBooking) = await AmendSeatsStep(bookingContext.Content.BookingResponse, loginCookie);
                    return (bookingContext.Content.BookingResponse, amendedBooking.Content);
                });

        using (new AssertionScope())
        {
            booking.Should().NotBeNull();
            amendedBooking.Should().NotBeNull();
            booking.SeatSelection.Should().NotBeNull();
            amendedBooking.SeatSelection.Should().NotBeNull();

            foreach (var seatMap in booking.SeatSelection)
            {
                seatMap.Seats.Should().BeNullOrEmpty();
            }

            amendedBooking.SeatSelection.Should().NotBeNull();
            amendedBooking.SeatSelection.Count.Should().Be(booking.SeatSelection.Count);

            foreach (var seatMap in amendedBooking.SeatSelection)
            {
                seatMap.Seats.Should().NotBeNullOrEmpty();
                seatMap.Seats.Count.Should().Be(booking.Guests.Count);
            }
        }
    }

    [Theory(DisplayName = "Amend seats for non-infants")]
    [InlineData(2, 1)]
    [InlineData(6, 0)]
    public async Task CreateRandomBookingWithSeatsForAllNonInfants_SuccessfullyAmendSeats(int adultCount, int childrenCount)
    {
        var (booking, amendedBooking) =
            await RepeatDecorator<(BookingResponse?, BookingResponse?)>
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

                    var loginCookie = await LoginAsAdminUserStep(bookingContext.Content.CustomerCredentials);
                    var (_, amendedBooking) = await AmendSeatsStep(bookingContext.Content.BookingResponse, loginCookie);
                    return (bookingContext.Content.BookingResponse, amendedBooking.Content);
                });

        using (new AssertionScope())
        {
            booking.Should().NotBeNull();
            amendedBooking.Should().NotBeNull();
            booking?.SeatSelection.Should().NotBeNull();
            amendedBooking?.SeatSelection.Should().NotBeNull();
            amendedBooking?.SeatSelection.Count.Should().Be(booking?.SeatSelection.Count);

            foreach (var seatMap in booking.SeatSelection)
            {
                seatMap.Seats.Should().NotBeEmpty();
                seatMap.Seats.Count.Should().Be(booking.Guests.Count);
                var amendedSeatMap = amendedBooking.SeatSelection.First(sm => sm.FlightNumber == seatMap.FlightNumber);
                amendedSeatMap.Seats.Should().NotBeEmpty();
                amendedSeatMap.Seats.Count.Should().Be(booking.Guests.Count);
                foreach (var guest in booking.Guests)
                {
                    var oldSeat = seatMap.Seats.SingleOrDefault(s => s.PaxIndex.ToString() == guest.Index)?.SeatNumber;
                    var newSeat = amendedSeatMap.Seats.SingleOrDefault(s => s.PaxIndex.ToString() == guest.Index)?.SeatNumber;

                    oldSeat.Should().NotBeNullOrWhiteSpace();
                    newSeat.Should().NotBeNullOrWhiteSpace();
                    oldSeat.Should().NotBe(newSeat);
                }
            }
        }
    }

    [Theory(DisplayName = "Upgrade seats for non-infants")]
    [InlineData(2, 1, SeatPriceBands.StandardB2b, SeatPriceBands.UpFront, true)]
    [InlineData(4, 0, SeatPriceBands.StandardB2b, SeatPriceBands.UpFront, true)]
    [InlineData(2, 1, SeatPriceBands.UpFront, SeatPriceBands.RearStandard, false)]
    [InlineData(4, 0, SeatPriceBands.UpFront, SeatPriceBands.StandardB2b, false)]
    public async Task CreateRandomBookingWithSeatsForAllNonInfants_SuccessfullyUpgradeSeats(int adultCount, int childrenCount, string initialPriceBand, string newPriceBand, bool isUpgrade)
    {
        var (booking, amendedBooking, amendmentCharges) =
            await RepeatDecorator<(BookingResponse?, BookingResponse?, decimal?)>
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
                            BookSeatsForAllNonInfants = true,
                            SeatsPriceBand = initialPriceBand
                        }
                    });

                    var loginCookie = await LoginAsAdminUserStep(bookingContext.Content.CustomerCredentials);
                    var (amendResponse, amendedBooking) = await AmendSeatsStep(bookingContext.Content.BookingResponse, loginCookie, newPriceBand);

                    var booking = await LoadBookingStep(
                        bookingContext.Content.BookingResponse.BookingReference,
                        bookingContext.Content.Customer.LastName,
                        bookingContext.Content.BookingResponse.Package.Accom.StartDate);

                    return (bookingContext.Content.BookingResponse, booking, amendResponse.Content?.AmendmentCharges);
                });

        using (new AssertionScope())
        {
            booking.Should().NotBeNull();
            amendedBooking.Should().NotBeNull();
            booking?.SeatSelection.Should().NotBeNull();
            amendedBooking?.SeatSelection.Should().NotBeNull();
            amendedBooking?.SeatSelection.Count.Should().Be(booking?.SeatSelection.Count);

            if (isUpgrade)
            {
                amendmentCharges.Should().BePositive();
            }
            else
            {
                amendmentCharges.Should().Be(0);
            }

            var expectedPriceBand = newPriceBand == SeatPriceBands.StandardB2b
                ? SeatPriceBands.Standard
                : newPriceBand;

            foreach (var seatMap in amendedBooking.SeatSelection)
            {
                seatMap.Seats.Should().NotBeEmpty();
                seatMap.Seats.Count.Should().Be(booking.Guests.Count);
                foreach (var seatMapSeat in seatMap.Seats)
                {
                    seatMapSeat.PriceBand.Should().Be(expectedPriceBand);
                }
            }
        }
    }

    [AllureStep("Amend seats")]
    private async Task<(ApiResponse<AmendSeatsResponse>, ApiResponse<BookingResponse>)> AmendSeatsStep(BookingResponse bookingResponse, string loginCookie, string? priceBand = null)
    {
        var outboundRoute = bookingResponse.Package.Transport.Routes.First(r => r.Direction == Direction.Outbound);
        var inboundRoute = bookingResponse.Package.Transport.Routes.First(r => r.Direction == Direction.Inbound);
        var seatMapOutbound = await seatsApi.Seats(new GetSeatsMapRequest(outboundRoute, bookingResponse.Currency.Code));
        var seatMapInbound = await seatsApi.Seats(new GetSeatsMapRequest(inboundRoute, bookingResponse.Currency.Code));

        var infantsNumber = bookingResponse.Guests.Count(guest => guest.Type == PersonType.Infant);
        var originalOutboundSeats = bookingResponse.SeatSelection.Single(sm => sm.FlightNumber == outboundRoute.FlightNumberWithoutCar);
        var originalInboundSeats = bookingResponse.SeatSelection
            .Single(sm => sm.FlightNumber == inboundRoute.FlightNumberWithoutCar);

        var availableOutboundSeats = seatMapOutbound.GetAvailableSeats(
            originalOutboundSeats.Seats?.Count ?? bookingResponse.Guests.Count - infantsNumber,
            infantsNumber > 0, priceBand)
            .ToList();
        var availableInboundSeats = seatMapInbound.GetAvailableSeats(
            originalInboundSeats.Seats?.Count ?? bookingResponse.Guests.Count - infantsNumber,
            infantsNumber > 0, priceBand)
            .ToList();

        if (availableOutboundSeats.Count < (originalOutboundSeats.Seats?.Count ?? 0) ||
            availableInboundSeats.Count < (originalInboundSeats.Seats?.Count ?? 0))
        {
            throw new Exception("Not enough seats available");
        }

        var amendSeatsRequest = new AmendSeatsRequest
        {
            BookingReference = bookingResponse.BookingReference,
            SeatSelection = new List<SeatMap>
            {
                GetSeatMap(originalOutboundSeats, availableOutboundSeats),
                GetSeatMap(originalInboundSeats, availableInboundSeats)
            }
        };

        var amendSeatsResponse = await amendBookingApi.AmendSeats(amendSeatsRequest, loginCookie);
        if (amendSeatsResponse.Content == null)
        {
            throw amendSeatsResponse.Error;
        }

        var amendBookingRequest = new AmendBookingRequest
        {
            BookingReference = bookingResponse.BookingReference,
            BrowserInfo = BrowserInfoConstants.DefaultBrowserInfo(),
            Date = bookingResponse.BookingDate.DateTime,
            DeviceId = Guid.NewGuid().ToString(),
            LastName = bookingResponse.Guests.Single(x => x.IsLead).LastName,
            PaymentInfo = PaymentInfoConstants.CreatePaymentInfo(amendSeatsResponse.Content?.AmendmentCharges ?? 0),
            SeatSelection = amendSeatsRequest.SeatSelection
        };

        var amendCommitResponse = await amendBookingApi.AmmendBooking(amendBookingRequest, Guid.NewGuid().ToString(), loginCookie);
        return (amendSeatsResponse, amendCommitResponse);
    }

    private SeatMap GetSeatMap(SeatMap originalSeats, List<SeatMapSeat> newSeats)
    {
        return new SeatMap
        {
            FlightNumber = originalSeats.FlightNumber,
            SectorId = originalSeats.SectorId,
            Seats = originalSeats.Seats?.Select((seat, idx) => ConvertSeat(newSeats[idx], seat.PaxIndex)).ToList()
                    ?? newSeats.Select((seat, idx) => ConvertSeat(seat, idx + 1)).ToList()
        };

        Seat ConvertSeat(SeatMapSeat seat, int paxIndex)
        {
            return new Seat
            {
                SeatNumber = seat.Number,
                PaxIndex = paxIndex,
                Price = seat.Price,
                PriceBand = seat.PriceBand,
                Products = seat.Products.Select(p => new Product
                {
                    Name = p.Name,
                    Description = p.Description,
                    Icon = p.Icon,
                    Id = p.Id
                }).ToList()
            };
        }
    }
}
