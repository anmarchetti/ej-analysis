using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.Payment;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Exceptions;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Interfaces.Payment;
using easyJet.Holidays.Api.Domain.Services.Booking;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Settings;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking
{
    public class BookingPaymentServiceTests
    {
        private readonly Mock<IPaymentsService> _paymentsServiceMock;
        private readonly Mock<IVoucherPaymentFlowService> _voucherPaymentServiceMock;
        private readonly Mock<IBookingPaymentsRepository> _bookingPaymentsRepositoryMock;
        private readonly Mock<ILogger<BookingPaymentService>> _loggerMock;
        private readonly Mock<IMarketService> _marketServiceMock;
        private readonly BookingPaymentService _bookingPaymentService;

        public BookingPaymentServiceTests()
        {
            _paymentsServiceMock = new Mock<IPaymentsService>();
            _voucherPaymentServiceMock = new Mock<IVoucherPaymentFlowService>();
            _bookingPaymentsRepositoryMock = new Mock<IBookingPaymentsRepository>();
            _loggerMock = new Mock<ILogger<BookingPaymentService>>();
            _marketServiceMock = new Mock<IMarketService>();

            var apiSettings = Options.Create(new ApiSettings { Vouchers = new VoucherSettings { IsActive = true } });

            _bookingPaymentService = new BookingPaymentService(
                _paymentsServiceMock.Object,
                _voucherPaymentServiceMock.Object,
                _bookingPaymentsRepositoryMock.Object,
                _loggerMock.Object,
                apiSettings,
                _marketServiceMock.Object);
        }

        [Fact]
        public async Task ProcessPayment_Should_Process_Card_And_Voucher_Payments_Successfully()
        {
            // Arrange
            var bookingRequest = new BookingRequest
            {
                PaymentInfo = new CardPaymentInfo { Amount = 100, CreditAmount = 50, Currency = "GBP" },
                BookingReference = "BR123",
                LeadPassenger = new LeadPassenger { Email = "test@example.com" }
            };

            var validateResponse = new ValidateBookingResponse
            {
                PaymentInfo = new PriceInfo { Currency = "GBP" },
                Accom = new BookingAccommodation { Code = "AC123" },
                MarketCode = "UK"
            };

            var bookingResponse = new BookingResponse { MarketCode = "UK", Language = "en" };

            var paymentResponse = new MakePaymentResponse
            {
                BookingReference = "BR123",
                PaymentId = "P123",
                SessionId = "S123",
                RequestId = "R123"
            };

            _paymentsServiceMock.Setup(x => x.MakePayment(It.IsAny<BookingAccommodation>(), It.IsAny<PriceInfo>(),
                    It.IsAny<BookingRequest>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<MarketSettings>()))
                .ReturnsAsync(paymentResponse);

            _voucherPaymentServiceMock.Setup(x => x.Redeem(It.IsAny<decimal>(), It.IsAny<string>(), It.IsAny<string>(),
                    It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<RedemptionMetadata>()))
                .ReturnsAsync([new CreditSpend()]);

            Task<BookingResponse> CommitBooking() => Task.FromResult(bookingResponse);

            // Act
            var result =
                await _bookingPaymentService.ProcessPayment(bookingRequest, validateResponse,
                    CommitBooking);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEquivalentTo(bookingResponse);

            _paymentsServiceMock.Verify(
                x => x.MakePayment(It.IsAny<BookingAccommodation>(), It.IsAny<PriceInfo>(), It.IsAny<BookingRequest>(),
                    It.IsAny<string>(), It.IsAny<string>(), It.IsAny<MarketSettings>()), Times.Once);
            _voucherPaymentServiceMock.Verify(
                x => x.Redeem(It.IsAny<decimal>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                    It.IsAny<string>(), It.IsAny<string>(), It.IsAny<RedemptionMetadata>()), Times.Once);
        }

        [Fact]
        public async Task ProcessPayment_Should_Process_Only_Card_Payment()
        {
            // Arrange
            var bookingRequest = new BookingRequest
            {
                PaymentInfo = new CardPaymentInfo { Amount = 100, CreditAmount = 0, Currency = "GBP" },
                BookingReference = "BR123",
                LeadPassenger = new LeadPassenger { Email = "test@example.com" }
            };

            var validateResponse = new ValidateBookingResponse
            {
                PaymentInfo = new PriceInfo { Currency = "GBP" },
                Accom = new BookingAccommodation() { Code = "AC123" },
                MarketCode = "UK"
            };

            var bookingResponse = new BookingResponse { MarketCode = "UK", Language = "en" };

            var paymentResponse = new MakePaymentResponse
            {
                BookingReference = "BR123",
                PaymentId = "P123",
                SessionId = "S123",
                RequestId = "R123"
            };

            _paymentsServiceMock.Setup(x => x.MakePayment(It.IsAny<BookingAccommodation>(), It.IsAny<PriceInfo>(),
                    It.IsAny<BookingRequest>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<MarketSettings>()))
                .ReturnsAsync(paymentResponse);

            Task<BookingResponse> CommitBooking() => Task.FromResult(bookingResponse);

            // Act
            var result =
                await _bookingPaymentService.ProcessPayment(bookingRequest, validateResponse,
                    CommitBooking);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEquivalentTo(bookingResponse);

            _paymentsServiceMock.Verify(
                x => x.MakePayment(It.IsAny<BookingAccommodation>(), It.IsAny<PriceInfo>(), It.IsAny<BookingRequest>(),
                    It.IsAny<string>(), It.IsAny<string>(), It.IsAny<MarketSettings>()), Times.Once);
            _voucherPaymentServiceMock.Verify(
                x => x.Redeem(It.IsAny<decimal>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                    It.IsAny<string>(), It.IsAny<string>(), It.IsAny<RedemptionMetadata>()), Times.Never);
        }

        [Fact]
        public async Task ProcessPayment_Should_Process_Only_Card_Payment_Error_With_Payment_Result_Code()
        {
            // Arrange
            var bookingRequest = new BookingRequest
            {
                PaymentInfo = new CardPaymentInfo { Amount = 100, CreditAmount = 0, Currency = "GBP" },
                BookingReference = "BR123",
                LeadPassenger = new LeadPassenger { Email = "test@example.com" }
            };

            var validateResponse = new ValidateBookingResponse
            {
                PaymentInfo = new PriceInfo { Currency = "GBP" },
                Accom = new BookingAccommodation() { Code = "AC123" },
                MarketCode = "UK"
            };

            var bookingResponse = new BookingResponse { MarketCode = "UK", Language = "en" };

            var paymentResponse = new MakePaymentResponse
            {
                BookingReference = "BR123",
                PaymentId = "P123",
                SessionId = "S123",
                RequestId = "R123",
                ResultCode = PaymentResultCode.IDENTIFY
            };

            _paymentsServiceMock.Setup(x => x.MakePayment(It.IsAny<BookingAccommodation>(), It.IsAny<PriceInfo>(),
                    It.IsAny<BookingRequest>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<MarketSettings>()))
                .ReturnsAsync(paymentResponse);

            Task<BookingResponse> CommitBooking() => Task.FromResult(bookingResponse);

            // Act
            Func<Task> action = async () =>
                await _bookingPaymentService.ProcessPayment(bookingRequest, validateResponse,
                    CommitBooking);

            // Assert
            await action.Should().ThrowAsync<PaymentAuthorisationRequiredException>();
        }

        [Fact]
        public async Task ProcessPayment_Should_Process_Only_Voucher_Payment()
        {
            // Arrange
            var bookingRequest = new BookingRequest
            {
                PaymentInfo = new CardPaymentInfo { Amount = 0, CreditAmount = 50, Currency = "GBP" },
                BookingReference = "BR123",
                LeadPassenger = new LeadPassenger { Email = "test@example.com" }
            };

            var validateResponse = new ValidateBookingResponse
            {
                PaymentInfo = new PriceInfo { Currency = "GBP" },
                Accom = new BookingAccommodation { Code = "AC123" },
                MarketCode = "UK"
            };

            var bookingResponse = new BookingResponse { MarketCode = "UK", Language = "en" };

            _voucherPaymentServiceMock.Setup(x => x.Redeem(It.IsAny<decimal>(), It.IsAny<string>(), It.IsAny<string>(),
                    It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<RedemptionMetadata>()))
                .ReturnsAsync([new CreditSpend()]);

            Task<BookingResponse> CommitBooking() => Task.FromResult(bookingResponse);

            // Act
            var result =
                await _bookingPaymentService.ProcessPayment(bookingRequest, validateResponse,
                    CommitBooking);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEquivalentTo(bookingResponse);

            _paymentsServiceMock.Verify(
                x => x.MakePayment(It.IsAny<BookingAccommodation>(), It.IsAny<PriceInfo>(), It.IsAny<BookingRequest>(),
                    It.IsAny<string>(), It.IsAny<string>(), It.IsAny<MarketSettings>()), Times.Never);
            _voucherPaymentServiceMock.Verify(
                x => x.Redeem(It.IsAny<decimal>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                    It.IsAny<string>(), It.IsAny<string>(), It.IsAny<RedemptionMetadata>()), Times.Once);
        }

        [Fact]
        public async Task ProcessPayment_Should_Throw_Exception_When_Payment_Authorisation_Required()
        {
            // Arrange
            var bookingRequest = new BookingRequest
            {
                PaymentInfo = new CardPaymentInfo { Amount = 100 },
                BookingReference = "BR123",
                LeadPassenger = new LeadPassenger { Email = "test@example.com" }
            };

            var validateResponse = new ValidateBookingResponse { MarketCode = "UK" };

            _paymentsServiceMock.Setup(x => x.MakePayment(It.IsAny<BookingAccommodation>(), It.IsAny<PriceInfo>(),
                    It.IsAny<BookingRequest>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<MarketSettings>()))
                .ThrowsAsync(new PaymentAuthorisationRequiredException(new MakePaymentResponse()));

            Func<Task<BookingResponse>> commitBooking = () => Task.FromResult(new BookingResponse());

            // Act
            Func<Task> action = async () =>
                await _bookingPaymentService.ProcessPayment(bookingRequest, validateResponse,
                    commitBooking);

            // Assert
            await action.Should().ThrowAsync<PaymentAuthorisationRequiredException>();
        }

        [Fact]
        public async Task ProcessPayment_Should_Rollback_Voucher_When_PaymentGatewayException_Occurs()
        {
            // Arrange
            var bookingRequest = new BookingRequest
            {
                PaymentInfo = new CardPaymentInfo { Amount = 50, Currency = "GBP" },
                BookingReference = "BR123",
                LeadPassenger = new LeadPassenger { Email = "test@example.com" }
            };

            var validateResponse =
                new ValidateBookingResponse { PaymentInfo = new PriceInfo { Currency = "GBP" }, MarketCode = "UK" };

            _paymentsServiceMock.Setup(x => x.MakePayment(It.IsAny<BookingAccommodation>(), It.IsAny<PriceInfo>(),
                    It.IsAny<BookingRequest>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<MarketSettings>()))
                .ThrowsAsync(new PaymentGatewayException("Payment gateway exception", "Booking reference", "Session id",
                    null, null));

            _voucherPaymentServiceMock.Setup(x => x.Rollback(It.IsAny<List<CreditSpend>>(), It.IsAny<string>()))
                .ReturnsAsync(new ApiException(ApiExceptionCodes.CreditsFailedToRollBackRedemption, new[] { new ApiError { Code = ApiExceptionCodes.CreditsFailedToRollBackRedemption.Code } }, String.Empty));

            Func<Task<BookingResponse>> commitBooking = () => Task.FromResult(new BookingResponse());

            // Act
            Func<Task> action = async () =>
                await _bookingPaymentService.ProcessPayment(bookingRequest, validateResponse,
                    commitBooking);

            // Assert
            await action.Should().ThrowAsync<ApiException>()
                .WithMessage("Failed to create a booking")
                .Where(x => x.InnerErrors.Any(e => e.Code == ApiExceptionCodes.CreditsFailedToRollBackRedemption.Code));

            _voucherPaymentServiceMock.Verify(x => x.Rollback(It.IsAny<List<CreditSpend>>(), It.IsAny<string>()),
                Times.Once);
        }

        [Fact]
        public async Task ProcessPayment_Should_Not_Process_Voucher_When_Vouchers_Are_Inactive()
        {
            // Arrange
            var bookingRequest = new BookingRequest
            {
                PaymentInfo = new CardPaymentInfo { CreditAmount = 50 },
                BookingReference = "BR123",
                LeadPassenger = new LeadPassenger { Email = "test@example.com" }
            };

            var validateResponse = new ValidateBookingResponse { MarketCode = "UK" };

            var apiSettings = Options.Create(new ApiSettings { Vouchers = new VoucherSettings { IsActive = false } });
            var bookingPaymentService = new BookingPaymentService(
                _paymentsServiceMock.Object,
                _voucherPaymentServiceMock.Object,
                _bookingPaymentsRepositoryMock.Object,
                _loggerMock.Object,
                apiSettings,
                _marketServiceMock.Object);

            Task<BookingResponse> CommitBooking() => Task.FromResult(new BookingResponse());

            // Act
            var result = await bookingPaymentService.ProcessPayment(bookingRequest,
                validateResponse, CommitBooking);

            // Assert
            result.Should().NotBeNull();
            _voucherPaymentServiceMock.Verify(
                x => x.Redeem(It.IsAny<decimal>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                    It.IsAny<string>(), It.IsAny<string>(), It.IsAny<RedemptionMetadata>()), Times.Never);
        }

        [Fact]
        public async Task ProcessPayment_Should_Handle_BookingCommitException_With_RollbackRedemptionException()
        {
            // Arrange
            var bookingRequest = new BookingRequest
            {
                BookingReference = "BR123",
                PaymentInfo = new CardPaymentInfo { CreditAmount = 50 },
                LeadPassenger = new LeadPassenger { Email = "test@example.com" }
            };
            var bookingResponse = new BookingResponse();
            var validateResponse = new ValidateBookingResponse
            {
                PaymentInfo = new PriceInfo(),
                Accom = new BookingAccommodation(),
                MarketCode = "UK"
            };
            var commitBooking = new Func<Task<BookingResponse>>(() => throw new CommitBookingException(
                "Error message",
                "Booking_ref",
                [],
                "Session_id",
                "Request_id",
                null));

            _voucherPaymentServiceMock.Setup(x => x.Rollback(It.IsAny<List<CreditSpend>>(), It.IsAny<string>()))
                .ThrowsAsync(new ApiException(ApiExceptionCodes.BookingPaymentError, "Rollback failed"));

            // Act
            Func<Task> act = async () => await _bookingPaymentService.ProcessPayment(bookingRequest, validateResponse, commitBooking);

            // Assert
            await act.Should().ThrowAsync<ApiException>().WithMessage("Failed to commit booking");
        }

        [Fact]
        public async Task ProcessPayment_Should_Handle_BookingCommitException_With_TransferUnavailableError()
        {
            // Arrange
            var bookingRequest = new BookingRequest
            {
                BookingReference = "BR123",
                PaymentInfo = new CardPaymentInfo { CreditAmount = 50 },
                LeadPassenger = new LeadPassenger { Email = "test@example.com" }
            };
            var bookingResponse = new BookingResponse();
            var validateResponse = new ValidateBookingResponse
            {
                PaymentInfo = new PriceInfo(),
                Accom = new BookingAccommodation(),
                MarketCode = "UK"
            };
            var commitBooking = new Func<Task<BookingResponse>>(() => throw new ApiException(ApiExceptionCodes.BookingTransfersUnavailalbe, "Transfer unavailable"));

            // Act
            Func<Task> act = async () => await _bookingPaymentService.ProcessPayment(bookingRequest, validateResponse, commitBooking);

            // Assert
            await act.Should().ThrowAsync<ApiException>()
                .WithMessage("Failed to commit booking")
                .Where(x => x.Code.Code == ApiExceptionCodes.BookingTransfersUnavailalbe.Code);
        }

        [Fact]
        public async Task ProcessPayment_Should_Handle_BookingCommitException_With_ValidatePriceError()
        {
            // Arrange
            var bookingRequest = new BookingRequest
            {
                BookingReference = "BR123",
                PaymentInfo = new CardPaymentInfo { CreditAmount = 50 },
                LeadPassenger = new LeadPassenger { Email = "test@example.com" }
            };
            var bookingResponse = new BookingResponse();
            var validateResponse = new ValidateBookingResponse
            {
                PaymentInfo = new PriceInfo(),
                Accom = new BookingAccommodation(),
                MarketCode = "UK"
            };
            var commitBooking = new Func<Task<BookingResponse>>(() => throw new ApiException(ApiExceptionCodes.BookingValidatePriceError, "Validate price error"));

            // Act
            Func<Task> act = async () => await _bookingPaymentService.ProcessPayment(bookingRequest, validateResponse, commitBooking);

            // Assert
            await act.Should().ThrowAsync<ApiException>()
                .WithMessage("Failed to commit booking")
                .Where(x => x.Code.Code == ApiExceptionCodes.BookingValidatePriceError.Code);
        }

        [Fact]
        public async Task ProcessPayment_Should_Handle_BookingCommitException_With_SearchPackagesError()
        {
            // Arrange
            var bookingRequest = new BookingRequest
            {
                BookingReference = "BR123",
                PaymentInfo = new CardPaymentInfo { CreditAmount = 50 },
                LeadPassenger = new LeadPassenger { Email = "test@example.com" }
            };
            var bookingResponse = new BookingResponse();
            var validateResponse = new ValidateBookingResponse
            {
                PaymentInfo = new PriceInfo(),
                Accom = new BookingAccommodation(),
                MarketCode = "UK"
            };
            var commitBooking = new Func<Task<BookingResponse>>(() => throw new ApiException(ApiExceptionCodes.SearchPackagesError, "Search packages error"));

            // Act
            Func<Task> act = async () => await _bookingPaymentService.ProcessPayment(bookingRequest, validateResponse, commitBooking);

            // Assert
            await act.Should().ThrowAsync<ApiException>()
                .WithMessage("Failed to commit booking")
                .Where(x => x.Code.Code == ApiExceptionCodes.SearchPackagesError.Code);
        }

        [Fact]
        public async Task ProcessPayment_Should_Handle_BookingCommitException_With_BookingCommitError_And_Without_Rollback_Issue()
        {
            // Arrange
            var bookingRequest = new BookingRequest
            {
                BookingReference = "BR123",
                PaymentInfo = new CardPaymentInfo { CreditAmount = 50 },
                LeadPassenger = new LeadPassenger { Email = "test@example.com" }
            };
            var bookingResponse = new BookingResponse();
            var validateResponse = new ValidateBookingResponse
            {
                PaymentInfo = new PriceInfo(),
                Accom = new BookingAccommodation(),
                MarketCode = "UK"
            };
            var commitBooking = new Func<Task<BookingResponse>>(() => throw new ApiException(ApiExceptionCodes.BookingCommitError, "Booking commit error"));

            // Act
            Func<Task> act = async () => await _bookingPaymentService.ProcessPayment(bookingRequest, validateResponse, commitBooking);

            // Assert
            await act.Should().ThrowAsync<ApiException>()
                .WithMessage("Failed to commit booking")
                .Where(x => x.Code.Code == ApiExceptionCodes.BookingCommitError.Code);
        }

        [Fact]
        public async Task ProcessPayment_Should_Handle_BookingCommitException_With_BookingCommitError_And_With_Rollback_Issue()
        {
            // Arrange
            var bookingRequest = new BookingRequest
            {
                BookingReference = "BR123",
                PaymentInfo = new CardPaymentInfo { CreditAmount = 50 },
                LeadPassenger = new LeadPassenger { Email = "test@example.com" }
            };
            var bookingResponse = new BookingResponse();
            var validateResponse = new ValidateBookingResponse
            {
                PaymentInfo = new PriceInfo(),
                Accom = new BookingAccommodation(),
                MarketCode = "UK"
            };
            var commitBooking = new Func<Task<BookingResponse>>(() => throw new ApiException(ApiExceptionCodes.BookingCommitError, "Booking commit error"));

            _paymentsServiceMock.Setup(x => x.CancelPayment(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                .ThrowsAsync(new PaymentCancellationException(String.Empty, String.Empty, new[] { new ApiError() }, null));

            // Act
            Func<Task> act = async () => await _bookingPaymentService.ProcessPayment(bookingRequest, validateResponse, commitBooking);

            // Assert
            await act.Should().ThrowAsync<ApiException>()
                .WithMessage("Failed to commit booking")
                .Where(x => x.Code.Code == ApiExceptionCodes.BookingCommitError.Code);
        }

    }
}