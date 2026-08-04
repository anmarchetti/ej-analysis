using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.BulkToolBooking;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Tests.Services.Booking;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Moq;
using System.Reflection;
using Voucherify.DataModel;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.BulkTool.BulkToolBookingService
{
    public class RefundCommandTests : BulkToolBookingServiceTests
    {
        [Theory]
        [InlineData("100001", 100)]
        public async Task Refund_BookinNotCancelledAndPaymentsDataIsValid_ShouldRefundBooking(string reference, int amount)
        {
            // Arrange 
            const string successfullyRefundedMessage = "Successfully refunded";

            var request = new BulkToolRequest()
            {
                Booking = new()
                {
                    Flag = _commandsSettings.RefundCommand,
                    Reference = reference
                }
            };

            _messagesSettings.Object.Value.SuccessfullyRefunded = successfullyRefundedMessage;

            var priceInfo = new PriceInfo { PaymentHistory =
                [
                    new PaymentHistoryItem()
                    {
                        Amount = amount,
                    }
                ]
            };

            var booking = new BookingResponse()
            {
                BookingStatus = _statusesSettings.Value.Canceled,
                BookingReference = reference,
                PaymentInfo = priceInfo,
                Currency = Currency.GBP
            };

            _bookingRepository.Setup(x => x.GetBookingUnsafe(reference, It.IsAny<GetBookingOptions>())).ReturnsAsync(booking);

            _bookingRepository.Setup(x => x.GetBookingMemo(reference)).ReturnsAsync([]);
            _bookingPaymentsService.Setup(x => x.RefundNonCreditPayments(booking)).ReturnsAsync(() =>
            {
                booking.PaymentInfo.PaymentHistory.ToList().ForEach(x =>
                {
                    x.Amount = 0;
                });

                return [];
            });

            // Actual
            var act = await bulkToolBookingService.RunBulkProcess(request, Guid.NewGuid().ToString());

            // Assert
            act.CorrelationId.Should().BeNull();
            act.Reference.Should().Be(booking.BookingReference);
            act.Message.Should().Be(successfullyRefundedMessage);
            booking.PaymentInfo.PaymentHistory.ElementAt(0).Amount.Should().Be(0);
            _bookingRepository.Verify(x => x.GetBookingUnsafe(reference, It.Is<GetBookingOptions>(o => o.AllowNoAccomm)));
            _bookingPaymentsService.Verify(x => x.RefundNonCreditPayments(booking));
        }

        [Theory]
        [InlineData("100001", "GBP")]
        [InlineData("100001", "CHF")]
        [InlineData("100001", "EUR")]
        public async Task Refund_PaidWithCredit_NewRefundCreditCreated(string reference, string currencyCode)
        {
            // Arrange             
            _messagesSettings.Object.Value.SuccessfullyRefunded = "Successfully refunded";

            var priceInfo = new PriceInfo();
            priceInfo.PaymentHistory =
            [
                new PaymentHistoryItem()
                    {
                        Amount = 10,
                    },
                    new PaymentHistoryItem()
                    {
                        Amount = 20,
                        IsCredit = true
                    },
                    new PaymentHistoryItem()
                    {
                        Amount = 30,
                        IsCredit = true
                    }
            ];

            var booking = new BookingResponse()
            {
                BookingStatus = _statusesSettings.Value.Canceled,
                BookingReference = reference,
                PaymentInfo = priceInfo,
                CustomerDetails = new CustomerDetails
                {
                    Email = "test@email.com"
                },
                Currency = new Currency { Code = currencyCode }
            };

            _bookingRepository.Setup(x => x.GetBookingUnsafe(reference, It.IsAny<GetBookingOptions>())).ReturnsAsync(booking);
            _bookingRepository.Setup(x => x.GetBookingMemo(reference)).ReturnsAsync([]);
            _bookingPaymentsService.Setup(x => x.RefundNonCreditPayments(booking)).ReturnsAsync(() => []);

            var ctor = typeof(CustomerList).GetConstructors(BindingFlags.Instance | BindingFlags.NonPublic)[0];
            var customersList = (CustomerList)ctor.Invoke([]);
            customersList.SetPrivateProperty("Customers", new List<Customer>() { new Customer() });

            _customersRepository.Setup(x => x.GetCustomersByEmail(It.IsAny<string>(), It.IsAny<int>())).ReturnsAsync(customersList);
            _vouchersService
                .Setup(x => x.AddRefundCreditToBooking(
                    It.IsAny<string>(),
                    It.IsAny<decimal>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<BookingResponse>(),
                    It.IsAny<Dictionary<string, object>>()))
                .ReturnsAsync(["bulk-tool-001"]);

            var request = new BulkToolRequest()
            {
                Booking = new ()
                {
                    Flag = _commandsSettings.RefundCommand,
                    Reference = reference
                }
            };
            // Act
            var result = await bulkToolBookingService.RunBulkProcess(request, Guid.NewGuid().ToString());

            // Assert
            result.Note.Should().Be("Credit refunded: bulk-tool-001, amount: 50");
            _vouchersService
                .Verify(x => x.AddRefundCreditToBooking(
                    It.IsAny<string>(),
                    It.Is<decimal>(p => p == 50),
                    It.Is<string>(currency => currency == currencyCode),
                    It.IsAny<string>(),
                    It.IsAny<BookingResponse>(),
                    It.Is<Dictionary<string, object>>(m => m["booking_ref"].ToString() == "100001")), Times.Once);
        }

        [Theory]
        [InlineData("100001")]
        public async Task Refund_CreditsSumZero_NoNewCredit(string reference)
        {
            // Arrange             
            _messagesSettings.Object.Value.SuccessfullyRefunded = "Successfully refunded";

            var priceInfo = new PriceInfo();
            priceInfo.PaymentHistory =
            [
                new PaymentHistoryItem()
                {
                    Amount = 25,
                    IsCredit = true
                },
                new PaymentHistoryItem()
                {
                    Amount = -5,
                    IsCredit = true
                },
                new PaymentHistoryItem()
                {
                    Amount = -5,
                    IsCredit = true
                },
                new PaymentHistoryItem()
                {
                    Amount = -15,
                    IsCredit = true
                }
            ];

            var booking = new BookingResponse()
            {
                BookingStatus = _statusesSettings.Value.Canceled,
                BookingReference = reference,
                PaymentInfo = priceInfo,
                CustomerDetails = new CustomerDetails
                {
                    Email = "test@email.com"
                },
                Currency = Currency.GBP
            };

            var ctor = typeof(CustomerList).GetConstructors(BindingFlags.Instance | BindingFlags.NonPublic)[0];
            var customersList = (CustomerList)ctor.Invoke([]);
            customersList.SetPrivateProperty("Customers", new List<Customer>() { new Customer() });

            _customersRepository.Setup(x => x.GetCustomersByEmail(It.IsAny<string>(), It.IsAny<int>())).ReturnsAsync(customersList);

            _bookingRepository.Setup(x => x.GetBookingUnsafe(reference, It.IsAny<GetBookingOptions>())).ReturnsAsync(booking);
            _bookingRepository.Setup(x => x.GetBookingMemo(reference)).ReturnsAsync([]);

            var request = new BulkToolRequest()
            {
                Booking = new()
                {
                    Flag = _commandsSettings.RefundCommand,
                    Reference = reference
                }
            };
            // Act
            var result = await bulkToolBookingService.RunBulkProcess(request, Guid.NewGuid().ToString());

            // Assert
            result.Note.Should().NotBeNull(); // no refund & credit refund
            result.Note.Should().Contain("No payments to refund for booking");
            _vouchersService
                .Verify(x => x.AddRefundCreditToBooking(
                    It.IsAny<string>(),
                    It.IsAny<decimal>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<BookingResponse>(),
                    It.IsAny<Dictionary<string, object>>()),
                    Times.Never);
        }

        [Theory]
        [InlineData("100001", 356)]
        public async Task Refund_BookingNotCancelledAndPaymentsDataIsInvalid_ShouldNotRefundBooking(string reference, int amount)
        {
            // Arrange 
            var failedToRefundMessage = "Failed to refund";
            _messagesSettings.Object.Value.FailedToRefund = failedToRefundMessage;

            var request = new BulkToolRequest()
            {
                Booking = new()
                {
                    Flag = _commandsSettings.RefundCommand,
                    Reference = reference
                }
            };

            var priceInfo = new PriceInfo();
            priceInfo.PaymentHistory =
            [
                new PaymentHistoryItem()
                    {
                        Amount = amount
                    }
            ];

            var booking = new BookingResponse()
            {
                BookingStatus = _statusesSettings.Value.Canceled,
                BookingReference = reference,
                PaymentInfo = priceInfo,
                Currency = Currency.GBP
            };

            _bookingRepository.Setup(x => x.GetBookingUnsafe(reference, It.IsAny<GetBookingOptions>())).ReturnsAsync(booking);

            var paymentsResponse = new BookingRefundResponse()
            {
                Exception = new ApiException(ApiExceptionCodes.RefundError)
            };
            _bookingRepository.Setup(x => x.GetBookingMemo(reference)).ReturnsAsync([]);
            _bookingPaymentsService.Setup(x => x.RefundNonCreditPayments(booking)).ReturnsAsync([paymentsResponse]);

            // Actual
            var act = await bulkToolBookingService.RunBulkProcess(request, Guid.NewGuid().ToString());

            // Assert
            act.CorrelationId.Should().NotBeNull();
            act.Reference.Should().Be(booking.BookingReference);
            act.Message.Should().Be(failedToRefundMessage);
            booking.PaymentInfo.PaymentHistory.ElementAt(0).Amount.Should().Be(amount);
            _bookingRepository.Verify(x => x.GetBookingUnsafe(reference, It.Is<GetBookingOptions>(o => o.AllowNoAccomm)));
            _bookingPaymentsService.Verify(x => x.RefundNonCreditPayments(booking));
        }

        [Theory]
        [InlineData("100001")]
        public async Task Refund_BookingHasNotCancelledStatus_ShouldCatchExceptionWithinBookingRefund(string reference)
        {
            // Arrange 
            var request = new BulkToolRequest()
            {
                Booking = new()
                {
                    Flag = _commandsSettings.RefundCommand,
                    Reference = reference
                }
            };

            var booking = new BookingResponse()
            {
                BookingStatus = _statusesSettings.Value.Booking,
                BookingReference = reference,
            };

            _bookingRepository.Setup(x => x.GetBookingUnsafe(reference, It.IsAny<GetBookingOptions>())).ReturnsAsync(booking);

            // Actual
            var act = await bulkToolBookingService.RunBulkProcess(request, Guid.NewGuid().ToString());

            // Assert
            act.CorrelationId.Should().NotBeNull();
            act.Reference.Should().Be(booking.BookingReference);
            act.Message.Should().Be("Cannot refund. Booking was not cancelled");
            booking.BookingStatus.Should().Be(_statusesSettings.Value.Booking);
            _bookingRepository.Verify(x => x.GetBookingUnsafe(reference, It.Is<GetBookingOptions>(o => o.AllowNoAccomm)));
        }

        [Theory]
        [InlineData("100001")]
        public async Task Refund_BookingHasNoPaymentHistory_ShouldReturnSuccessResult(string reference)
        {
            // Arrange 
            _messagesSettings.Object.Value.SuccessfullyRefunded = "Successfully refunded";
            _messagesSettings.Object.Value.NoPaymentsFound = "No payments found";

            var request = new BulkToolRequest()
            {
                Booking = new ()
                {
                    Flag = _commandsSettings.RefundCommand,
                    Reference = reference
                }
            };

            var priceInfo = new PriceInfo();
            var booking = new BookingResponse()
            {
                BookingStatus = _statusesSettings.Value.Canceled,
                BookingReference = reference,
                PaymentInfo = priceInfo
            };

            _bookingRepository.Setup(x => x.GetBookingUnsafe(reference, It.IsAny<GetBookingOptions>())).ReturnsAsync(booking);

            var paymentsResponse = new BookingRefundResponse()
            {
                Exception = new ApiException(ApiExceptionCodes.RefundError)
            };

            _bookingPaymentsService.Setup(x => x.RefundNonCreditPayments(booking)).ReturnsAsync([paymentsResponse]);

            // Actual
            var act = await bulkToolBookingService.RunBulkProcess(request, Guid.NewGuid().ToString());

            // Assert
            act.CorrelationId.Should().BeNull();
            act.Reference.Should().Be(booking.BookingReference);
            act.Message.Should().Be(_messagesSettings.Object.Value.SuccessfullyRefunded);
            act.Note.Should().Be(_messagesSettings.Object.Value.NoPaymentsFound);
            booking.PaymentInfo.PaymentHistory.Should().BeNull();
            _bookingRepository.Verify(x => x.GetBookingUnsafe(reference, It.Is<GetBookingOptions>(o => o.AllowNoAccomm)));
        }

        [Theory]
        [InlineData("100001", new[] { 1, -1 })]
        [InlineData("100001", new[] { -1 })]
        public async Task Refund_BookingHasPaymentsAmountLessOrEqualZero_ShouldReturnFailedResult(string reference, int[] amounts)
        {
            // Arrange 
            var failedToRefundMessage = "Failed to refund";

            var request = new BulkToolRequest()
            {
                Booking = new()
                {
                    Flag = _commandsSettings.RefundCommand,
                    Reference = reference
                }
            };

            _messagesSettings.Object.Value.FailedToRefund = failedToRefundMessage;

            var priceInfo = new PriceInfo();
            priceInfo.PaymentHistory = amounts.Select(x => new PaymentHistoryItem() { Amount = x }).ToArray();

            var booking = new BookingResponse()
            {
                BookingStatus = _statusesSettings.Value.Canceled,
                BookingReference = reference,
                PaymentInfo = priceInfo,
                Currency = Currency.GBP
            };

            _bookingRepository.Setup(x => x.GetBookingUnsafe(reference, It.IsAny<GetBookingOptions>())).ReturnsAsync(booking);
            _bookingRepository.Setup(x => x.GetBookingMemo(reference)).ReturnsAsync([]);

            // Actual
            var act = await bulkToolBookingService.RunBulkProcess(request, Guid.NewGuid().ToString());

            // Assert
            act.CorrelationId.Should().NotBeNull();
            act.Reference.Should().Be(booking.BookingReference);
            act.Message.Should().Be(failedToRefundMessage);
            _bookingRepository.Verify(x => x.GetBookingUnsafe(reference, It.Is<GetBookingOptions>(o => o.AllowNoAccomm)));
            _bookingRepository.Verify(x => x.GetBookingMemo(reference));
        }

        [Theory]
        [InlineData("100001", new[] { 1 })]
        public async Task Refund_BookingHasCredAndRepMemoCodesNothingToRefund_EmtySuccessfullResult(string reference, int[] amounts)
        {
            // Arrange 
            const string failedToRefundMessage = "Failed to refund";

            var request = new BulkToolRequest()
            {
                Booking = new()
                {
                    Flag = _commandsSettings.RefundCommand,
                    Reference = reference
                }
            };

            _messagesSettings.Object.Value.FailedToRefund = failedToRefundMessage;

            var priceInfo = new PriceInfo();
            priceInfo.PaymentHistory = amounts.Select(x => new PaymentHistoryItem() { Amount = x }).ToArray();

            var booking = new BookingResponse()
            {
                BookingStatus = _statusesSettings.Value.Canceled,
                BookingReference = reference,
                PaymentInfo = priceInfo,
                Currency = Currency.GBP
            };

            _bookingRepository.Setup(x => x.GetBookingUnsafe(reference, It.IsAny<GetBookingOptions>())).ReturnsAsync(booking);

            _bookingRepository.Setup(x => x.GetBookingMemo(reference)).ReturnsAsync([
                new Memo() { Code = "CRED" }, new Memo() { Code = "REP3" }
            ]);
            _bookingPaymentsService.Setup(x => x.RefundNonCreditPayments(booking)).ReturnsAsync(() =>
            {
                return [];
            });

            // Actual
            var act = await bulkToolBookingService.RunBulkProcess(request, Guid.NewGuid().ToString());

            // Assert
            act.CorrelationId.Should().BeNull();
            act.Message.Should().BeNull();
            _bookingRepository.Verify(x => x.GetBookingUnsafe(reference, It.Is<GetBookingOptions>(o => o.AllowNoAccomm)));
            _bookingRepository.Verify(x => x.GetBookingMemo(reference));
        }
    }
}
