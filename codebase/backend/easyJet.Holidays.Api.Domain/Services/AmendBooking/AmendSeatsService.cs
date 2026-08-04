using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Dates;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Seats;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Interfaces.Seats;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using Force.DeepCloner;
using System.Runtime.CompilerServices;
using Product = easyJet.Holidays.Api.Domain.Data.Booking.Product;

[assembly: InternalsVisibleTo("easyJet.Holidays.Api.Domain.Tests")]
namespace easyJet.Holidays.Api.Domain.Services.AmendBooking
{
    /// <summary>
    /// Service for amending seat selection
    /// </summary>
    /// <seealso cref="easyJet.Holidays.Api.Domain.Interfaces.AmendBooking.IAmendSeatsService" />
    public class AmendSeatsService : IAmendSeatsService
    {
        private readonly IBookingRepository _bookingRepository;
        private readonly IAuthenticationService _authService;
        private readonly ITradeAgentAuthenticationService _tradeAgentAuthService;
        private readonly ISeatingService _seatingService;
        private readonly IFlightExtraService _flightExtraService;

        public AmendSeatsService(
            IBookingRepository bookingRepository,
            IAuthenticationService authService,
            ITradeAgentAuthenticationService tradeAgentAuthService,
            ISeatingService seatingService,
            IFlightExtraService flightExtraService)
        {
            _bookingRepository = bookingRepository;
            _authService = authService;
            _tradeAgentAuthService = tradeAgentAuthService;
            _seatingService = seatingService;
            _flightExtraService = flightExtraService;
        }

        /// <summary>
        /// Changes seat selection
        /// </summary>
        /// <param name="amendSeatsRequest">Amend seats request with new seat selection data</param>
        /// <returns>Validate booking information with price</returns>
        /// <exception cref="easyJet.Holidays.Api.Common.Exceptions.ApiException">null - Customer is not logged in or is not the lead passenger for the booking</exception>
        public async Task<AmendSeatsResponse> ChangeSeats(AmendSeatsRequest amendSeatsRequest)
        {
            ArgumentNullException.ThrowIfNull(amendSeatsRequest);

            var booking = await _bookingRepository
                .GetBooking(amendSeatsRequest.BookingReference, new GetBookingOptions(){MapRealExtraLuggageInfoForInternalFlightsWhenConfiguredInCms = true})
                .IfSeatsAmendmentAllowed()
                .WhenLoggedInAsLeadPaxOrTradeAgent(_tradeAgentAuthService, _authService);

            var amendInfoBookingRequest = new AmendInfoBookingRequest
            {
                BookingReference = amendSeatsRequest.BookingReference,
                SeatSelection = amendSeatsRequest.SeatSelection
            };

            var needToAddExtraFlightInformationIntoAtcomRequest = await _flightExtraService.NeedToAddExtraFlightInformationIntoAtcomRequest(booking.Prom);
            var amendBookingInfo = await _bookingRepository.ValidateAmendBookingInfo(amendInfoBookingRequest, booking, false, needToAddExtraFlightInformationIntoAtcomRequest);

            var response = new AmendSeatsResponse
            {
                NewSeatSelection = CalculateSeatPriceDifference(amendBookingInfo.SeatSelection, booking.SeatSelection),
                AmendmentCharges = amendBookingInfo.PaymentInfo?.AmendmentCharges
            };

            if (_tradeAgentAuthService.IsLoggedInAsTradeAgent())
            {
                response.PaymentInfo = amendBookingInfo?.PaymentInfo;
                response.TradeAgentPriceBreakdown = amendBookingInfo?.TradeAgentPriceBreakdown;
                response.PriceBreakdown = amendBookingInfo?.PriceBreakdown;
            }

            return response;
        }

        public async Task<AmendDatesOffer> UpdateSeatsInformation(AmendDatesOffer datesOffer)
        {
            if (datesOffer.Offer.SeatSelection == null || !datesOffer.Offer.SeatSelection.Any())
            {
                return datesOffer;
            }

            var seatSelection = datesOffer.Offer.SeatSelection;
            var routes = datesOffer.Offer.Transport.Routes;
            var currencyCode = datesOffer.Offer.Currency.Code;

            foreach (var seatMap in seatSelection.Where(seatMap => seatMap?.Seats?.Any() ?? false))
            {
                var route = routes.SingleOrDefault(r => r.FlightNumberWithoutCar == seatMap.FlightNumber);
                var b2BSeatsMap = await _seatingService.GetSeatsMap(new GetSeatsMapRequest(route, currencyCode));
                var seatList = b2BSeatsMap.Rows?
                    .SelectMany(row => row.Blocks)
                    .SelectMany(block => block.Seats);

                var updatedSeatsInfo = seatMap.Seats.Select(seat => UpdateSeatsInformation(seat, seatList)).ToList();

                datesOffer.IsSeatsPriceChanged = datesOffer.IsSeatsPriceChanged ? datesOffer.IsSeatsPriceChanged : updatedSeatsInfo.Any(x => x.IsPriceChanges);
                datesOffer.IsSeatsUnavailable = datesOffer.IsSeatsUnavailable ? datesOffer.IsSeatsUnavailable : !updatedSeatsInfo.Any(x => x.IsAvailable);
            }

            return datesOffer;
        }

        internal (Seat Seat, bool IsPriceChanges, bool IsAvailable) UpdateSeatsInformation(Seat seat, IEnumerable<SeatMapSeat> seatList)
        {
            var updatedSeatInformation = seatList.Single(x => x.Number.Equals(seat.SeatNumber, StringComparison.InvariantCultureIgnoreCase));

            var isPriceChanged = updatedSeatInformation.Price != seat.Price;
            var isAvailable = updatedSeatInformation.IsAvailable;

            UpdateSeatsInformation(seat, updatedSeatInformation);

            return (seat, isPriceChanged, isAvailable);
        }

        internal void UpdateSeatsInformation(Seat oldSeatInfo, SeatMapSeat newSeatInfo)
        {
            oldSeatInfo.Price = newSeatInfo.Price;
            oldSeatInfo.PriceBand = newSeatInfo.PriceBand;
            oldSeatInfo.Products = newSeatInfo.Products.Select(x => new Product
            {
                Id = x.Id,
                Description = x.Description,
                Icon = x.Icon,
                Name = x.Name
            }).ToList();
        }

        internal static List<SeatMap> CalculateSeatPriceDifference(List<SeatMap> newSeatMap, List<SeatMap> oldSeatMap)
        {
            var result = newSeatMap.DeepClone() ?? new List<SeatMap>();

            foreach (var seatMap in result.Where(seatMap => seatMap?.Seats?.Any() ?? false))
            {
                var originalSeatMap = oldSeatMap?.SingleOrDefault(sm => sm?.SectorId == seatMap.SectorId);
                if (originalSeatMap == null || originalSeatMap.Seats.IsNullOrEmpty())
                {
                    continue;
                }

                foreach (var seat in seatMap.Seats)
                {
                    var originalSeat = originalSeatMap.Seats.SingleOrDefault(s => s.PaxIndex == seat.PaxIndex);
                    if (originalSeat == null)
                    {
                        continue;
                    }
                    seat.Price = Math.Max(0, seat.Price - originalSeat.Price);
                }
            }

            return result;
        }
    }
}