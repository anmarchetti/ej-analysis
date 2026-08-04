using easyJet.Holidays.Api.Domain.Constants;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
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
    public class BookingCancellationRefundOptionServiceTest
    {
        private readonly BookingCancellationRefundOptionService _sut;


        private readonly Mock<ISettingsService> _settingsService = new();

        public BookingCancellationRefundOptionServiceTest()
        {
            var settings =
                new CreditAndCashRefundSettings() { ShowOnlyOriginalPaymentMethodForXOrMoreDaysBeforeDeparture = 27 };
            _settingsService.Setup(x => x.GetCancelCreditSettings()).ReturnsAsync(settings);

            _sut = new BookingCancellationRefundOptionService(_settingsService.Object);
        }

        [Fact]
        public async Task GetRefundOption_ShouldReturnSummaryWithEmptyRefundList_WhenTotalRefundIsZero()
        {
            // Arrange
            var bookingCancellationReason = BookingCancellationReason.CustomerLed;

            var bookingCancellationRefundBreakdown = new BookingCancellationRefundBreakdown()
            {
                TotalRefundAmount = 0, DaysBeforeDeparture = 100, Currency = "GBP", OriginalBookingValue = 1000
            };

            var bookingResponse = new BookingResponse();

            // Act
            var result = await _sut.GetRefundOption(bookingResponse, bookingCancellationRefundBreakdown,
                bookingCancellationReason);

            // Assert
            result.Should().Be(BookingCancellationRefundOption.None);
        }

        [Fact]
        public async Task GetRefundOption_ShouldReturnCreditOnlyRefund_WhenEligible()
        {
            // Arrange
            var bookingCancellationReason = BookingCancellationReason.CustomerLed;

            var bookingCancellationRefundBreakdown = new BookingCancellationRefundBreakdown()
            {
                TotalRefundAmount = 100, DaysBeforeDeparture = 100, Currency = "GBP", OriginalBookingValue = 1000
            };
            var bookingResponse = new BookingResponse();

            // Act
            var result = await _sut.GetRefundOption(bookingResponse, bookingCancellationRefundBreakdown,
                bookingCancellationReason);

            // Assert
            result.Should().Be(BookingCancellationRefundOption.CreditOnly);
        }

        [Fact]
        public async Task GetRefundOption_ShouldApplyOriginalPaymentMethod_WhenDaysBeforeDepartureExceedsThreshold()
        {
            // Arrange
            var bookingCancellationReason = BookingCancellationReason.CustomerLed;

            _settingsService.Setup(x => x.GetCancelCreditSettings())
                .ReturnsAsync(new CreditAndCashRefundSettings
                {
                    ShowOnlyOriginalPaymentMethodForXOrMoreDaysBeforeDeparture = 30
                });
            var bookingCancellationRefundBreakdown = new BookingCancellationRefundBreakdown()
            {
                DaysBeforeDeparture = 100, Currency = "GBP", OriginalBookingValue = 1000
            };
            var bookingResponse = new BookingResponse();

            // Act
            var result = await _sut.GetRefundOption(bookingResponse, bookingCancellationRefundBreakdown,
                bookingCancellationReason);

            // Assert
            result.Should().Be(BookingCancellationRefundOption.None);
        }

        [Fact]
        public async Task
            GetRefundOption_IsLessDaysThanInShowOnlyOriginalPaymentMethod_ShowOnlyShowOriginalPaymentMethod()
        {
            // Arrange
            BookingCancellationReason reason = BookingCancellationReason.CustomerLed;
            BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown =
                new()
                {
                    TotalRefundAmount = 100,
                    DaysBeforeDeparture = 20,
                    Currency = "GBP",
                    OneTimeUseCreditTotalPaidAmount = 0,
                    OriginalBookingValue = 1000
                };
            var bookingResponse = new BookingResponse();

            // Act
            var result = await _sut.GetRefundOption(bookingResponse, bookingCancellationRefundBreakdown, reason);

            // Assert
            result.Should().Be(BookingCancellationRefundOption.OriginalPayment);
        }

        [Fact]
        public async Task
            GetRefundOption_IsLessDaysThanInShowOnlyOriginalPaymentMethod_OnlyCreditRefundInBreakdown_ShowOnlyCreditRefundMethod()
        {
            // Arrange
            BookingCancellationReason reason = BookingCancellationReason.CustomerLed;
            BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown = new()
            {
                TotalRefundAmount = 100,
                CreditRefundAmount = 100,
                Currency = "GBP",
                DaysBeforeDeparture = 20,
                OneTimeUseCreditTotalPaidAmount = 0,
                OriginalBookingValue = 1000,
            };
            var bookingResponse = new BookingResponse();

            // Act
            var result = await _sut.GetRefundOption(bookingResponse, bookingCancellationRefundBreakdown, reason);

            // Assert
            result.Should().Be(BookingCancellationRefundOption.CreditOnly);
        }

        [Theory]
        [InlineData(200, 60, 60)]
        [InlineData(200, 120, 120)]
        [InlineData(200, 180, 180)]
        [InlineData(200, 240, 240)]
        public async Task
            GetRefundOption_WhenPaidInCashInOneTimeCreditAndInOthersCredit_ShouldReturnResultWithTwoCancellationSummary(
                decimal cash, decimal oneTimeCredit, decimal othersCredit)
        {
            // Arrange
            decimal totalRefundAmount = cash + oneTimeCredit + othersCredit;
            BookingCancellationReason reason = BookingCancellationReason.CustomerLed;
            BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown = new()
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
            var bookingResponse = new BookingResponse();

            // Act
            var result = await _sut.GetRefundOption(bookingResponse, bookingCancellationRefundBreakdown, reason);

            // Assert
            result.Should().Be(BookingCancellationRefundOption.CreditAndOriginalPayment);
        }

        [Theory]
        [InlineData(1000, 60)]
        [InlineData(1000, 120)]
        [InlineData(1000, 180)]
        [InlineData(1000, 240)]
        public async Task
            GetRefundOption_WhenPaidMoreInCashThenInOneTimeCredit_ShouldReturnResultWithTwoCancellationSummary(
                decimal totalRefundAmount, decimal oneTimeCredit)
        {
            // Arrange
            BookingCancellationReason reason = BookingCancellationReason.CustomerLed;
            BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown = new()
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
            var bookingResponse = new BookingResponse();

            // Act
            var result = await _sut.GetRefundOption(bookingResponse, bookingCancellationRefundBreakdown, reason);

            // Assert
            result.Should().Be(BookingCancellationRefundOption.CreditAndOriginalPayment);
        }

        [Theory]
        [InlineData(1000, 60, 60)]
        [InlineData(1000, 120, 120)]
        [InlineData(1000, 180, 180)]
        [InlineData(1000, 240, 240)]
        public async Task
            GetRefundOption_WhenPaidMoreInCashThenInOthersCredit_ShouldReturnResultWithTwoCancellationSummary(
                decimal totalRefundAmount, decimal oneTimeCredit, decimal othersCredit)
        {
            // Arrange
            BookingCancellationReason reason = BookingCancellationReason.CustomerLed;
            BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown = new()
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
            var bookingResponse = new BookingResponse();

            // Act
            var result = await _sut.GetRefundOption(bookingResponse, bookingCancellationRefundBreakdown, reason);

            // Assert
            result.Should().Be(BookingCancellationRefundOption.CreditAndOriginalPayment);
        }

        [Theory]
        [InlineData(1000, 60, 60)]
        [InlineData(1000, 120, 120)]
        [InlineData(1000, 180, 180)]
        [InlineData(1000, 240, 240)]
        public async Task
            GetRefundOption_WhenPaidMoreInCashThenInOthersCreditAndKeptOneTimeUseCredit_ShouldReturnResultWithTwoCancellationSummary(
                decimal totalRefundAmount, decimal oneTimeCredit, decimal othersCredit)
        {
            // Arrange
            BookingCancellationReason reason = BookingCancellationReason.CustomerLed;
            BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown = new()
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
            var bookingResponse = new BookingResponse();

            // Act
            var result = await _sut.GetRefundOption(bookingResponse, bookingCancellationRefundBreakdown, reason);

            // Assert
            result.Should().Be(BookingCancellationRefundOption.CreditAndOriginalPayment);
        }

        [Theory]
        [InlineData(240, 240)]
        public async Task GetRefundOption_WhenRefundOnlyInCredit_ShouldReturnResultWithCreditCancellationSummary(
            decimal totalRefundAmount, decimal oneTimeCredit)
        {
            // Arrange
            BookingCancellationReason reason = BookingCancellationReason.CustomerLed;
            BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown = new()
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
            var bookingResponse = new BookingResponse();

            // Act
            var result = await _sut.GetRefundOption(bookingResponse, bookingCancellationRefundBreakdown, reason);

            // Assert
            result.Should().Be(BookingCancellationRefundOption.CreditOnly);
        }

        [Theory]
        [InlineData(1000)]
        [InlineData(2000)]
        [InlineData(200)]
        public async Task
            GetRefundOption_WhenRefundOnlyInOriginalMethodOfPayment_ShouldReturnResultWithOriginalMethodOfPaymentCancellationSummary(
                decimal totalRefundAmount)
        {
            // Arrange
            BookingCancellationReason reason = BookingCancellationReason.CustomerLed;
            BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown = new()
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
            var bookingResponse = new BookingResponse();

            // Act
            var result = await _sut.GetRefundOption(bookingResponse, bookingCancellationRefundBreakdown, reason);

            // Assert
            result.Should().Be(BookingCancellationRefundOption.CreditAndOriginalPayment);
        }

        [Theory]
        [InlineData("fph")]
        [InlineData("FPH")]
        public async Task
            GetRefundOption_WhenCustomerLedFlightPlusHotel_ShouldReturnOriginalPaymentRegardlessOfDaysBeforeDeparture(
                string promotionCollection)
        {
            // Arrange
            var bookingCancellationReason = BookingCancellationReason.CustomerLed;

            var bookingCancellationRefundBreakdown = new BookingCancellationRefundBreakdown()
            {
                TotalRefundAmount = 100,
                CashRefundAmount = 100,
                DaysBeforeDeparture = 100,
                Currency = "GBP",
                OriginalBookingValue = 1000
            };

            var bookingResponse = new BookingResponse()
            {
                PromotionCollections = new List<string> { promotionCollection }
            };

            // Act
            var result = await _sut.GetRefundOption(bookingResponse, bookingCancellationRefundBreakdown,
                bookingCancellationReason);

            // Assert
            result.Should().Be(BookingCancellationRefundOption.OriginalPayment);
        }

        [Fact]
        public async Task GetRefundOption_WhenCustomerLedFlightPlusHotelAndRefundIsCreditOnly_ShouldReturnCreditOnly()
        {
            // Arrange
            var bookingCancellationReason = BookingCancellationReason.CustomerLed;

            var bookingCancellationRefundBreakdown = new BookingCancellationRefundBreakdown()
            {
                TotalRefundAmount = 100,
                CreditRefundAmount = 100,
                DaysBeforeDeparture = 100,
                Currency = "GBP",
                OriginalBookingValue = 1000
            };

            var bookingResponse = new BookingResponse()
            {
                PromotionCollections = new List<string> { ExperienceContextProviderConstants.FlightPlusHotel }
            };

            // Act
            var result = await _sut.GetRefundOption(bookingResponse, bookingCancellationRefundBreakdown,
                bookingCancellationReason);

            // Assert
            result.Should().Be(BookingCancellationRefundOption.CreditOnly);
        }

        [Fact]
        public async Task GetRefundOption_WhenTradeLed_ShouldReturnOriginalPaymentOnly()
        {
            // Arrange
            var bookingCancellationReason = BookingCancellationReason.TradeLed;

            var bookingCancellationRefundBreakdown = new BookingCancellationRefundBreakdown()
            {
                TotalRefundAmount = 100,
                CashRefundAmount = 100,
                DaysBeforeDeparture = 100,
                Currency = "GBP",
                OriginalBookingValue = 1000,
            };
            var bookingResponse = new BookingResponse();

            // Act
            var result = await _sut.GetRefundOption(bookingResponse, bookingCancellationRefundBreakdown,
                bookingCancellationReason);

            // Assert
            result.Should().Be(BookingCancellationRefundOption.OriginalPayment);
        }
    }
}