using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Services.Booking.Cancellation;
using FluentAssertions;
using Moq;
using System.Diagnostics.CodeAnalysis;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking.Cancellation
{
    [ExcludeFromCodeCoverage]
    [SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
    public class BookingCancellationRefundSummaryServiceTest
    {
        private readonly BookingCancellationRefundSummaryService _sut;


        private readonly Mock<ISettingsService> _settingsService = new();

        public BookingCancellationRefundSummaryServiceTest()
        {
            var settings =
                new CreditAndCashRefundSettings() { ShowOnlyOriginalPaymentMethodForXOrMoreDaysBeforeDeparture = 27 };
            _settingsService.Setup(x => x.GetCancelCreditSettings()).ReturnsAsync(settings);

            _sut = new BookingCancellationRefundSummaryService();
        }

        [Fact]
        public async Task GetCancellationRefundSummary_ShouldReturnSummary_WhenValidBooking()
        {
            // Arrange
            var bookingCancellationRefundBreakdown = new BookingCancellationRefundBreakdown()
            {
                TotalRefundAmount = 100, DaysBeforeDeparture = 100, Currency = "GBP", OriginalBookingValue = 1000,
            };

            // Act
            var result = await _sut.GetCancellationRefundSummary(bookingCancellationRefundBreakdown,
                BookingCancellationRefundOption.CreditAndOriginalPayment, false);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("GBP", result.Currency);
            Assert.NotEmpty(result.Refunds);
        }

        [Fact]
        public async Task GetCancellationRefundSummary_ShouldReturnTradeSummary_WhenValidTradeBooking()
        {
            // Arrange
            var bookingCancellationRefundBreakdown = new BookingCancellationRefundBreakdown()
            {
                TotalRefundAmount = 100, DaysBeforeDeparture = 100, Currency = "GBP", OriginalBookingValue = 1000,
            };

            // Act
            var result = await _sut.GetCancellationRefundSummary(bookingCancellationRefundBreakdown,
                BookingCancellationRefundOption.CreditAndOriginalPayment, true);

            // Assert
            result.Should().BeOfType<CancellationSummaryTradeResponse>();
            Assert.NotNull(result);
            Assert.Equal("GBP", result.Currency);
            Assert.NotEmpty(result.Refunds);
            (result as CancellationSummaryTradeResponse)!.OriginalBookingValue.Should().Be(1000);
        }

        [Fact]
        public async Task GetCancellationRefundSummary_ShouldReturnSummaryWithEmptyRefundList_WhenTotalRefundIsZero()
        {
            // Arrange
            var bookingCancellationRefundBreakdown = new BookingCancellationRefundBreakdown()
            {
                TotalRefundAmount = 0, DaysBeforeDeparture = 100, Currency = "GBP", OriginalBookingValue = 1000
            };

            // Act
            var result = await _sut.GetCancellationRefundSummary(bookingCancellationRefundBreakdown,
                BookingCancellationRefundOption.None, false);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("GBP", result.Currency);
            Assert.Empty(result.Refunds);
        }

        [Fact]
        public async Task GetCancellationRefundSummary_ShouldReturnCreditOnlyRefund_WhenEligible()
        {
            // Arrange
            var bookingCancellationRefundBreakdown = new BookingCancellationRefundBreakdown()
            {
                TotalRefundAmount = 100, DaysBeforeDeparture = 100, Currency = "GBP", OriginalBookingValue = 1000
            };

            // Act
            var result = await _sut.GetCancellationRefundSummary(bookingCancellationRefundBreakdown,
                BookingCancellationRefundOption.CreditOnly, false);

            // Assert
            Assert.NotNull(result);
            Assert.Single(result.Refunds);
            Assert.IsType<CancellationSummaryCreditRefundDetail>(result.Refunds[0]);
        }

        [Fact]
        public async Task
            GetCancellationRefundSummary_ShouldApplyOriginalPaymentMethod_WhenDaysBeforeDepartureExceedsThreshold()
        {
            // Arrange
            _settingsService.Setup(x => x.GetCancelCreditSettings())
                .ReturnsAsync(new CreditAndCashRefundSettings
                {
                    ShowOnlyOriginalPaymentMethodForXOrMoreDaysBeforeDeparture = 30
                });

            var bookingCancellationRefundBreakdown = new BookingCancellationRefundBreakdown()
            {
                DaysBeforeDeparture = 100, Currency = "GBP", OriginalBookingValue = 1000,
            };

            // Act
            var result = await _sut.GetCancellationRefundSummary(bookingCancellationRefundBreakdown,
                BookingCancellationRefundOption.None, false);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("GBP", result.Currency);
        }

        [Fact]
        public async Task GetCancellationRefundSummary_WhenSendProperRequest_ShouldReturnResult()
        {
            // Arrange
            BookingCancellationRefundBreakdown breakdownResponse =
                new()
                {
                    TotalRefundAmount = 100, DaysBeforeDeparture = 100, Currency = "GBP", OriginalBookingValue = 1000,
                };

            CancellationSummaryResponse response = new()
            {
                RefundBreakdownValidationHash = breakdownResponse.GetHashCode(),
                Currency = "GBP",
                Refunds = new List<CancellationSummaryRefundDetail>()
                {
                    new CancellationSummaryCreditRefundDetail() { Total = 100 }
                },
                DaysBeforeDeparture = 100,
                OneTimeUseCreditTotalPaid = 0,
            };

            // Act
            var result = await _sut.GetCancellationRefundSummary(breakdownResponse,
                BookingCancellationRefundOption.CreditOnly, false);

            // Assert
            result.Should().BeEquivalentTo(response);
        }

        [Fact]
        public async Task
            GetCancellationRefundSummary_IsLessDaysThanInShowOnlyOriginalPaymentMethod_ShowOnlyShowOriginalPaymentMethod()
        {
            // Arrange
            BookingCancellationRefundBreakdown breakdownResponse =
                new()
                {
                    TotalRefundAmount = 100,
                    DaysBeforeDeparture = 20,
                    Currency = "GBP",
                    OneTimeUseCreditTotalPaidAmount = 0,
                    OriginalBookingValue = 1000,
                };
            CancellationSummaryResponse response = new()
            {
                RefundBreakdownValidationHash = breakdownResponse.GetHashCode(),
                Currency = "GBP",
                Refunds = new List<CancellationSummaryRefundDetail>()
                {
                    new CancellationSummaryOriginalRefundDetail() { Total = 100 }
                },
                DaysBeforeDeparture = 20,
                OneTimeUseCreditTotalPaid = 0,
            };

            // Act
            var result = await _sut.GetCancellationRefundSummary(breakdownResponse,
                BookingCancellationRefundOption.OriginalPayment, false);

            // Assert
            result.Should().BeEquivalentTo(response);
        }

        [Fact]
        public async Task
            GetCancellationRefundSummary_IsLessDaysThanInShowOnlyOriginalPaymentMethod_OnlyCreditRefundInBreakdown_ShowOnlyCreditRefundMethod()
        {
            // Arrange
            BookingCancellationRefundBreakdown breakdownResponse = new()
            {
                TotalRefundAmount = 100,
                CreditRefundAmount = 100,
                Currency = "GBP",
                DaysBeforeDeparture = 20,
                OneTimeUseCreditTotalPaidAmount = 0,
                OriginalBookingValue = 1000,
            };
            CancellationSummaryResponse response = new()
            {
                RefundBreakdownValidationHash = breakdownResponse.GetHashCode(),
                Currency = "GBP",
                Refunds = new List<CancellationSummaryRefundDetail>()
                {
                    new CancellationSummaryCreditRefundDetail() { Total = 100 }
                },
                DaysBeforeDeparture = 20,
                OneTimeUseCreditTotalPaid = 0,
            };

            // Act
            var result = await _sut.GetCancellationRefundSummary(breakdownResponse,
                BookingCancellationRefundOption.CreditOnly, false);

            // Assert
            result.Should().BeEquivalentTo(response);
        }

        [Theory]
        [InlineData(200, 60, 60)]
        [InlineData(200, 120, 120)]
        [InlineData(200, 180, 180)]
        [InlineData(200, 240, 240)]
        public async Task
            GetCancellationRefundSummary_WhenPaidInCashInOneTimeCreditAndInOthersCredit_ShouldReturnResultWithTwoCancellationSummary(
                decimal cash, decimal oneTimeCredit, decimal othersCredit)
        {
            // Arrange
            decimal totalRefundAmount = cash + oneTimeCredit + othersCredit;
            BookingCancellationRefundBreakdown breakdownResponse = new()
            {
                CancelFeeAmount = 0,
                TotalRefundAmount = totalRefundAmount,
                OneTimeUseCreditRefundAmount = oneTimeCredit,
                OneTimeUseCreditKeptAmount = 0,
                TotalRefundAmountExceptOneTimeUseCreditRefundAmount = totalRefundAmount - oneTimeCredit,
                CashRefundAmount = totalRefundAmount - oneTimeCredit - othersCredit,
                CreditRefundAmount = othersCredit + oneTimeCredit,
                TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = othersCredit,
                DaysBeforeDeparture = 100,
                Currency = "GBP",
                OneTimeUseCreditTotalPaidAmount = oneTimeCredit,
                OriginalBookingValue = 1000,
            };
            CancellationSummaryResponse response = new CancellationSummaryResponse()
            {
                RefundBreakdownValidationHash = breakdownResponse.GetHashCode(),
                Currency = "GBP",
                Refunds = new List<CancellationSummaryRefundDetail>()
                {
                    new CancellationSummaryCreditRefundDetail()
                    {
                        Credit = breakdownResponse.TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount,
                        OneTimeUseCredit = oneTimeCredit,
                        RefundOption = BookingCancellationRequestRefundOption.Credit,
                        Total = totalRefundAmount,
                    },
                    new CancellationSummaryOriginalRefundDetail()
                    {
                        OriginalPayment = cash,
                        OneTimeUseCredit = oneTimeCredit,
                        RefundOption = BookingCancellationRequestRefundOption.OriginalPayment,
                        Total = totalRefundAmount,
                        Credit = breakdownResponse.TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount
                    }
                }.AsReadOnly(),
                DaysBeforeDeparture = 100,
                OneTimeUseCreditTotalPaid = oneTimeCredit,
            };

            // Act
            var result = await _sut.GetCancellationRefundSummary(breakdownResponse,
                BookingCancellationRefundOption.CreditAndOriginalPayment, false);

            // Assert
            result.Should().BeEquivalentTo(response);
        }

        [Theory]
        [InlineData(1000, 60)]
        [InlineData(1000, 120)]
        [InlineData(1000, 180)]
        [InlineData(1000, 240)]
        public async Task
            GetCancellationRefundSummary_WhenPaidMoreInCashThenInOneTimeCredit_ShouldReturnResultWithTwoCancellationSummary(
                decimal totalRefundAmount, decimal oneTimeCredit)
        {
            // Arrange
            BookingCancellationRefundBreakdown breakdownResponse = new()
            {
                CancelFeeAmount = 0,
                TotalRefundAmount = totalRefundAmount,
                OneTimeUseCreditRefundAmount = oneTimeCredit,
                OneTimeUseCreditKeptAmount = 0,
                TotalRefundAmountExceptOneTimeUseCreditRefundAmount = totalRefundAmount - oneTimeCredit,
                CashRefundAmount = totalRefundAmount - oneTimeCredit,
                DaysBeforeDeparture = 100,
                Currency = "GBP",
                OneTimeUseCreditTotalPaidAmount = oneTimeCredit,
                OriginalBookingValue = 1000,
            };
            CancellationSummaryResponse response = new CancellationSummaryResponse()
            {
                RefundBreakdownValidationHash = breakdownResponse.GetHashCode(),
                Currency = "GBP",
                Refunds = new List<CancellationSummaryRefundDetail>()
                {
                    new CancellationSummaryCreditRefundDetail()
                    {
                        Credit = totalRefundAmount - oneTimeCredit,
                        OneTimeUseCredit = oneTimeCredit,
                        RefundOption = BookingCancellationRequestRefundOption.Credit,
                        Total = totalRefundAmount,
                    },
                    new CancellationSummaryOriginalRefundDetail()
                    {
                        OriginalPayment = totalRefundAmount - oneTimeCredit,
                        OneTimeUseCredit = oneTimeCredit,
                        RefundOption = BookingCancellationRequestRefundOption.OriginalPayment,
                        Total = totalRefundAmount,
                        Credit = 0
                    }
                }.AsReadOnly(),
                DaysBeforeDeparture = 100,
                OneTimeUseCreditTotalPaid = oneTimeCredit,
            };

            // Act
            var result = await _sut.GetCancellationRefundSummary(breakdownResponse,
                BookingCancellationRefundOption.CreditAndOriginalPayment, false);

            // Assert
            result.Should().BeEquivalentTo(response);
        }

        [Theory]
        [InlineData(1000, 60, 60)]
        [InlineData(1000, 120, 120)]
        [InlineData(1000, 180, 180)]
        [InlineData(1000, 240, 240)]
        public async Task
            GetCancellationRefundSummary_WhenPaidMoreInCashThenInOthersCredit_ShouldReturnResultWithTwoCancellationSummary(
                decimal totalRefundAmount, decimal oneTimeCredit, decimal othersCredit)
        {
            // Arrange
            BookingCancellationRefundBreakdown breakdownResponse = new()
            {
                CancelFeeAmount = 0,
                TotalRefundAmount = totalRefundAmount,
                OneTimeUseCreditRefundAmount = oneTimeCredit,
                OneTimeUseCreditKeptAmount = 0,
                TotalRefundAmountExceptOneTimeUseCreditRefundAmount = totalRefundAmount - oneTimeCredit,
                CashRefundAmount = totalRefundAmount - oneTimeCredit - othersCredit,
                CreditRefundAmount = othersCredit,
                DaysBeforeDeparture = 100,
                Currency = "GBP",
                OneTimeUseCreditTotalPaidAmount = oneTimeCredit,
                OriginalBookingValue = 1000,
            };
            CancellationSummaryResponse response = new CancellationSummaryResponse()
            {
                RefundBreakdownValidationHash = breakdownResponse.GetHashCode(),
                Currency = "GBP",
                Refunds = new List<CancellationSummaryRefundDetail>()
                {
                    new CancellationSummaryCreditRefundDetail()
                    {
                        Credit = totalRefundAmount - oneTimeCredit,
                        OneTimeUseCredit = oneTimeCredit,
                        RefundOption = BookingCancellationRequestRefundOption.Credit,
                        Total = totalRefundAmount,
                    },
                    new CancellationSummaryOriginalRefundDetail()
                    {
                        OriginalPayment = totalRefundAmount - oneTimeCredit - othersCredit,
                        OneTimeUseCredit = oneTimeCredit,
                        RefundOption = BookingCancellationRequestRefundOption.OriginalPayment,
                        Total = totalRefundAmount,
                        Credit = othersCredit
                    }
                }.AsReadOnly(),
                DaysBeforeDeparture = 100,
                OneTimeUseCreditTotalPaid = oneTimeCredit,
            };

            // Act
            var result = await _sut.GetCancellationRefundSummary(breakdownResponse,
                BookingCancellationRefundOption.CreditAndOriginalPayment, false);

            // Assert
            result.Should().BeEquivalentTo(response);
        }

        [Theory]
        [InlineData(1000, 60, 60)]
        [InlineData(1000, 120, 120)]
        [InlineData(1000, 180, 180)]
        [InlineData(1000, 240, 240)]
        public async Task
            GetCancellationRefundSummary_WhenPaidMoreInCashThenInOthersCreditAndKeptOneTimeUseCredit_ShouldReturnResultWithTwoCancellationSummary(
                decimal totalRefundAmount, decimal oneTimeCredit, decimal othersCredit)
        {
            // Arrange
            BookingCancellationRefundBreakdown breakdownResponse = new()
            {
                CancelFeeAmount = 0,
                TotalRefundAmount = totalRefundAmount,
                OneTimeUseCreditRefundAmount = oneTimeCredit,
                OneTimeUseCreditKeptAmount = 120,
                TotalRefundAmountExceptOneTimeUseCreditRefundAmount = totalRefundAmount - oneTimeCredit,
                CashRefundAmount = totalRefundAmount - oneTimeCredit - othersCredit,
                CreditRefundAmount = othersCredit,
                DaysBeforeDeparture = 100,
                Currency = "GBP",
                OneTimeUseCreditTotalPaidAmount = oneTimeCredit,
                OriginalBookingValue = 1000,
            };
            CancellationSummaryResponse response = new CancellationSummaryResponse()
            {
                RefundBreakdownValidationHash = breakdownResponse.GetHashCode(),
                Currency = "GBP",
                Refunds = new List<CancellationSummaryRefundDetail>()
                {
                    new CancellationSummaryCreditRefundDetail()
                    {
                        Credit = totalRefundAmount - oneTimeCredit,
                        OneTimeUseCredit = oneTimeCredit,
                        RefundOption = BookingCancellationRequestRefundOption.Credit,
                        Total = totalRefundAmount,
                    },
                    new CancellationSummaryOriginalRefundDetail()
                    {
                        OriginalPayment = totalRefundAmount - oneTimeCredit - othersCredit,
                        OneTimeUseCredit = oneTimeCredit,
                        RefundOption = BookingCancellationRequestRefundOption.OriginalPayment,
                        Total = totalRefundAmount,
                        Credit = othersCredit
                    }
                }.AsReadOnly(),
                DaysBeforeDeparture = 100,
                OneTimeUseCreditTotalPaid = oneTimeCredit,
            };

            // Act
            var result = await _sut.GetCancellationRefundSummary(breakdownResponse,
                BookingCancellationRefundOption.CreditAndOriginalPayment, false);

            // Assert
            result.Should().BeEquivalentTo(response);
        }

        [Theory]
        [InlineData(240, 240)]
        public async Task
            GetCancellationRefundSummary_WhenRefundOnlyInCredit_ShouldReturnResultWithCreditCancellationSummary(
                decimal totalRefundAmount, decimal oneTimeCredit)
        {
            // Arrange
            BookingCancellationRefundBreakdown breakdownResponse = new()
            {
                CancelFeeAmount = 0,
                TotalRefundAmount = totalRefundAmount,
                OneTimeUseCreditRefundAmount = oneTimeCredit,
                OneTimeUseCreditKeptAmount = 0,
                TotalRefundAmountExceptOneTimeUseCreditRefundAmount = totalRefundAmount - oneTimeCredit,
                CashRefundAmount = totalRefundAmount - oneTimeCredit,
                DaysBeforeDeparture = 100,
                Currency = "GBP",
                OneTimeUseCreditTotalPaidAmount = oneTimeCredit,
                OriginalBookingValue = 1000,
            };
            CancellationSummaryResponse response = new()
            {
                RefundBreakdownValidationHash = breakdownResponse.GetHashCode(),
                Currency = "GBP",
                Refunds = new List<CancellationSummaryRefundDetail>()
                {
                    new CancellationSummaryCreditRefundDetail()
                    {
                        Credit = totalRefundAmount - oneTimeCredit,
                        OneTimeUseCredit = oneTimeCredit,
                        RefundOption = BookingCancellationRequestRefundOption.Credit,
                        Total = totalRefundAmount,
                    }
                }.AsReadOnly(),
                DaysBeforeDeparture = 100,
                OneTimeUseCreditTotalPaid = oneTimeCredit,
            };

            // Act
            var result = await _sut.GetCancellationRefundSummary(breakdownResponse,
                BookingCancellationRefundOption.CreditOnly, false);

            // Assert
            result.Should().BeEquivalentTo(response);
        }

        [Theory]
        [InlineData(1000)]
        [InlineData(2000)]
        [InlineData(200)]
        public async Task
            GetCancellationRefundSummary_WhenRefundOnlyInOriginalMethodOfPayment_ShouldReturnResultWithOriginalMethodOfPaymentCancellationSummary(
                decimal totalRefundAmount)
        {
            // Arrange
            BookingCancellationRefundBreakdown breakdownResponse = new()
            {
                CancelFeeAmount = 0,
                TotalRefundAmount = totalRefundAmount,
                OneTimeUseCreditRefundAmount = 0,
                OneTimeUseCreditKeptAmount = 0,
                TotalRefundAmountExceptOneTimeUseCreditRefundAmount = totalRefundAmount,
                CashRefundAmount = totalRefundAmount,
                DaysBeforeDeparture = 100,
                Currency = "GBP",
                OneTimeUseCreditTotalPaidAmount = 0,
                OriginalBookingValue = 1000,
            };
            CancellationSummaryResponse response = new()
            {
                RefundBreakdownValidationHash = breakdownResponse.GetHashCode(),
                Currency = "GBP",
                Refunds = new List<CancellationSummaryRefundDetail>()
                {
                    new CancellationSummaryOriginalRefundDetail()
                    {
                        OriginalPayment = totalRefundAmount, OneTimeUseCredit = 0, Total = totalRefundAmount,
                    },
                    new CancellationSummaryCreditRefundDetail()
                    {
                        Credit = totalRefundAmount, OneTimeUseCredit = 0, Total = totalRefundAmount,
                    }
                }.AsReadOnly(),
                DaysBeforeDeparture = 100,
                OneTimeUseCreditTotalPaid = 0,
            };

            // Act
            var result = await _sut.GetCancellationRefundSummary(breakdownResponse,
                BookingCancellationRefundOption.CreditAndOriginalPayment, false);

            // Assert
            result.Should().BeEquivalentTo(response);
        }
        
        [Theory]
        [InlineData(100)]
        [InlineData(0)]
        public async Task GetCancellationRefundSummary_ShouldReturnAmendmentFeeInSummary_WhenValidBooking(decimal amendmentFeeAmount)
        {
            // Arrange
            var bookingCancellationRefundBreakdown = new BookingCancellationRefundBreakdown()
            {
                TotalRefundAmount = 100, DaysBeforeDeparture = 100, Currency = "GBP", OriginalBookingValue = 1000, AmendmentFeeAmount = amendmentFeeAmount
            };

            // Act
            var result = await _sut.GetCancellationRefundSummary(bookingCancellationRefundBreakdown,
                BookingCancellationRefundOption.CreditAndOriginalPayment, false);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("GBP", result.Currency);
            Assert.NotEmpty(result.Refunds);
            Assert.Equal(amendmentFeeAmount, result.AmendmentFeeAmount);
        }

        [Theory]
        [InlineData(150)]
        [InlineData(0)]
        public async Task GetCancellationRefundSummary_ShouldReturnCancellationFeeInSummary_WhenValidBooking(decimal cancelFeeAmount)
        {
            // Arrange
            var bookingCancellationRefundBreakdown = new BookingCancellationRefundBreakdown()
            {
                TotalRefundAmount = 100, DaysBeforeDeparture = 100, Currency = "GBP", OriginalBookingValue = 1000, CancelFeeAmount = cancelFeeAmount
            };

            // Act
            var result = await _sut.GetCancellationRefundSummary(bookingCancellationRefundBreakdown,
                BookingCancellationRefundOption.CreditAndOriginalPayment, false);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("GBP", result.Currency);
            Assert.NotEmpty(result.Refunds);
            Assert.Equal(cancelFeeAmount, result.CancellationFee);
        }

        [Theory]
        [InlineData(150)]
        [InlineData(0)]
        public async Task GetCancellationRefundSummary_ShouldReturnCancellationFeeInTradeSummary_WhenValidTradeBooking(decimal cancelFeeAmount)
        {
            // Arrange
            var bookingCancellationRefundBreakdown = new BookingCancellationRefundBreakdown()
            {
                TotalRefundAmount = 100, DaysBeforeDeparture = 100, Currency = "GBP", OriginalBookingValue = 1000, CancelFeeAmount = cancelFeeAmount
            };

            // Act
            var result = await _sut.GetCancellationRefundSummary(bookingCancellationRefundBreakdown,
                BookingCancellationRefundOption.CreditAndOriginalPayment, true);

            // Assert
            result.Should().BeOfType<CancellationSummaryTradeResponse>();
            Assert.Equal(cancelFeeAmount, result.CancellationFee);
        }
    }
}