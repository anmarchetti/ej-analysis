using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Services.Booking;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking
{

    public class IdempotentBookingServiceTests
    {
        private readonly IFixture _fixture;
        private readonly IdempotentBookingService _sut;

        private readonly Mock<IBookingCreateService> _mockBookingCreateService;
        private readonly Mock<IBookingFetchService> _mockBookingFetchService;
        private readonly Mock<ILogger<IdempotentBookingService>> _mockLogger;
        private readonly Mock<IBookingTransactionsService> _mockTransactionService;
        private readonly Mock<IHttpContextAccessor> _mockHttpContextAccessor;
        private readonly Mock<IAmendBookingService> _mockAmendBookingService;


        public IdempotentBookingServiceTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();

            _fixture.Inject(Options.Create(new ApiSettings()
            {

            }));
            _fixture.Inject(Options.Create(new EnvironmentBehaviourSettings()
            {

            }));

            _mockBookingCreateService = new Mock<IBookingCreateService>();
            _mockBookingFetchService = new Mock<IBookingFetchService>();
            _mockLogger = new Mock<ILogger<IdempotentBookingService>>();
            _mockTransactionService = new Mock<IBookingTransactionsService>();
            _mockHttpContextAccessor = new Mock<IHttpContextAccessor>();
            _mockAmendBookingService = new Mock<IAmendBookingService>();


            _sut = new IdempotentBookingService(
                _mockBookingCreateService.Object,
                _mockBookingFetchService.Object,
                _mockTransactionService.Object,
                _mockLogger.Object,
                _mockHttpContextAccessor.Object,
                _mockAmendBookingService.Object,
                _fixture.Create<IOptions<ApiSettings>>(),
                _fixture.Create<IOptions<EnvironmentBehaviourSettings>>()
            );
        }


        [Theory]
        [InlineData(BookingTransactionState.NEW)]
        [InlineData(BookingTransactionState.PAYMENT_AUTH_REQUIRED)]
        public async Task AmendBooking_WithIdempotencyKey_NewTransactionSucceeds(BookingTransactionState state)
        {
            // Arrange
            var idempotencyKey = "key1";
            var request = new AmendBookingRequest();

            _mockAmendBookingService.Setup(x => x.AmendBooking(It.IsAny<AmendBookingRequest>())).ReturnsAsync(new BookingResponse()).Verifiable();
            _mockTransactionService.Setup(x => x.Create(It.IsAny<string>())).ReturnsAsync(new BookingTransaction { State = state.ToString() }).Verifiable();

            // Act
            await _sut.AmendBooking(request, idempotencyKey);

            // Assert
            _mockAmendBookingService.Verify(x => x.AmendBooking(It.IsAny<AmendBookingRequest>()), Times.Once);
            _mockTransactionService.Verify(x => x.Create(It.IsAny<string>()), Times.Once);
            _mockTransactionService.Verify(x => x.Start(It.IsAny<string>()), Times.Once);
            _mockTransactionService.Verify(x => x.Complete(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task AmendBooking_WithIdempotencyKey_TransactionFails()
        {
            // Arrange
            var idempotencyKey = "key1";
            var request = new AmendBookingRequest();

            _mockAmendBookingService.Setup(x => x.AmendBooking(It.IsAny<AmendBookingRequest>())).ReturnsAsync(new BookingResponse()).Verifiable();
            _mockTransactionService.Setup(x => x.Create(It.IsAny<string>())).ReturnsAsync(new BookingTransaction { State = BookingTransactionState.FAILED.ToString() }).Verifiable();

            // Act
            Func<Task> action = async () => await _sut.AmendBooking(request, idempotencyKey);

            // Assert
            await action.Should().ThrowAsync<ApiException>();
        }

        [Fact]
        public async Task AmendBooking_WithIdempotencyKey_TransactionCompleted()
        {
            // Arrange
            var idempotencyKey = "key1";
            var request = new AmendBookingRequest();

            _mockAmendBookingService.Setup(x => x.AmendBooking(It.IsAny<AmendBookingRequest>())).ReturnsAsync(new BookingResponse()).Verifiable();
            _mockTransactionService.Setup(x => x.Create(It.IsAny<string>())).ReturnsAsync(new BookingTransaction { State = BookingTransactionState.COMPLETED.ToString() }).Verifiable();
            _mockBookingFetchService.Setup(x => x.Get(It.IsAny<GetBookingRequest>())).ReturnsAsync(new BookingResponse()).Verifiable();
            // Act
            await _sut.AmendBooking(request, idempotencyKey);

            // Assert
            _mockBookingFetchService.Verify(x => x.Get(It.IsAny<GetBookingRequest>()), Times.Once);
        }

        [Theory]
        [InlineData("")]
        [InlineData(null)]
        [InlineData(" ")]
        public async Task AmendBooking_WithoutIdempotencyKey_Succeeds(string idempotencyKey)
        {
            // Arrange
            var request = new AmendBookingRequest();

            _mockAmendBookingService.Setup(x => x.AmendBooking(It.IsAny<AmendBookingRequest>())).ReturnsAsync(new BookingResponse()).Verifiable();

            // Act
            await _sut.AmendBooking(request, idempotencyKey);

            // Assert
            _mockAmendBookingService.Verify(x => x.AmendBooking(It.IsAny<AmendBookingRequest>()), Times.Once);
        }

        [Theory]
        [InlineData("")]
        [InlineData(null)]
        [InlineData(" ")]
        public async Task CreateBooking_WithoutIdempotencyKey_Succeeds(string idempotencyKey)
        {
            // Arrange
            var request = new BookingRequest();

            _mockBookingCreateService.Setup(x => x.Create(It.IsAny<BookingRequest>())).ReturnsAsync(new BookingResponse()).Verifiable();

            // Act
            await _sut.CreateBooking(request, idempotencyKey);

            // Assert
            _mockBookingCreateService.Verify(x => x.Create(It.IsAny<BookingRequest>()), Times.Once);
        }

    }
}
