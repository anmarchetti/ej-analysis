using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking.Repository;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;
using System.Text;

namespace easyJet.Holidays.Api.Domain.Decorators.Amend
{
    /// <summary>
    /// Decorator class for <see cref="IAmendBookingRepository"/>, providing caching functionality 
    /// to improve performance on repeated amend booking requests.
    /// </summary>
    /// <remarks>
    /// The decorator checks a cache service for an existing <see cref="ValidateAmendBookingResponse"/> 
    /// before delegating the request to the underlying repository. If found in cache, it immediately returns 
    /// the cached result; if not, it fetches from the repository and stores the new result in cache.
    /// </remarks>
    public class AmendBookingRepositoryCacheDecorator : IAmendBookingRepository
    {
        private readonly IAmendBookingRepository _amendBookingRepository;
        private readonly IAmendCacheService _amendCacheService;
        private readonly ILogger<AmendBookingRepositoryCacheDecorator> _logger;

        /// <summary>
        /// Initializes a new instance of the <see cref="AmendBookingRepositoryCacheDecorator"/> class.
        /// </summary>
        /// <param name="amendBookingRepository">
        /// The underlying amend booking repository to which requests are delegated 
        /// if they are not found in the cache.
        /// </param>
        /// <param name="amendCacheService">
        /// The cache service responsible for storing and retrieving 
        /// <see cref="ValidateAmendBookingResponse"/> objects.
        /// </param>
        /// <param name="logger">
        /// Logging service
        /// </param>
        /// <exception cref="ArgumentNullException">
        /// Thrown if <paramref name="amendBookingRepository"/> or <paramref name="amendCacheService"/> is <c>null</c>.
        /// </exception>
        public AmendBookingRepositoryCacheDecorator(
            IAmendBookingRepository amendBookingRepository,
            IAmendCacheService amendCacheService,
            ILogger<AmendBookingRepositoryCacheDecorator> logger)
        {
            _amendBookingRepository = amendBookingRepository;
            _amendCacheService = amendCacheService;
            _logger = logger;
        }

        /// <summary>
        /// Retrieves and validates an amended booking response, using a cache to avoid redundant calls.
        /// </summary>
        /// <remarks>
        /// This method generates a cache key by hashing certain <see cref="BookingResponse"/> properties. 
        /// If a valid cached response is found, it is returned immediately. Otherwise, the call is delegated 
        /// to the underlying repository, and the result is then stored in cache.
        /// </remarks>
        /// <param name="booking">
        /// The original booking object used to build the request.
        /// </param>
        /// <param name="stateful">
        /// Indicates whether session state should be maintained (<c>true</c>) or discarded (<c>false</c>).
        /// In the current implementation, the parameter is forwarded to the underlying repository
        /// or may be ignored as needed.
        /// </param>
        /// <returns>
        /// A <see cref="Task{ValidateAmendBookingResponse}"/> representing the asynchronous operation, 
        /// containing the amended booking validation results.
        /// </returns>
        /// <exception cref="ArgumentNullException">
        /// Thrown if <paramref name="booking"/> is <c>null</c>.
        /// </exception>
        public async Task<ValidateAmendBookingResponse> GetValidateAmendBookingResponse(BookingResponse booking, bool stateful = false)
        {
            ArgumentNullException.ThrowIfNull(booking);

            ValidateAmendBookingResponse validateAmendBookingResponse = null;

            try
            {
                var partitionKey = GenerateHashKey(booking);

                validateAmendBookingResponse = await _amendCacheService.GetItemAsync<ValidateAmendBookingResponse>(partitionKey);

                if (validateAmendBookingResponse is not null)
                {
                    return validateAmendBookingResponse;
                }

                validateAmendBookingResponse = await _amendBookingRepository.GetValidateAmendBookingResponse(booking);

                if (validateAmendBookingResponse is not null)
                {
                    await _amendCacheService.SetItemAsync(partitionKey, validateAmendBookingResponse);
                }

                return validateAmendBookingResponse;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Can not to get booking data from cache for {BookingReference}. Load data from original source.", booking.BookingReference);
                return validateAmendBookingResponse ?? await _amendBookingRepository.GetValidateAmendBookingResponse(booking);
            }
        }

        /// <summary>
        /// Generates a hash-based partition key from various fields of the <see cref="BookingResponse"/> object,
        /// ensuring a unique cache key even if different bookings share similar structures.
        /// </summary>
        /// <param name="booking">The booking from which to generate the key.</param>
        /// <returns>A SHA-256 hash (in hex) of the concatenated booking fields.</returns>
        /// <remarks>
        /// This approach guarantees a deterministic and consistent key for each unique booking,
        /// preventing collisions between different booking objects.
        /// </remarks>
        private static string GenerateHashKey(BookingResponse booking)
        {
            string[] keyParameters =
            [
                booking.BookingReference,
                booking.Package.Accom.Code,
                booking.Package.Accom.StartDate,
                ..booking.Package.Accom.Rooms.Select(x => x.Code),
                ..booking.Package.Accom.Rooms.Select(x => x.Board),
                ..booking.Package.Transport.Routes.Select(x=>x.FltNo),
                ..booking.SeatSelection?.SelectMany(x=>x.Seats?.Select(y=>y.SeatNumber)!)! ?? [],
                ..booking.Transfers?.Select(x=>x?.Code)! ?? [],
                ..booking.ExtraLuggageInfo?.Items?.Select(x=>x?.ItemCode)! ?? []
            ];

            var hash = SHA256.HashData(Encoding.UTF8.GetBytes(string.Join('-', keyParameters)));
            var key = Convert.ToHexString(hash);

            return key;
        }
    }
}