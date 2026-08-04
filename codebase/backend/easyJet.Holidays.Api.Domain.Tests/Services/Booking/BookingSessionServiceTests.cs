using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.Bookings;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Services.Booking;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking
{
    public class BookingSessionServiceTests
    {
        private readonly IFixture _fixture;
        private readonly Mock<IAWSDbRepository<BookingSession>> _sessionRepo;
        private readonly Mock<ILogger<BookingSessionService>> _logger;
        private readonly Mock<AwsSettings> _settings;
        private readonly BookingSessionService _sut;

        public BookingSessionServiceTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();
            _sessionRepo = new Mock<IAWSDbRepository<BookingSession>>();
            _logger = _fixture.Freeze<Mock<ILogger<BookingSessionService>>>();
            _settings = new Mock<AwsSettings>();

            var awsSettings = new AwsSettings()
            {
                TTL = new AwsSettingsTTL()
                {
                    BookingSessions = 24,
                }
            };

            var awsOptions = Options.Create(awsSettings);

            _sut = new BookingSessionService(
                _sessionRepo.Object,
                _logger.Object,
                awsOptions
            );
        }

        #region GetBookingSession
        [Fact]
        public async Task GetBookingSession_BookingReferenceIsNull_Throws()
        {
            // Arrange
            var bookingReference = string.Empty;

            // Act
            Func<Task<BookingSession>> action = async () => await _sut.GetBookingSession(bookingReference);

            // Assert
            await action.Should().ThrowAsync<ArgumentNullException>("because the booking reference number is empty.");
            _sessionRepo.Verify(repo => repo.GetItemAsync(bookingReference), Times.Never());
        }

        [Fact]
        public async Task GetBookingSession_ExpiredTTL_ReturnsNull()
        {
            // Arrange
            var bookingReference = "12345";
            _sessionRepo.Setup(ex => ex.GetItemAsync(It.IsAny<string>())).ReturnsAsync(new BookingSession()
            {
                BookingRef = "",
                SessionId = "",
                TTL = DateTime.UtcNow.AddDays(-2)
            });

            // Act
            var session = await _sut.GetBookingSession(bookingReference);

            // Assert
            Assert.Null(session);
        }

        [Fact]
        public async Task GetBookingSession_Valid_ReturnsSessionForBookingReference()
        {
            // Arrange
            var bookingReference = "12345";
            var sessionID = "a-b-c-d";
            _sessionRepo.Setup(ex => ex.GetItemAsync(bookingReference)).ReturnsAsync(new BookingSession()
            {
                BookingRef = bookingReference,
                SessionId = sessionID,
                TTL = DateTime.UtcNow.AddDays(10),
            });

            // Act
            var session = await _sut.GetBookingSession(bookingReference);

            // Assert
            session.Should().NotBeNull();
        }
        #endregion GetBookingSession
        #region CreateBookingSession
        [Fact]
        public async Task CreateBookingSession_SessionIsNull_Throws()
        {
            // Arrange
            BookingSession session = null;

            // Act
            Func<Task> action = async () => await _sut.CreateBookingSession(session);

            // Assert
            await action.Should().ThrowAsync<ArgumentNullException>("because the session to persist is null.");
            _sessionRepo.Verify(repo => repo.SaveAsync(It.IsAny<BookingSession>()), Times.Never());
        }

        [Fact]
        public async Task CreateBookingSession_BookingRefNull_Throws()
        {
            // Arrange
            BookingSession session = new BookingSession()
            {
                BookingRef = null,
                SessionId = Guid.NewGuid().ToString(),
            };

            // Act
            Func<Task> action = async () => await _sut.CreateBookingSession(session);

            // Assert
            await action.Should().ThrowAsync<InvalidOperationException>("because there is no bookingNumber.");
            _sessionRepo.Verify(repo => repo.SaveAsync(It.IsAny<BookingSession>()), Times.Never());
        }

        [Fact]
        public async Task CreateBookingSession_SessionIdNull_Throws()
        {
            // Arrange
            BookingSession session = new BookingSession()
            {
                BookingRef = "1234567",
                SessionId = null,
            };

            // Act
            Func<Task> action = async () => await _sut.CreateBookingSession(session);

            // Assert
            await action.Should().ThrowAsync<InvalidOperationException>("because there is no sessionId.");
            _sessionRepo.Verify(repo => repo.SaveAsync(It.IsAny<BookingSession>()), Times.Never());
        }

        [Fact]
        public async Task CreateBookingSession_PersistsValidBooking()
        {
            // Arrange
            BookingSession session = new BookingSession()
            {
                BookingRef = "1234567",
                SessionId = Guid.NewGuid().ToString(),
            };

            // Act
            await _sut.CreateBookingSession(session);

            // Assert
            _sessionRepo.Verify(repo => repo.SaveAsync(session), Times.Once());
        }
        #endregion CreateBookingSession
    }
}
