using easyJet.Holidays.Api.Domain.Data.AmendBooking.Payment;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.BreakdownStrategies;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking.Cancellation.BreakdownStrategies;

public class CustomerLedFlightAndHotelBreakdownStrategyTests : BaseBreakdownStrategyTests
{
    private readonly CustomerLedFlightAndHotelBreakdownStrategy _sut;
    private readonly Mock<IBookingCancellationCreditRulesEngine> _bookingCancellationRulesEngineMock = new();
    private readonly Mock<IInfoCancellationService> _infoCancellationServiceMock = new();
    private readonly Mock<ISettingsService> _settingsServiceMock = new();

    public CustomerLedFlightAndHotelBreakdownStrategyTests()
    {
        Mock<IFeeCalculator> feeCalculatorMock = new();
        _bookingCancellationRulesEngineMock
            .Setup(x => x.FindEligibleRule(It.IsAny<BookingResponse>()))
            .ReturnsAsync(new List<CreditOnlyRefundRule>());

        SetupCancelCreditSettings(enableAmendmentFee: true);

        _sut = new CustomerLedFlightAndHotelBreakdownStrategy(
            _infoCancellationServiceMock.Object, _settingsServiceMock.Object, _bookingCancellationRulesEngineMock.Object, feeCalculatorMock.Object);
    }

    [Theory]
    [InlineData(BookingCancellationReason.CustomerLed, "fph", true)]
    [InlineData(BookingCancellationReason.CustomerLed, "FPH", true)]
    [InlineData(BookingCancellationReason.CustomerLed, "", false)]
    [InlineData(BookingCancellationReason.CustomerLed, "flightandhotel", false)]
    [InlineData(BookingCancellationReason.EasyJetLed, "fph", false)]
    [InlineData(BookingCancellationReason.CustomerLed, "FlightOnly", false)]
    public void ShouldRefund_WhenReasonAndPromotionNameProvided_ReturnsExpectedResult(
        BookingCancellationReason reason,
        string promotionName,
        bool expected)
    {
        // Act
        var result = _sut.ShouldRefund(reason, new List<string> { promotionName });

        // Assert
        result.Should().Be(expected);
    }

