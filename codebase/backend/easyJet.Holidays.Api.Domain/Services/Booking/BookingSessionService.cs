using easyJet.Holidays.Api.Domain.Data.DynamoDB.Bookings;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.Booking
{
    /// <summary>
    /// Implements <see cref="IBookingSessionService"/>
    /// </summary>
    public class BookingSessionService : IBookingSessionService
    {
        private readonly IAWSDbRepository<BookingSession> _bookingSessionRepo;
        private readonly ILogger<BookingSessionService> _logger;
        private readonly AwsSettings _awsSettings;

        /// <summary>
        /// <see cref="BookingSessionService"/> ctor for DI
        /// </summary>
        /// <param name="bookingSessionRepo"></param>
        /// <param name="logger"></param>
        /// <param name="awsSettings"></param>
        public BookingSessionService(IAWSDbRepository<BookingSession> bookingSessionRepo,
                                     ILogger<BookingSessionService> logger,
                                     IOptions<AwsSettings> awsSettings)
        {
            _bookingSessionRepo = bookingSessionRepo;
            _logger = logger;
            _awsSettings = awsSettings?.Value ?? throw new ArgumentNullException(nameof(_awsSettings));
        }

        /// <inheritdoc/>
        public async Task CreateBookingSession(BookingSession bookingSession)
        {
            if (bookingSession == null)
            {
                throw new ArgumentNullException(nameof(bookingSession));
            }

            if (string.IsNullOrWhiteSpace(bookingSession.BookingRef))
            {
                throw new InvalidOperationException("BookingReference inside bookingSession is null or whitespace.");
            }

            if (string.IsNullOrWhiteSpace(bookingSession.SessionId))
            {
                throw new InvalidOperationException("SessionID inside bookingSession is null or whitespace.");
            }

            bookingSession.TTL = DateTime.UtcNow.AddHours(_awsSettings.TTL.BookingSessions);

            try
            {
                await _bookingSessionRepo.SaveAsync(bookingSession);
            }
            catch (Exception exc)
            {
                _logger.LogError(exc, "Failed to create BookingSession", bookingSession);
                //fallback - if we can't create ej session into dynamoDb -> we will use session id from analytics data
                await Task.CompletedTask;
            }
        }

        /// <inheritdoc/>
        public async Task<BookingSession> GetBookingSession(string bookingRef)
        {
            if (string.IsNullOrWhiteSpace(bookingRef))
            {
                throw new ArgumentNullException(nameof(bookingRef));
            }

            var session = await _bookingSessionRepo.GetItemAsync(bookingRef);

            return session?.TTL?.ToUniversalTime() >= DateTime.UtcNow ? session : default;
        }
    }
}