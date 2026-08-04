using easyJet.Holidays.Api.Domain.Data.DynamoDB.Bookings;
using easyJet.Holidays.Api.Domain.Data.Seats;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Seat = easyJet.Holidays.Api.Domain.Data.DynamoDB.Bookings.Seat;

namespace easyJet.Holidays.Api.Domain.Services.Booking
{
    /// <summary>
    /// Implements <see cref="IFlightSeatPlanCacheService"/>
    /// </summary>
    public class FlightSeatPlanCacheService : IFlightSeatPlanCacheService
    {
        private readonly IAWSDbRepository<FlightSeatPlan> _flightSeatPlanRepo;
        private readonly ILogger<BookingSessionService> _logger;
        private readonly AwsSettings _awsSettings;

        public FlightSeatPlanCacheService(IAWSDbRepository<FlightSeatPlan> flightSeatPlanRepo,
                                     ILogger<BookingSessionService> logger,
                                     IOptions<AwsSettings> awsSettings)
        {
            _flightSeatPlanRepo = flightSeatPlanRepo;
            _logger = logger;
            _awsSettings = awsSettings?.Value ?? throw new ArgumentNullException(nameof(awsSettings));
        }

        /// <summary>
        /// Returns a string with concatenation of the input parameters
        /// </summary>
        /// <param name="flightNumber"></param>
        /// <param name="departureAirportCode"></param>
        /// <param name="arrivalAirportCode"></param>
        /// <param name="departureDate"></param>
        /// <param name="promo"></param>
        /// <returns></returns>
        public static string GetFlightId(
            string flightNumber,
            string departureAirportCode,
            string arrivalAirportCode,
            DateTime departureDate,
            string promo)
        {
            return $"{flightNumber}{departureAirportCode}{arrivalAirportCode}{departureDate:yyyMMdd}{promo}";
        }

        /// <summary>
        /// Converts <see cref="GetSeatsMapResponse"/> into a list of <see cref="Seat"/> discarding unnecessary data
        /// </summary>
        /// <param name="seatsMapResponse"></param>
        /// <returns></returns>
        internal static List<Seat> ConvertGetSeatsMapResponse(GetSeatsMapResponse seatsMapResponse)
        {
            return seatsMapResponse.Rows?
                .SelectMany(row => row.Blocks)
                .SelectMany(block => block.Seats)
                .Select(seat => new Seat
                {
                    Number = seat.Number,
                    Price = seat.Price,
                    PriceBand = seat.PriceBand,
                    Products = seat.Products
                }).ToList() ?? new List<Seat>();
        }

        /// <inheritdoc/>
        public Task<List<Seat>> CreateFlightSeatPlan(string flightId, GetSeatsMapResponse seatsMapResponse)
        {
            if (string.IsNullOrWhiteSpace(flightId))
            {
                throw new ArgumentException("Argument is null or empty", nameof(flightId));
            }

            if (seatsMapResponse == null)
            {
                throw new ArgumentNullException(nameof(seatsMapResponse));
            }

            var seats = ConvertGetSeatsMapResponse(seatsMapResponse);
            var seatPlan = new FlightSeatPlan
            {
                FlightId = flightId,
                TTL = DateTime.UtcNow.AddHours(_awsSettings.TTL.FlightSeatPlan),
                Seats = seats
            };

            return CreateFlightSeatPlanInternalAsync();

            async Task<List<Seat>> CreateFlightSeatPlanInternalAsync()
            {
                try
                {
                    await _flightSeatPlanRepo.SaveAsync(seatPlan);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to create a flight seat plan");
                }

                return seats;
            }
        }

        /// <inheritdoc/>
        public Task<List<Seat>> GetFlightSeatPlan(string flightId)
        {
            if (string.IsNullOrWhiteSpace(flightId))
            {
                throw new ArgumentException("Argument is null or empty", nameof(flightId));
            }

            return GetFlightSeatPlanInternalAsync();

            async Task<List<Seat>> GetFlightSeatPlanInternalAsync()
            {
                var seatPlan = await _flightSeatPlanRepo.GetItemAsync(flightId);
                return seatPlan?.TTL?.ToUniversalTime() >= DateTime.UtcNow ? seatPlan.Seats : default;
            }
        }
    }
}