    private static BookingResponse BuildBooking(int daysToDeparture, int guestsAmount, params PaymentHistoryItem[] payments)
    {
        var request = new BookingResponse
        {
            Currency = new Currency { Code = "GBP" },
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes =
                    [
                        new Route
                        {
                            DepDate = DateTime.UtcNow.AddDays(daysToDeparture).AddHours(1),
                            Direction = Direction.Outbound
                        }
                    ]
                }
            },
            PaymentInfo = new PriceInfo
            {
                TotalPrice = payments.Sum(p => p.Amount),
                PaymentHistory = payments
            },
            Guests = new List<PersonWithDetails>()
        };

        for (int i = 0; i < guestsAmount; i++)
        {
            request.Guests.Add(new PersonWithDetails
            {
                Age = 20 + i,
                FirstName = $"TestFirstName{i}",
                LastName = $"TestLastName{i}",
                Type = PersonType.Adult
            });
        }

        return request;
    }

    private void SetupFee(BookingResponse request, decimal feeAmount) =>
        _infoCancellationServiceMock
            .Setup(x => x.GetInfoCancellationAsync(request))
            .ReturnsAsync(new InfoCancellationResponse
            {
                CancellationFeeItem = new FeeItem { Amount = feeAmount }
            });

    private void SetupCancelCreditSettings(bool enableAmendmentFee) =>
        _settingsServiceMock.Setup(x => x.GetCancelCreditSettings())
            .ReturnsAsync(new CreditAndCashRefundSettings
            {
                ApplyOneTimeUseCreditForXOrMoreDaysBeforeDeparture = 60,
                ShowOnlyOriginalPaymentMethodForXOrMoreDaysBeforeDeparture = 27,
                EnableAmendmentFee = enableAmendmentFee,
                EnableOneTimeUseCredit = true
            });

    private static void SetupAmendmentFee(BookingResponse request, decimal amendmentFeeAmount) =>
        request.PaymentInfo.AmendmentFeesItems =
        [
            new FeeItem
            {
                Amount = amendmentFeeAmount
            }
        ];

    private void SetupMatchingDestinationRule(BookingResponse request) =>
        _bookingCancellationRulesEngineMock
            .Setup(x => x.FindEligibleRule(request))
            .ReturnsAsync(new List<CreditOnlyRefundRule> { new() });

    [Fact]
    public async Task GetCancellationRefundBreakdown_WhenDestinationRuleMatches_ShouldRefundCashAsCredit()
    {
        // Arrange
        var request = BuildBooking(
            daysToDeparture: 30,
            guestsAmount: 2,
            CashPayment(800),
            GoodWillPayment(200));

        SetupFee(request, feeAmount: 750m);
        SetupMatchingDestinationRule(request);

        var expected = new BookingCancellationRefundBreakdown
        {
            CancelFeeAmount = 0,
            AmendmentFeeAmount = 0,
            OneTimeUseCreditKeptAmount = 0,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = 1000,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 1000,
            CashRefundAmount = 0,
            CreditRefundAmount = 1000,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 1000,
            TransferredCashPaymentToRefundCreditAmount = 800,
            DaysBeforeDeparture = 30,
            Currency = "GBP",
            OneTimeUseCreditTotalPaidAmount = 0,
            OriginalBookingValue = 1000,
            IsDestinationRulesApplied = true,
            OriginalCancelFeeAmount = 0
        };

        // Act
        var result = await _sut.GetCancellationRefundBreakdown(request, null, CancellationToken.None);

        // Assert
        result.Should().BeEquivalentTo(expected);
        _bookingCancellationRulesEngineMock.Verify(x => x.FindEligibleRule(request), Times.Once);
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Never);
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_WhenAmendmentFeeIsEnabled_ShouldDeductAmendmentFeeFromRefund()
    {
        // Arrange
        var request = BuildBooking(
            daysToDeparture: 30,
            guestsAmount: 2,
            CashPayment(800),
            GoodWillPayment(200));

        SetupFee(request, feeAmount: 250m);
        SetupAmendmentFee(request, amendmentFeeAmount: 100m);

        var expected = new BookingCancellationRefundBreakdown
        {
            CancelFeeAmount = 250,
            AmendmentFeeAmount = 100,
            OneTimeUseCreditKeptAmount = 0,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = 650,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 650,
            CashRefundAmount = 650,
            CreditRefundAmount = 0,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = 30,
            OneTimeUseCreditTotalPaidAmount = 0,
            OriginalBookingValue = 1000,
            OriginalCancelFeeAmount = 250
        };

        // Act
        var result = await _sut.GetCancellationRefundBreakdown(request, null, CancellationToken.None);

        // Assert
        result.Should().BeEquivalentTo(expected);
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_WhenAmendmentFeeIsGreaterThanRefundAmount_ShouldCapAmendmentFee()
    {
        // Arrange
        var request = BuildBooking(
            daysToDeparture: 30,
            guestsAmount: 2,
            CashPayment(1000));

        SetupFee(request, feeAmount: 900m);
        SetupAmendmentFee(request, amendmentFeeAmount: 150m);

        var expected = new BookingCancellationRefundBreakdown
        {
            CancelFeeAmount = 900,
            AmendmentFeeAmount = 100,
            OneTimeUseCreditKeptAmount = 0,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = 0,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 0,
            CashRefundAmount = 0,
            CreditRefundAmount = 0,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = 30,
            OneTimeUseCreditTotalPaidAmount = 0,
            OriginalBookingValue = 1000,
            OriginalCancelFeeAmount = 900
        };

        // Act
        var result = await _sut.GetCancellationRefundBreakdown(request, null, CancellationToken.None);

        // Assert
        result.Should().BeEquivalentTo(expected);
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_WhenAmendmentFeeIsDisabled_ShouldNotDeductAmendmentFeeFromRefund()
    {
        // Arrange
        var request = BuildBooking(
            daysToDeparture: 30,
            guestsAmount: 2,
            CashPayment(800),
            GoodWillPayment(200));

        SetupCancelCreditSettings(enableAmendmentFee: false);
        SetupFee(request, feeAmount: 250m);
        SetupAmendmentFee(request, amendmentFeeAmount: 100m);

        var expected = new BookingCancellationRefundBreakdown
        {
            CancelFeeAmount = 250,
            AmendmentFeeAmount = 0,
            OneTimeUseCreditKeptAmount = 0,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = 750,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 750,
            CashRefundAmount = 750,
            CreditRefundAmount = 0,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = 30,
            OneTimeUseCreditTotalPaidAmount = 0,
            OriginalBookingValue = 1000,
            OriginalCancelFeeAmount = 250
        };

        // Act
        var result = await _sut.GetCancellationRefundBreakdown(request, null, CancellationToken.None);

        // Assert
        result.Should().BeEquivalentTo(expected);
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    // ============================================================
    // Ticket 1 SER-999 - Non-refundable F+H (100% fee) - no refund at all
    // ============================================================

    [Theory]
    [InlineData(30)]
    [InlineData(20)]
    [InlineData(7)]
    public async Task GetCancellationRefundBreakdown_NonRefundableFH_AnyDayBucket_RetainsFullValue(int days)
    {
        // Arrange
        var request = BuildBooking(
            days,
            guestsAmount: 2,
            CashPayment(600),
            GoodWillPayment(100),
            GoodWillPayment(100),
            GoodWillPayment(100),
            OneTimeUseCreditPayment(100));

        SetupFee(request, feeAmount: 1000m);

        var expected = new BookingCancellationRefundBreakdown
        {
            CancelFeeAmount = 1000,
            AmendmentFeeAmount = 0,
            OneTimeUseCreditKeptAmount = 100,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = 0,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 0,
            CashRefundAmount = 0,
            CreditRefundAmount = 0,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = days,
            OneTimeUseCreditTotalPaidAmount = 100,
            OriginalBookingValue = 1000,
            OriginalCancelFeeAmount = 1000
        };

        // Act
        var result = await _sut.GetCancellationRefundBreakdown(request, null, CancellationToken.None);

        // Assert
        result.Should().BeEquivalentTo(expected);
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    // ============================================================
    // Ticket 2 SER-998 - Refundable F+H without OTUC
    // ============================================================

    [Fact]
    public async Task GetCancellationRefundBreakdown_RefundableFH_Outside28Days_NoOtuc_FullRefund()
    {
        // Arrange
        var request = BuildBooking(
            daysToDeparture: 30,
            guestsAmount: 2,
            CashPayment(800),
            PromoCreditPayment(50), // Staff Credit
            PromoCreditPayment(50), // Tesco Credit
            GoodWillPayment(50),
            RefundCreditPayment(50));

        SetupFee(request, feeAmount: 0m);

        var expected = new BookingCancellationRefundBreakdown
        {
            CancelFeeAmount = 0,
            AmendmentFeeAmount = 0,
            OneTimeUseCreditKeptAmount = 0,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = 1000,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 1000,
            CashRefundAmount = 800,
            CreditRefundAmount = 200,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 200,
            Currency = "GBP",
            DaysBeforeDeparture = 30,
            OneTimeUseCreditTotalPaidAmount = 0,
            OriginalBookingValue = 1000,
            OriginalCancelFeeAmount = 0
        };

        // Act
        var result = await _sut.GetCancellationRefundBreakdown(request, null, CancellationToken.None);

        // Assert
        result.Should().BeEquivalentTo(expected);
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_RefundableFH_Between27And14Days_NoOtuc_75PctFee_RetainsCreditFirst()
    {
        // Arrange
        var request = BuildBooking(
            daysToDeparture: 20,
            guestsAmount: 2,
            CashPayment(800),
            PromoCreditPayment(50), // Staff Credit
            PromoCreditPayment(50), // Tesco Credit
            GoodWillPayment(50),
            RefundCreditPayment(50));

        SetupFee(request, feeAmount: 750m);

        var expected = new BookingCancellationRefundBreakdown
        {
            CancelFeeAmount = 750,
            AmendmentFeeAmount = 0,
            OneTimeUseCreditKeptAmount = 0,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = 250,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 250,
            CashRefundAmount = 250,
            CreditRefundAmount = 0,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = 20,
            OneTimeUseCreditTotalPaidAmount = 0,
            OriginalBookingValue = 1000,
            OriginalCancelFeeAmount = 750
        };

        // Act
        var result = await _sut.GetCancellationRefundBreakdown(request, null, CancellationToken.None);

        // Assert
        result.Should().BeEquivalentTo(expected);
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_RefundableFH_Between13And0Days_NoOtuc_100PctFee_NoRefund()
    {
        // Arrange
        var request = BuildBooking(
            daysToDeparture: 7,
            guestsAmount: 2,
            CashPayment(800),
            PromoCreditPayment(50), // Staff Credit
            PromoCreditPayment(50), // Tesco Credit
            GoodWillPayment(50),
            RefundCreditPayment(50));

        SetupFee(request, feeAmount: 1000m);

        var expected = new BookingCancellationRefundBreakdown
        {
            CancelFeeAmount = 1000,
            AmendmentFeeAmount = 0,
            OneTimeUseCreditKeptAmount = 0,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = 0,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 0,
            CashRefundAmount = 0,
            CreditRefundAmount = 0,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = 7,
            OneTimeUseCreditTotalPaidAmount = 0,
            OriginalBookingValue = 1000,
            OriginalCancelFeeAmount = 1000
        };

        // Act
        var result = await _sut.GetCancellationRefundBreakdown(request, null, CancellationToken.None);

        // Assert
        result.Should().BeEquivalentTo(expected);
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Theory]
    [InlineData(250, 250, 750, 750, 0, 250)]
    [InlineData(330, 330, 670, 670, 0, 330)]
    [InlineData(990, 990, 10, 10, 0, 990)]
    [InlineData(1100, 1000, 0, 0, 0, 1100)]
    public async Task GetCancellationRefundBreakdown_RefundableFH_NoOtuc_VariousFeePercentages(
        decimal feeAmount,
        decimal expectedCancelFee,
        decimal expectedTotalRefund,
        decimal expectedCashRefund,
        decimal expectedCreditRefund,
        decimal expectedOriginalCancelFee)
    {
        // Arrange
        var request = BuildBooking(
            daysToDeparture: 20,
            guestsAmount: 2,
            CashPayment(800),
            PromoCreditPayment(50), // Staff Credit
            PromoCreditPayment(50), // Tesco Credit
            GoodWillPayment(50),
            RefundCreditPayment(50));

        SetupFee(request, feeAmount);

        var expected = new BookingCancellationRefundBreakdown
        {
            CancelFeeAmount = expectedCancelFee,
            AmendmentFeeAmount = 0,
            OneTimeUseCreditKeptAmount = 0,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = expectedTotalRefund,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = expectedTotalRefund,
            CashRefundAmount = expectedCashRefund,
            CreditRefundAmount = expectedCreditRefund,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = expectedCreditRefund,
            Currency = "GBP",
            DaysBeforeDeparture = 20,
            OneTimeUseCreditTotalPaidAmount = 0,
            OriginalBookingValue = 1000,
            OriginalCancelFeeAmount = expectedOriginalCancelFee
        };

        // Act
        var result = await _sut.GetCancellationRefundBreakdown(request, null, CancellationToken.None);

        // Assert
        result.Should().BeEquivalentTo(expected);
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    // ============================================================
    // Ticket 3 SER-996 - Refundable F+H with OTUC
    // ============================================================

    [Fact]
    public async Task GetCancellationRefundBreakdown_RefundableFH_Outside28Days_WithOtuc_RefundsAllOtuc()
    {
        // Arrange
        var request = BuildBooking(
            daysToDeparture: 30,
            guestsAmount: 2,
            CashPayment(600),
            OneTimeUseCreditPayment(300),
            GoodWillPayment(100));

        SetupFee(request, feeAmount: 0m);

        var expected = new BookingCancellationRefundBreakdown
        {
            CancelFeeAmount = 0,
            AmendmentFeeAmount = 0,
            OneTimeUseCreditKeptAmount = 0,
            OneTimeUseCreditRefundAmount = 300,
            TotalRefundAmount = 1000,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 700,
            CashRefundAmount = 600,
            CreditRefundAmount = 400,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 100,
            Currency = "GBP",
            DaysBeforeDeparture = 30,
            OneTimeUseCreditTotalPaidAmount = 300,
            OriginalBookingValue = 1000,
            OriginalCancelFeeAmount = 0
        };

        // Act
        var result = await _sut.GetCancellationRefundBreakdown(request, null, CancellationToken.None);

        // Assert
        result.Should().BeEquivalentTo(expected);
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_RefundableFH_Between27And14Days_OtucEqualsFee_RetainsOtucExactly()
    {
        // Arrange
        // Per Jira: OTUC 750 retained (= fee), Cash 150 + Other Credit 100 fully refunded.
        var request = BuildBooking(
            daysToDeparture: 20,
            guestsAmount: 2,
            CashPayment(150),
            OneTimeUseCreditPayment(750),
            GoodWillPayment(100));

        SetupFee(request, feeAmount: 750m);

        var expected = new BookingCancellationRefundBreakdown
        {
            CancelFeeAmount = 750,
            AmendmentFeeAmount = 0,
            OneTimeUseCreditKeptAmount = 750,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = 250,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 250,
            CashRefundAmount = 150,
            CreditRefundAmount = 100,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 100,
            Currency = "GBP",
            DaysBeforeDeparture = 20,
            OneTimeUseCreditTotalPaidAmount = 750,
            OriginalBookingValue = 1000,
            OriginalCancelFeeAmount = 750
        };

        // Act
        var result = await _sut.GetCancellationRefundBreakdown(request, null, CancellationToken.None);

        // Assert
        result.Should().BeEquivalentTo(expected);
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_RefundableFH_Between27And14Days_OtucLessThanFee_RetainsOtucPlusCredits()
    {
        // Arrange
        // Per Jira: OTUC 550 retained, Other Credit 100 retained, Cash absorbs remaining 100 retained / 250 refunded.
        var request = BuildBooking(
            daysToDeparture: 20,
            guestsAmount: 2,
            CashPayment(350),
            OneTimeUseCreditPayment(550),
            GoodWillPayment(100));

        SetupFee(request, feeAmount: 750m);

        var expected = new BookingCancellationRefundBreakdown
        {
            CancelFeeAmount = 750,
            AmendmentFeeAmount = 0,
            OneTimeUseCreditKeptAmount = 550,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = 250,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 250,
            CashRefundAmount = 250,
            CreditRefundAmount = 0,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = 20,
            OneTimeUseCreditTotalPaidAmount = 550,
            OriginalBookingValue = 1000,
            OriginalCancelFeeAmount = 750
        };

        // Act
        var result = await _sut.GetCancellationRefundBreakdown(request, null, CancellationToken.None);

        // Assert
        result.Should().BeEquivalentTo(expected);
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_RefundableFH_Between27And14Days_OtucMoreThanFee_RetainsOtucUpToFeeAndRefundsExcess()
    {
        // Arrange
        var request = BuildBooking(
            daysToDeparture: 20,
            guestsAmount: 2,
            CashPayment(100),
            OneTimeUseCreditPayment(850),
            GoodWillPayment(50));

        SetupFee(request, feeAmount: 750m);

        var expected = new BookingCancellationRefundBreakdown
        {
            CancelFeeAmount = 750,
            AmendmentFeeAmount = 0,
            OneTimeUseCreditKeptAmount = 750,
            OneTimeUseCreditRefundAmount = 100,
            TotalRefundAmount = 250,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 150,
            CashRefundAmount = 100,
            CreditRefundAmount = 150,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 50,
            Currency = "GBP",
            DaysBeforeDeparture = 20,
            OneTimeUseCreditTotalPaidAmount = 850,
            OriginalBookingValue = 1000,
            OriginalCancelFeeAmount = 750
        };

        // Act
        var result = await _sut.GetCancellationRefundBreakdown(request, null, CancellationToken.None);

        // Assert
        result.Should().BeEquivalentTo(expected);
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_RefundableFH_Between13And0Days_WithOtuc_100PctFee_RetainsAll()
    {
        // Arrange
        var request = BuildBooking(
            daysToDeparture: 7,
            guestsAmount: 2,
            CashPayment(600),
            OneTimeUseCreditPayment(300),
            GoodWillPayment(100));

        SetupFee(request, feeAmount: 1000m);

        var expected = new BookingCancellationRefundBreakdown
        {
            CancelFeeAmount = 1000,
            AmendmentFeeAmount = 0,
            OneTimeUseCreditKeptAmount = 300,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = 0,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 0,
            CashRefundAmount = 0,
            CreditRefundAmount = 0,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = 7,
            OneTimeUseCreditTotalPaidAmount = 300,
            OriginalBookingValue = 1000,
            OriginalCancelFeeAmount = 1000
        };

        // Act
        var result = await _sut.GetCancellationRefundBreakdown(request, null, CancellationToken.None);

        // Assert
        result.Should().BeEquivalentTo(expected);
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }
}
