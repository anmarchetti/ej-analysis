using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.BulkToolBooking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Services.Booking;
using easyJet.Holidays.Api.Domain.Services.BulkTool;
using easyJet.Holidays.Api.Domain.Services.BulkTool.Commands;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Voucherify.DataModel;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.BulkTool.Commands
{
    public class UndoCreditCommandTests
    {
        private readonly IFixture _fixture;

        public UndoCreditCommandTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();

            // common settings
            _fixture.Inject(Options.Create(new BulkToolSettings
            {
                Statuses = new StatusesSettings
                {
                    Canceled = "CANCELLED"
                },
                BookingCodes = new BookingCodesSettings
                {
                    BookingNotFound = "E1114",
                    BookingAlreadyCanceled = "E1382"
                },
                Messages = new MessagesSettings(),
                CancelAndCredit = new CancelAndCreditSettings(),
                AddCreditByEmail = new AddCreditByEmailSettings(),
                SupportedCommandsForExternalAgency = new string[] { },
            }));

            // common settings
            _fixture.Inject(Options.Create(new ApiSettings
            {
                BookingsMemos = new BookingsMemosSettings
                {
                    Cash = new MemoSettings
                    {
                        Code = "RF",
                        Description = "Refund"
                    },
                },
                Vouchers = new VoucherSettings
                {
                    BookingMemos = new BookingMemoSettings
                    {
                        
                        Cred = new MemoSettings
                        {
                            Code = "CRED"
                        },
                        MovedToCredit = new MemoSettings
                        {
                            Code = "REP3"
                        }
                    },
                    Metadata = new Dictionary<string, object> {
                        { "currency", "GBP"}
                    },
                    Source = new VoucherifySource
                    {
                        BulkTool = "Bulk Tool",
                        CallCentre = "Call Centre",
                        Web = "Web"
                    },
                    Action = new VoucherifyAction
                    {
                        Spend = "Spend",
                        CreditAndRefund = "Credit and refund",
                        UndoCredit = "Undo credit"

                    },
                    Types = new VoucherTypeSettings
                    {
                        Refund = "refund",
                        Incentive = "incentive",
                        Goodwill = "goodwill"
                    }
                }
            }));

            _fixture.Inject<IBookingRefundService>(new BookingRefundService(null, null, null, _fixture.Create<IOptions<ApiSettings>>(), null));
        }

        [Theory]
        [InlineData("Cancelled", "Not valid status for operation")]
        [InlineData("BOOKING", "Not valid status for operation")]
        public async Task UndoCredit_BookingStatusNotCANCELED_Invalid(string status, string because)
        {
            // Arrange 
            var sut = _fixture.Freeze<UndoCreditCommand>();

            var request = new BulkToolRequest
            {
                Booking = new()
                {
                    Flag = "undo credit",
                    Reference = "123"
                }
            };

            var booking = new BookingResponse
            {
                BookingStatus = status,
                BookingReference = "123",
            };

            // Act
            var actual = await sut.Invoke(booking, request, "0000-0000");

            // Assert
            actual.CorrelationId.Should().NotBeNull();
            actual.Reference.Should().Be(booking.BookingReference);
            actual.Message.Should().Be("Booking is not cancelled", because);
        }

        [Fact]
        public async Task UndoCredit_NoPaymentHistory_Invalid()
        {
            // Arrange 
            var sut = _fixture.Freeze<UndoCreditCommand>();

            var request = new BulkToolRequest
            {
                Booking = new()
                {
                    Flag = "undo credit",
                    Reference = "123"
                }
            };

            var booking = new BookingResponse
            {
                BookingStatus = "CANCELLED",
                BookingReference = "123",
            };

            // Act
            var actual = await sut.Invoke(booking, request, "0000-0000");

            // Assert
            actual.CorrelationId.Should().NotBeNull();
            actual.Reference.Should().Be(booking.BookingReference);
            actual.Message.Should().Be("No payments");
        }

        [Theory]
        [InlineData(new[] { 1, 2 })]
        [InlineData(new[] { -1, -1 })]
        public async Task UndoCredit_BalanceNotZero_Invalid(int[] amounts)
        {
            // Arrange 
            var sut = _fixture.Freeze<UndoCreditCommand>();

            var request = new BulkToolRequest
            {
                Booking = new()
                {
                    Flag = "undo credit",
                    Reference = "123"
                }
            };

            var booking = new BookingResponse
            {
                BookingStatus = "CANCELLED",
                BookingReference = "123",
                PaymentInfo = new PriceInfo
                {
                    PaymentHistory = amounts.Select(x => new PaymentHistoryItem
                    {
                        Amount = x
                    }).ToArray()
                }
            };

            // Act
            var actual = await sut.Invoke(booking, request, "0000-0000");

            // Assert
            actual.CorrelationId.Should().NotBeNull();
            actual.Reference.Should().Be(booking.BookingReference);
            actual.Message.Should().Be("Booking balance should be zero");
        }

        [Fact]
        public async Task UndoCredit_CardPaymentsRefunded_Invalid()
        {
            // Arrange
            var sut = _fixture.Freeze<UndoCreditCommand>();

            var request = new BulkToolRequest
            {
                Booking = new()
                {
                    Flag = "undo credit",
                    Reference = "123"
                }
            };

            var booking = new BookingResponse
            {
                BookingStatus = "CANCELLED",
                BookingReference = "123",
                PaymentInfo = new PriceInfo
                {
                    PaymentHistory = new[] {
                        new PaymentHistoryItem {
                            Amount = 0.5m,
                            IsCredit = true
                        },
                        new PaymentHistoryItem {
                            Amount = -0.5m,
                            IsCredit = true
                        }
                    }
                }
            };

            // Act
            var actual = await sut.Invoke(booking, request, "0000-0000");

            // Assert
            actual.CorrelationId.Should().NotBeNull();
            actual.Reference.Should().Be(booking.BookingReference);
            actual.Message.Should().Be("Skipped - Booking originally paid for with credit");
        }

        [Fact]
        public async Task UndoCredit_PaymentsRefunded_Invalid()
        {
            // Arrange
            var sut = _fixture.Freeze<UndoCreditCommand>();

            var request = new BulkToolRequest
            {
                Booking = new()
                {
                    Flag = "undo credit",
                    Reference = "123"
                }
            };

            var booking = new BookingResponse
            {
                BookingStatus = "CANCELLED",
                BookingReference = "123",
                PaymentInfo = new PriceInfo
                {
                    PaymentHistory = new[] {
                        new PaymentHistoryItem {
                            Amount = 0.5m,
                            AuthCode = "1"
                        },
                        new PaymentHistoryItem {
                            Amount = -0.5m,
                            AuthCode = "2"
                        }
                    }
                }
            };

            // Act
            var actual = await sut.Invoke(booking, request, "0000-0000");

            // Assert
            actual.CorrelationId.Should().NotBeNull();
            actual.Reference.Should().Be(booking.BookingReference);
            actual.Message.Should().Be("Skipped - no card payments to refund");
        }

        [Fact]
        public async Task UndoCredit_SuccessfulFlow()
        {
            // Arrange
            var actionsMock = _fixture.Freeze<Mock<BulkToolActions>>();
            _fixture.Inject(actionsMock.Object);
            actionsMock.Setup(x => x.GetCustomerByEmailOrCreate(It.IsAny<string>())).ReturnsAsync(new Customer
            {
                Name = "name",
                SourceId = "mocked"
            });
            actionsMock.Setup(x => x.TryGetBooking(It.IsAny<string>())).ReturnsAsync(new BookingResponse());
            actionsMock.Setup(x => x.RefundBoooking(It.IsAny<BookingResponse>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>())).ReturnsAsync(new BulkToolResponse
            {
                Message = "Successfull"
            });

            var paymentFlowMock = _fixture.Freeze<Mock<IVoucherPaymentFlowService>>();
            _fixture.Inject(paymentFlowMock.Object);
            var spendResult = new List<CreditSpend> {
                new CreditSpend {
                    VouchersIds = "111-goodwill"
                },
                new CreditSpend {
                    VouchersIds = "222-refund"
                }
            };
            paymentFlowMock.Setup(x => x.Redeem(It.IsAny<decimal>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<RedemptionMetadata>())).ReturnsAsync(spendResult);
            paymentFlowMock.Setup(x => x.AddPaymentInfo(It.IsAny<List<CreditSpend>>(), It.IsAny<LeadPassenger>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<IList<string>>())).Returns(Task.CompletedTask);


            var sut = _fixture.Freeze<UndoCreditCommand>();

            var request = new BulkToolRequest
            {
                Booking = new()
                {
                    Flag = "undo credit",
                    Reference = "123"
                }
            };
            var marketCode = "UK";

            var booking = new BookingResponse
            {
                BookingStatus = "CANCELLED",
                BookingReference = "123",
                Package = new BookingPackage
                {
                    Accom = new BookingAccommodation
                    {
                        Code = "X0001"
                    }
                },
                PaymentInfo = new PriceInfo
                {
                    PaymentHistory = new[] {
                        new PaymentHistoryItem {
                            Amount = 50m,
                            AuthCode = "1"
                        },
                        new PaymentHistoryItem {
                            Amount = 25m,
                            IsCredit = true,
                        },
                        new PaymentHistoryItem {
                            Amount = -60m,
                            IsCredit = true
                        },
                        new PaymentHistoryItem {
                            Amount = -15m,
                            IsCredit = true
                        }
                    }
                },
                CustomerDetails = new CustomerDetails
                {
                    Email = "email@email.com"
                },
                MarketCode = marketCode
            };

            // Act
            var actual = await sut.Invoke(booking, request, "0000-0000");

            // Assert
            // Response
            actual.CorrelationId.Should().NotBeNull();
            actual.Reference.Should().Be(booking.BookingReference);
            actual.Message.Should().Be("Successfull");
            actual.Note.Should().Be("111-goodwill;222-refund");

            // Right amount was redeemed
            paymentFlowMock.Verify(x => x.Redeem(50m, It.IsAny<string>(), booking.BookingReference, "X0001", marketCode, "mocked", It.IsAny<RedemptionMetadata>()), Times.Once);
            // Redemptions added to payments
            paymentFlowMock.Verify(x => x.AddPaymentInfo(It.Is<List<CreditSpend>>(spend => spend.SequenceEqual(spendResult)), It.IsAny<LeadPassenger>(), booking.BookingReference, It.IsAny<string>(), It.IsAny<string>(), null, null, null), Times.Once);
            // Booking was refreshed
            actionsMock.Verify(x => x.TryGetBooking(booking.BookingReference), Times.Once);
            // Payments were refunded
            actionsMock.Verify(x => x.RefundBoooking(It.IsAny<BookingResponse>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>()), Times.Once);
        }

        [Fact]
        public async Task UndoCredit_NotEnoughCredit_Invalid()
        {
            // Arrange
            var actionsMock = _fixture.Freeze<Mock<BulkToolActions>>();
            _fixture.Inject(actionsMock.Object);
            actionsMock.Setup(x => x.GetCustomerByEmailOrCreate(It.IsAny<string>())).ReturnsAsync(new Customer
            {
                Name = "name",
                SourceId = "mocked"
            });
            actionsMock.Setup(x => x.TryGetBooking(It.IsAny<string>())).ReturnsAsync(new BookingResponse());
            actionsMock.Setup(x => x.RefundBoooking(It.IsAny<BookingResponse>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>())).ReturnsAsync(new BulkToolResponse
            {
                Message = "Successfull"
            });

            var paymentFlowMock = _fixture.Freeze<Mock<IVoucherPaymentFlowService>>();
            _fixture.Inject(paymentFlowMock.Object);
            paymentFlowMock.Setup(x => x.Redeem(It.IsAny<decimal>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<RedemptionMetadata>())).ThrowsAsync(new VoucherRedeemExeption(ApiExceptionCodes.CreditsFailedRedeem));

            var sut = _fixture.Freeze<UndoCreditCommand>();

            var request = new BulkToolRequest
            {
                Booking = new()
                {
                    Flag = "undo credit",
                    Reference = "123"
                }
            };

            var booking = new BookingResponse
            {
                BookingStatus = "CANCELLED",
                BookingReference = "123",
                Package = new BookingPackage
                {
                    Accom = new BookingAccommodation
                    {
                        Code = "X0001"
                    }
                },
                PaymentInfo = new PriceInfo
                {
                    PaymentHistory = new[] {
                        new PaymentHistoryItem {
                            Amount = 50m,
                            AuthCode = "1"
                        },
                        new PaymentHistoryItem {
                            Amount = -50m,
                            IsCredit = true
                        },
                    }
                },
                CustomerDetails = new CustomerDetails
                {
                    Email = "email@email.com"
                }
            };

            // Act
            var actual = await sut.Invoke(booking, request, "0000-0000");

            // Assert
            // Response
            actual.CorrelationId.Should().NotBeNull();
            actual.Reference.Should().Be(booking.BookingReference);
            actual.Message.Should().Be("Cannot be processed, not enough credit in customer account");
        }

        [Fact]
        public async Task UndoCredit_CantUpdatePaymentInfo_RollbackRedemptions()
        {
            // Arrange
            var actionsMock = _fixture.Freeze<Mock<BulkToolActions>>();
            _fixture.Inject(actionsMock.Object);
            actionsMock.Setup(x => x.GetCustomerByEmailOrCreate(It.IsAny<string>())).ReturnsAsync(new Customer
            {
                Name = "name",
                SourceId = "mocked"
            });
            actionsMock.Setup(x => x.TryGetBooking(It.IsAny<string>())).ReturnsAsync(new BookingResponse());
            actionsMock.Setup(x => x.RefundBoooking(It.IsAny<BookingResponse>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>())).ReturnsAsync(new BulkToolResponse
            {
                Message = "Successfull"
            });

            var paymentFlowMock = _fixture.Freeze<Mock<IVoucherPaymentFlowService>>();
            _fixture.Inject(paymentFlowMock.Object);
            var spendResult = new List<CreditSpend> {
                new CreditSpend {
                    VouchersIds = "111-goodwill"
                },
                new CreditSpend {
                    VouchersIds = "222-refund"
                }
            };
            paymentFlowMock.Setup(x => x.Redeem(It.IsAny<decimal>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<RedemptionMetadata>())).ReturnsAsync(spendResult);
            paymentFlowMock.Setup(x => x.AddPaymentInfo(It.IsAny<List<CreditSpend>>(), It.IsAny<LeadPassenger>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<IList<string>>())).Throws(new Exception("Can't update payment information"));
            paymentFlowMock.Setup(x => x.Rollback(It.IsAny<List<CreditSpend>>(), It.IsAny<string>())).Returns(Task.FromResult<ApiException>(null));

            var sut = _fixture.Freeze<UndoCreditCommand>();

            var request = new BulkToolRequest
            {
                Booking = new()
                {
                    Flag = "undo credit",
                    Reference = "123"
                }
            };

            var booking = new BookingResponse
            {
                BookingStatus = "CANCELLED",
                BookingReference = "123",
                Package = new BookingPackage
                {
                    Accom = new BookingAccommodation
                    {
                        Code = "X0001"
                    }
                },
                PaymentInfo = new PriceInfo
                {
                    PaymentHistory = new[] {
                        new PaymentHistoryItem {
                            Amount = 50m,
                            AuthCode = "1"
                        },
                        new PaymentHistoryItem {
                            Amount = -50m,
                            IsCredit = true
                        }
                    }
                },
                CustomerDetails = new CustomerDetails
                {
                    Email = "email@email.com"
                }
            };

            // Act
            var actual = await sut.Invoke(booking, request, "0000-0000");

            // Assert
            // Response
            actual.CorrelationId.Should().NotBeNull();
            actual.Reference.Should().Be(booking.BookingReference);
            actual.Message.Should().Be("Cannot redeem credit");

            // Rollback redemptions
            paymentFlowMock.Verify(x => x.Rollback(It.Is<List<CreditSpend>>(spend => spend.SequenceEqual(spendResult)), It.IsAny<string>()), Times.Once);
        }
    }
}
