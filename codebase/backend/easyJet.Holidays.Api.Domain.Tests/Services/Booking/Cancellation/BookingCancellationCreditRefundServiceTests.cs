using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Services.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using System.Collections.ObjectModel;
using Voucherify.DataModel;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking.Cancellation
{
    public class BookingCancellationCreditRefundServiceTests
    {
        private readonly BookingCancellationCreditRefundService _sut;

        private readonly Mock<IBookingCancellationRequestService> _bookingCancellationRequestService =
            new Mock<IBookingCancellationRequestService>();

        private readonly Mock<IBookingCancellationCalculateCreditRefundService>
            _bookingCancellationCalculateCreditRefundService =
                new Mock<IBookingCancellationCalculateCreditRefundService>();

        private readonly Mock<IVouchersService> _vouchersService =
            new Mock<IVouchersService>();

        private readonly Mock<Domain.Services.Authentication.IAuthenticationService> _authenticationService = new();

        private readonly Mock<IVouchersCustomerRepository> _vouchersCustomerRepository =
            new Mock<IVouchersCustomerRepository>();

        private readonly Mock<ILogger<BookingCancellationCreditRefundService>>
            _logger = new Mock<ILogger<BookingCancellationCreditRefundService>>();

        public BookingCancellationCreditRefundServiceTests()
        {
            _sut = new BookingCancellationCreditRefundService(_bookingCancellationRequestService.Object,
                _bookingCancellationCalculateCreditRefundService.Object,
                _vouchersService.Object,
                _authenticationService.Object,
                _vouchersCustomerRepository.Object,
                _logger.Object);
        }

        [Fact]
        public async Task RefundCreditAmount_UseMappedCustomerId_CheckVoucherResponse()
        {
            // Arrange
            CancellationToken cancellationToken = new CancellationToken();
            BookingResponse bookingResponse = new BookingResponse()
            {
                Guests =
                [
                    new PersonWithDetails() { FirstName = "FirstName", LastName = "LastName", IsLead = true }
                ],
                LeadPassenger = new LeadPassenger() { Email = "email@email.com", },
                Package = new BookingPackage()
                {
                    Transport = new Transport()
                    {
                        Routes =
                        [
                            new Route() { DepDate = DateTimeOffset.UtcNow.AddDays(100), Direction = Direction.Outbound }
                        ]
                    }
                }
            };

            BookingCancellationRefundBreakdown refundBreakdown =
                new BookingCancellationRefundBreakdown() { OriginalBookingValue = 0, };

            BookingCancellationRequest bookingCancellationRequest = new BookingCancellationRequest
            {
                RefundOption = BookingCancellationRequestRefundOption.OriginalPayment,
                BookingBreakdownValidationHash = refundBreakdown.GetHashCode(),
            };

            _bookingCancellationRequestService.Setup(x => x.IsWebsiteRequest()).ReturnsAsync(true);

            var customerDetails =
                new Domain.Data.Authentication.CustomerDetails
                {
                    Id = "customer-id", FirstName = "Test", LastName = "Tester", Email = "tester@reply.de"
                };

            _authenticationService.Setup(x => x.CustomerDetails()).ReturnsAsync(customerDetails);
            _authenticationService.Setup(x => x.MappedCustomerId(It.IsAny<Domain.Data.Authentication.CustomerDetails>()))
                .ReturnsAsync(customerDetails.Id);

            var voucherResponse = new BookingRefundExtendedResponse()
            {
                Credits = 100m, Cash = 0m, Credit = new MyCreditInfo()
            };

            _vouchersService.Setup(x => x.RefundCreditsAndUpdateBooking(It.IsAny<BookingResponse>(),
                It.IsAny<BookingCancellationCreditRefundBreakdown>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<bool>())).ReturnsAsync(voucherResponse);

            // Act
            var result = await _sut.RefundCreditAmount(bookingCancellationRequest, bookingResponse, refundBreakdown,
                cancellationToken);

            // Assert
            result.Should().NotBeNull();
            result?.Credits.Should().Be(voucherResponse.Credits);
        }

        [Fact]
        public async Task RefundCreditAmount_NoMappedCustomerId_ThrowException()
        {
            // Arrange
            CancellationToken cancellationToken = new CancellationToken();
            BookingResponse bookingResponse = new BookingResponse()
            {
                Guests =
                [
                    new PersonWithDetails() { FirstName = "FirstName", LastName = "LastName", IsLead = true }
                ],
                LeadPassenger = new LeadPassenger() { Email = "email@email.com", },
                Package = new BookingPackage()
                {
                    Transport = new Transport()
                    {
                        Routes =
                        [
                            new Route() { DepDate = DateTimeOffset.UtcNow.AddDays(100), Direction = Direction.Outbound }
                        ]
                    }
                }
            };

            BookingCancellationRefundBreakdown refundBreakdown =
                new BookingCancellationRefundBreakdown() { OriginalBookingValue = 0, };

            BookingCancellationRequest bookingCancellationRequest = new BookingCancellationRequest
            {
                RefundOption = BookingCancellationRequestRefundOption.OriginalPayment,
                BookingBreakdownValidationHash = refundBreakdown.GetHashCode(),
            };

            _bookingCancellationRequestService.Setup(x => x.IsWebsiteRequest()).ReturnsAsync(true);

            var customerDetails =
                new Domain.Data.Authentication.CustomerDetails
                {
                    Id = "customer-id", FirstName = "Test", LastName = "Tester", Email = "tester@reply.de"
                };

            _authenticationService.Setup(x => x.CustomerDetails()).ReturnsAsync(customerDetails);
            _authenticationService.Setup(x => x.MappedCustomerId(It.IsAny<Domain.Data.Authentication.CustomerDetails>()))
                .ReturnsAsync(String.Empty);

            // Act
            Func<Task> act = () =>
                _sut.RefundCreditAmount(bookingCancellationRequest, bookingResponse, refundBreakdown,
                    cancellationToken);

            // Assert
            await act.Should().ThrowExactlyAsync<ApiException>()
                .Where(e => e.Code.Code == ApiExceptionCodes.CustomerNoMappedId.Code);
        }

        [Fact]
        public async Task RefundCreditAmount_GetOrCreateNewVoucherAccount_CheckVoucherResponse()
        {
            // Arrange
            CancellationToken cancellationToken = new CancellationToken();
            BookingResponse bookingResponse = new BookingResponse()
            {
                Guests =
                [
                    new PersonWithDetails() { FirstName = "FirstName", LastName = "LastName", IsLead = true }
                ],
                LeadPassenger = new LeadPassenger() { Email = "email@email.com", },
                Package = new BookingPackage()
                {
                    Transport = new Transport()
                    {
                        Routes =
                        [
                            new Route() { DepDate = DateTimeOffset.UtcNow.AddDays(100), Direction = Direction.Outbound }
                        ]
                    }
                }
            };

            BookingCancellationRefundBreakdown refundBreakdown =
                new BookingCancellationRefundBreakdown() { OriginalBookingValue = 0, };

            BookingCancellationRequest bookingCancellationRequest = new BookingCancellationRequest
            {
                RefundOption = BookingCancellationRequestRefundOption.OriginalPayment,
                BookingBreakdownValidationHash = refundBreakdown.GetHashCode(),
            };

            _bookingCancellationRequestService.Setup(x => x.IsWebsiteRequest()).ReturnsAsync(false);

            var customerDetails =
                new Domain.Data.Authentication.CustomerDetails
                {
                    Id = "customer-id", FirstName = "Test", LastName = "Tester", Email = "tester@reply.de"
                };

            _authenticationService.Setup(x => x.CustomerDetails()).ReturnsAsync(customerDetails);
            _authenticationService.Setup(x => x.MappedCustomerId(It.IsAny<Domain.Data.Authentication.CustomerDetails>()))
                .ReturnsAsync(customerDetails.Id);

            var voucherResponse = new BookingRefundExtendedResponse()
            {
                Credits = 100m, Cash = 0m, Credit = new MyCreditInfo()
            };

            _vouchersService.Setup(x => x.RefundCreditsAndUpdateBooking(It.IsAny<BookingResponse>(),
                It.IsAny<BookingCancellationCreditRefundBreakdown>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<bool>())).ReturnsAsync(voucherResponse);

            var customer = new Customer() { SourceId = "test-source-id", };

            _vouchersCustomerRepository
                .Setup(x => x.GetOrCreate(It.IsAny<string>(), It.IsAny<Domain.Data.Authentication.CustomerDetails>()))
                .ReturnsAsync(customer);

            // Act
            var result = await _sut.RefundCreditAmount(bookingCancellationRequest, bookingResponse, refundBreakdown,
                cancellationToken);

            // Assert
            result.Should().NotBeNull();
            result?.Credits.Should().Be(voucherResponse.Credits);
        }

        [Fact]
        public async Task RefundCreditAmount_ThrowException_IfCustomerIdIsNullOrEmpty()
        {
            // Arrange
            CancellationToken cancellationToken = new CancellationToken();
            BookingResponse bookingResponse = new BookingResponse()
            {
                Guests =
                [
                    new PersonWithDetails() { FirstName = "FirstName", LastName = "LastName", IsLead = true }
                ],
                LeadPassenger = new LeadPassenger() { Email = "email@email.com", },
                Package = new BookingPackage()
                {
                    Transport = new Transport()
                    {
                        Routes =
                        [
                            new Route() { DepDate = DateTimeOffset.UtcNow.AddDays(100), Direction = Direction.Outbound }
                        ]
                    }
                }
            };

            BookingCancellationRefundBreakdown refundBreakdown =
                new BookingCancellationRefundBreakdown() { OriginalBookingValue = 0 };

            BookingCancellationRequest bookingCancellationRequest = new BookingCancellationRequest
            {
                RefundOption = BookingCancellationRequestRefundOption.OriginalPayment,
                BookingBreakdownValidationHash = refundBreakdown.GetHashCode(),
            };

            _bookingCancellationRequestService.Setup(x => x.IsWebsiteRequest()).ReturnsAsync(false);

            var customerDetails =
                new Domain.Data.Authentication.CustomerDetails
                {
                    Id = "customer-id", FirstName = "Test", LastName = "Tester", Email = "tester@reply.de"
                };

            _authenticationService.Setup(x => x.CustomerDetails()).ReturnsAsync(customerDetails);
            _authenticationService.Setup(x => x.MappedCustomerId(It.IsAny<Domain.Data.Authentication.CustomerDetails>()))
                .ReturnsAsync(customerDetails.Id);

            var voucherResponse = new BookingRefundExtendedResponse()
            {
                Credits = 100m, Cash = 0m, Credit = new MyCreditInfo()
            };

            _vouchersService.Setup(x => x.RefundCreditsAndUpdateBooking(It.IsAny<BookingResponse>(),
                It.IsAny<BookingCancellationCreditRefundBreakdown>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<bool>())).ReturnsAsync(voucherResponse);

            var customer = new Customer() { SourceId = "", };

            _vouchersCustomerRepository
                .Setup(x => x.GetOrCreate(It.IsAny<string>(), It.IsAny<Domain.Data.Authentication.CustomerDetails>()))
                .ReturnsAsync(customer);

            // Act
            Func<Task> act = () =>
                _sut.RefundCreditAmount(bookingCancellationRequest, bookingResponse, refundBreakdown,
                    cancellationToken);

            // Assert
            await act.Should().ThrowExactlyAsync<ApiException>()
                .Where(e => e.Code.Code == ApiExceptionCodes.CustomerNoMappedId.Code);
        }

        [Fact]
        public async Task RollbackCreditRefund_UsedBookingRefundExtendedResponse_ReturnTrue()
        {
            // Arrange
            var vouchers = new ReadOnlyCollection<CreatedVoucher>(new List<CreatedVoucher>()
            {
                new CreatedVoucher()
                {
                    Code = "Code1", 
                    Reason = "TestReason"
                }
            });
            var bookingResponse = new BookingResponse();
            _vouchersService.Setup(i => i.RollbackVouchers(It.IsAny<BookingResponse>(), It.IsAny<IReadOnlyCollection<CreatedVoucher>>())).ReturnsAsync(true);

            // Act
            var result = await _sut.RollbackCreditRefund(bookingResponse, vouchers);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public async Task RollbackCreditRefund_BookingRefundExtendedResponseHasNoCreatedVouchers_ReturnTrue()
        {
            // Arrange
            var vouchers = new ReadOnlyCollection<CreatedVoucher>(new List<CreatedVoucher>());
            var bookingResponse = new BookingResponse();
            _vouchersService.Setup(i => i.RollbackVouchers(It.IsAny<BookingResponse>(), It.IsAny<IReadOnlyCollection<CreatedVoucher>>())).ReturnsAsync(false);

            // Act
            var result = await _sut.RollbackCreditRefund(bookingResponse, vouchers);

            // Assert
            result.Should().BeTrue();
        }
    }
}