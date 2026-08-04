using easyJet.Holidays.Api.Domain.Data.AmendBooking.Payment;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.BreakdownStrategies;
using easyJet.Holidays.Api.Domain.Utils;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking.Cancellation.BreakdownStrategies;

public class TradeLedBreakdownStrategyTests : BaseBreakdownStrategyTests
{
    private readonly TradeLedBreakdownStrategy _testee;
    private readonly Mock<IInfoCancellationService> _infoCancellationServiceMock = new Mock<IInfoCancellationService>();
    private readonly Mock<ISettingsService> _settingsServiceMock = new Mock<ISettingsService>();

    public TradeLedBreakdownStrategyTests()
    {
        Mock<IFeeCalculator> feeCalculatorMock = new ();
        feeCalculatorMock.Setup(x => x.CalculateFee(It.IsAny<BookingResponse>())).Returns<BookingResponse>(bookingResponse =>
        {
            var bookingValue = bookingResponse.PaymentInfo?.TotalPrice ?? 0;
            var daysBeforeDeparture = BookingUtils.DaysToDeparture(bookingResponse);
            var numberOfPassengers = bookingResponse.Guests.Count;

            return daysBeforeDeparture switch
            {
                > 27 => 60 * numberOfPassengers,
                > 20 and <= 27 => bookingValue * 0.75m,
                _ => bookingValue
            };
        });

        _settingsServiceMock.Setup(x => x.GetCancelCreditSettings())
            .ReturnsAsync(new CreditAndCashRefundSettings()
            {
                ApplyOneTimeUseCreditForXOrMoreDaysBeforeDeparture = 60,
                ShowOnlyOriginalPaymentMethodForXOrMoreDaysBeforeDeparture = 27,
                EnableAmendmentFee = true,
                EnableOneTimeUseCredit = true
            });

        _testee = new TradeLedBreakdownStrategy(_infoCancellationServiceMock.Object, _settingsServiceMock.Object, feeCalculatorMock.Object);
    }

    [Theory]
    [InlineData(1, 1000, 100)]
    [InlineData(2, 1000, 100)]
    [InlineData(3, 1000, 100)]
    [InlineData(4, 1000, 100)]
    [InlineData(5, 1000, 100)]
    [InlineData(6, 1000, 100)]
    [InlineData(7, 1000, 100)]
    [InlineData(8, 1000, 100)]
    [InlineData(9, 1000, 100)]
    [InlineData(10, 1000, 100)]
    [InlineData(11, 1000, 100)]
    [InlineData(12, 1000, 100)]
    [InlineData(13, 1000, 100)]
    [InlineData(14, 1000, 100)]
    [InlineData(15, 1000, 100)]
    [InlineData(16, 1000, 100)]
    [InlineData(17, 1000, 100)]
    [InlineData(18, 1000, 100)]
    [InlineData(19, 1000, 100)]
    public async Task
        GetCancellationRefundBreakdown_WhenMoreThen0DaysButLessThenOrEqual20BeforeDeparture_ShouldReturn0PercentOfTotalAmount(
            int days, decimal paymentAmount, decimal amendmentFeeAmount)
    {
        // Arrange
        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new Transport()
                {
                    Routes = new List<Route>()
                    {
                        new Route()
                        {
                            DepDate = DateTime.UtcNow.AddDays(days).AddHours(1),
                            Direction = Direction.Outbound
                        }
                    },
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 1000, PaymentReceived = 1000, PaymentHistory = new List<PaymentHistoryItem>().ToArray(),
                AmendmentFeesItems = new FeeItem[]
                {
                    new FeeItem()
                    {
                        Amount = amendmentFeeAmount
                    }
                }
            },
            Guests = [new(), new()],
            IsExternalAgency = true
        };
        decimal fee = paymentAmount;
        BookingCancellationRefundBreakdown response = new BookingCancellationRefundBreakdown()
        {
            CancelFeeAmount = fee,
            AmendmentFeeAmount = 0,
            OneTimeUseCreditKeptAmount = 0,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = 0,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 0,
            CashRefundAmount = 0,
            CreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = days,
            OriginalBookingValue = 1000
        };
        CancellationToken cancellationToken = new CancellationToken();
        InfoCancellationResponse infoCancellationResponse = new InfoCancellationResponse()
        {
            CancellationFeeItem = new FeeItem() { Amount = fee, }
        };
        _infoCancellationServiceMock
            .Setup(x => x.GetInfoCancellationAsync(request))
            .ReturnsAsync(infoCancellationResponse);

        // Act
#if DEBUG
        Log(request, response, this);
#endif
        var result = await _testee.GetCancellationRefundBreakdown(request, null, cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(response);
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Theory]
    [InlineData(2, 1000)]
    [InlineData(1, 1000)]
    [InlineData(1, 500)]
    [InlineData(2, 1500)]
    public async Task GetCancellationRefundBreakdown_TradeLedOutside28Days_ShouldReturnBalanceToCash(int guestsAmount,
        decimal bookingValue)
    {
        // Arrange
        int daysBeforeDeparture = 29;
        decimal depositAmount = guestsAmount * 60;
        var balanceAmount = bookingValue - depositAmount;
        BookingResponse request = CreateBookingResponse(daysBeforeDeparture, guestsAmount, bookingValue);

        BookingCancellationRefundBreakdown expectedResponse = new BookingCancellationRefundBreakdown()
        {
            CancelFeeAmount = depositAmount,
            CashRefundAmount = balanceAmount,
            CreditRefundAmount = 0,
            OneTimeUseCreditKeptAmount = 0,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = balanceAmount,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = balanceAmount,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = daysBeforeDeparture,
            OneTimeUseCreditTotalPaidAmount = 0,
            OriginalBookingValue = bookingValue,
        };

        CancellationToken cancellationToken = new CancellationToken();
        InfoCancellationResponse infoCancellationResponse = new InfoCancellationResponse()
        {
            CancellationFeeItem = new FeeItem() { Amount = depositAmount }
        };
        _infoCancellationServiceMock
            .Setup(x => x.GetInfoCancellationAsync(request))
            .ReturnsAsync(infoCancellationResponse);

        // Act
#if DEBUG
        Log(request, expectedResponse, this);
#endif
        var result = await _testee.GetCancellationRefundBreakdown(request, null, cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(expectedResponse);
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Theory]
    [InlineData(2, 1000, 75)]
    [InlineData(1, 1000, 100)]
    [InlineData(1, 500, 40)]
    [InlineData(2, 1500, 200)]
    public async Task GetCancellationRefundBreakdown_TradeLedOutside28DaysWithAmendmentFee_ShouldReturnBalanceToCash(int guestsAmount,
    decimal bookingValue, decimal amendmentFeeAmount)
    {
        // Arrange
        int daysBeforeDeparture = 29;
        decimal depositAmount = guestsAmount * 60;
        var balanceAmount = bookingValue - depositAmount - amendmentFeeAmount;
        BookingResponse request = CreateBookingResponse(daysBeforeDeparture, guestsAmount, bookingValue, amendmentFeeAmount);

        BookingCancellationRefundBreakdown expectedResponse = new BookingCancellationRefundBreakdown()
        {
            CancelFeeAmount = depositAmount,
            AmendmentFeeAmount = amendmentFeeAmount,
            CashRefundAmount = balanceAmount,
            CreditRefundAmount = 0,
            OneTimeUseCreditKeptAmount = 0,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = balanceAmount,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = balanceAmount,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = daysBeforeDeparture,
            OneTimeUseCreditTotalPaidAmount = 0,
            OriginalBookingValue = bookingValue,
        };

        CancellationToken cancellationToken = new CancellationToken();
        InfoCancellationResponse infoCancellationResponse = new InfoCancellationResponse()
        {
            CancellationFeeItem = new FeeItem() { Amount = depositAmount }
        };
        _infoCancellationServiceMock
            .Setup(x => x.GetInfoCancellationAsync(request))
            .ReturnsAsync(infoCancellationResponse);

        // Act
#if DEBUG
        Log(request, expectedResponse, this);
#endif
        var result = await _testee.GetCancellationRefundBreakdown(request, null, cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(expectedResponse);
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Theory]
    [InlineData(2, 1000)]
    [InlineData(4, 1000)]
    [InlineData(2, 500)]
    [InlineData(4, 500)]
    public async Task GetCancellationRefundBreakdown_TradeLed27To21Days_ShouldReturn25PercentBalanceToCash(
        int guestsAmount, decimal bookingValue)
    {
        // Arrange
        int daysBeforeDeparture = 25;
        decimal expectedRefund = bookingValue * 0.25M;
        decimal fee = bookingValue * 0.75M;
        BookingResponse request = CreateBookingResponse(daysBeforeDeparture, guestsAmount, bookingValue);

        BookingCancellationRefundBreakdown expectedResponse = new()
        {
            CancelFeeAmount = fee,
            CashRefundAmount = expectedRefund,
            CreditRefundAmount = 0,
            OneTimeUseCreditKeptAmount = 0,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = expectedRefund,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = expectedRefund,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = daysBeforeDeparture,
            OneTimeUseCreditTotalPaidAmount = 0,
            OriginalBookingValue = bookingValue,
        };

        CancellationToken cancellationToken = new();
        InfoCancellationResponse infoCancellationResponse = new()
        {
            CancellationFeeItem = new FeeItem { Amount = fee }
        };
        _infoCancellationServiceMock
            .Setup(x => x.GetInfoCancellationAsync(request))
            .ReturnsAsync(infoCancellationResponse);

        // Act
#if DEBUG
        Log(request, expectedResponse, this);
#endif
        var result = await _testee.GetCancellationRefundBreakdown(request, null, cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(expectedResponse);
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Theory]
    [InlineData(2, 1000)]
    [InlineData(4, 1000)]
    [InlineData(2, 500)]
    [InlineData(4, 500)]
    public async Task GetCancellationRefundBreakdown_TradeLed20To0Days_ShouldRetainFullBooking(int guestsAmount,
        decimal totalPayment)
    {
        // Arrange
        int daysBeforeDeparture = 10;
        BookingResponse request = CreateBookingResponse(daysBeforeDeparture, guestsAmount, totalPayment);

        BookingCancellationRefundBreakdown expectedResponse = new BookingCancellationRefundBreakdown()
        {
            CancelFeeAmount = totalPayment,
            CashRefundAmount = 0,
            CreditRefundAmount = 0,
            OneTimeUseCreditKeptAmount = 0,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = 0,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 0,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = daysBeforeDeparture,
            OneTimeUseCreditTotalPaidAmount = 0,
            OriginalBookingValue = totalPayment,
        };

        CancellationToken cancellationToken = new CancellationToken();
        InfoCancellationResponse infoCancellationResponse = new InfoCancellationResponse()
        {
            CancellationFeeItem = new FeeItem() { Amount = totalPayment }
        };
        _infoCancellationServiceMock
            .Setup(x => x.GetInfoCancellationAsync(request))
            .ReturnsAsync(infoCancellationResponse);

        // Act
#if DEBUG
        Log(request, expectedResponse, this);
#endif
        var result = await _testee.GetCancellationRefundBreakdown(request, null, cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(expectedResponse);
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Theory]
    [InlineData(2, 1000, 120, 900)]
    [InlineData(2, 120, 120, 50)]
    [InlineData(2, 240, 120, 120)]
    [InlineData(2, 100, 120, 120)]
    public async Task GetCancellationRefundBreakdown_TradeLedOutside28DaysWithMoreAmendmentFee_ShouldReturnNoRefund(int guestsAmount, decimal bookingValue, decimal cancelFeeAmount, decimal amendmentFeeAmount)
    {
        // Arrange
        int daysBeforeDeparture = 29;
        BookingResponse request = CreateBookingResponse(daysBeforeDeparture, 2, bookingValue, amendmentFeeAmount);

        BookingCancellationRefundBreakdown expectedResponse = new BookingCancellationRefundBreakdown()
        {
            CancelFeeAmount = Math.Min(bookingValue, cancelFeeAmount),
            AmendmentFeeAmount = Math.Max(Math.Min(bookingValue - cancelFeeAmount, amendmentFeeAmount), 0),
            CashRefundAmount = 0,
            CreditRefundAmount = 0,
            OneTimeUseCreditKeptAmount = 0,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = 0,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 0,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = daysBeforeDeparture,
            OneTimeUseCreditTotalPaidAmount = 0,
            OriginalBookingValue = bookingValue,
        };

        CancellationToken cancellationToken = new CancellationToken();
        InfoCancellationResponse infoCancellationResponse = new InfoCancellationResponse()
        {
            CancellationFeeItem = new FeeItem() { Amount = cancelFeeAmount }
        };
        _infoCancellationServiceMock
            .Setup(x => x.GetInfoCancellationAsync(request))
            .ReturnsAsync(infoCancellationResponse);

        // Act
#if DEBUG
        Log(request, expectedResponse, this);
#endif
        var result = await _testee.GetCancellationRefundBreakdown(request, null, cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(expectedResponse);
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_TradeLedOutside28DaysWithMoreAmendmentFeeButAmendmentFeeDisabled_ShouldReturnNoRefund()
    {
        // Arrange
        decimal bookingValue = 1000;
        decimal cancelFeeAmount = 120;
        decimal amendmentFeeAmount = 900;
        int daysBeforeDeparture = 29;
        BookingResponse request = CreateBookingResponse(daysBeforeDeparture, 2, bookingValue, amendmentFeeAmount);

        BookingCancellationRefundBreakdown expectedResponse = new BookingCancellationRefundBreakdown()
        {
            CancelFeeAmount = Math.Min(bookingValue, cancelFeeAmount),
            AmendmentFeeAmount = 0,
            CashRefundAmount = 880,
            CreditRefundAmount = 0,
            OneTimeUseCreditKeptAmount = 0,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = 880,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 880,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = daysBeforeDeparture,
            OneTimeUseCreditTotalPaidAmount = 0,
            OriginalBookingValue = bookingValue,
        };

        CancellationToken cancellationToken = new CancellationToken();
        InfoCancellationResponse infoCancellationResponse = new InfoCancellationResponse()
        {
            CancellationFeeItem = new FeeItem() { Amount = cancelFeeAmount }
        };
        _infoCancellationServiceMock
            .Setup(x => x.GetInfoCancellationAsync(request))
            .ReturnsAsync(infoCancellationResponse);

        _settingsServiceMock.Setup(x => x.GetCancelCreditSettings())
            .ReturnsAsync(new CreditAndCashRefundSettings()
            {
                ApplyOneTimeUseCreditForXOrMoreDaysBeforeDeparture = 60,
                ShowOnlyOriginalPaymentMethodForXOrMoreDaysBeforeDeparture = 27,
                EnableAmendmentFee = false,
                EnableOneTimeUseCredit = true
            });

        // Act
#if DEBUG
        Log(request, expectedResponse, this);
#endif
        var result = await _testee.GetCancellationRefundBreakdown(request, null, cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(expectedResponse);
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    private static BookingResponse CreateBookingResponse(int daysBeforeDeparture, int guestAmount, decimal paymentReceived, decimal amendmentFeeAmount = 0)
    {
        var booking = new BookingResponse
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
                            DepDate = DateTime.UtcNow.AddDays(daysBeforeDeparture).AddHours(1),
                            Direction = Direction.Outbound
                        }
                    ]
                }
            },
            PaymentInfo = new PriceInfo
            {
                TotalPrice = 2 * paymentReceived, 
                PaymentReceived = paymentReceived, 
                PaymentHistory = new List<PaymentHistoryItem>().ToArray(),
            },
            Guests = new List<PersonWithDetails>(),
            IsExternalAgency = true
        };
        for (int i = 1; i <= guestAmount; i++)
        {
            booking.Guests.Add(new PersonWithDetails
            {
                Age = 30 + i, FirstName = "John{i}", LastName = "Doe{i}", Type = PersonType.Adult
            });
        }

        if (amendmentFeeAmount > 0)
        {
            booking.PaymentInfo.AmendmentFeesItems = new FeeItem[]
            {
                new FeeItem()
                {
                    Amount = amendmentFeeAmount
                }
            };
        }

        return booking;
    }

    [Fact]
    public async Task
        GetCancellationRefundBreakdown_ShouldSetCancelFeeAmountToTotalPrice_WhenFeeIsGreaterThanTotalPrice()
    {
        // Arrange
        decimal bookingCancellationFeeAmount = 600;
        decimal totalPrice = 500;
        BookingResponse request = CreateBookingResponse(30, 1, totalPrice);

        BookingCancellationRefundBreakdown expectedResponse = new BookingCancellationRefundBreakdown()
        {
            CancelFeeAmount = totalPrice,
            CashRefundAmount = 0,
            CreditRefundAmount = 0,
            OneTimeUseCreditKeptAmount = 0,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = 0,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 0,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = 30,
            OneTimeUseCreditTotalPaidAmount = 0,
            OriginalBookingValue = totalPrice,
        };

        CancellationToken cancellationToken = new CancellationToken();
        InfoCancellationResponse infoCancellationResponse = new InfoCancellationResponse()
        {
            CancellationFeeItem = new FeeItem() { Amount = bookingCancellationFeeAmount }
        };
        _infoCancellationServiceMock
            .Setup(x => x.GetInfoCancellationAsync(request))
            .ReturnsAsync(infoCancellationResponse);

        // Act
        var result = await _testee.GetCancellationRefundBreakdown(request, null, cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(expectedResponse);
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }
    
    [Fact]
    public async Task
        GetCancellationRefundBreakdown_ShouldCalculateFee_WhenFeeWas0FromAtcom()
    {
        // Arrange
        decimal bookingCancellationFeeAmount = 0;
        decimal totalPrice = 500;
        BookingResponse request = CreateBookingResponse(30, 2, totalPrice);

        BookingCancellationRefundBreakdown expectedResponse = new BookingCancellationRefundBreakdown()
        {
            CancelFeeAmount = 120,
            CashRefundAmount = 380,
            CreditRefundAmount = 0,
            OneTimeUseCreditKeptAmount = 0,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = 380,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 380,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = 30,
            OneTimeUseCreditTotalPaidAmount = 0,
            OriginalBookingValue = totalPrice,
        };

        CancellationToken cancellationToken = new CancellationToken();
        InfoCancellationResponse infoCancellationResponse = new InfoCancellationResponse()
        {
            CancellationFeeItem = new FeeItem() { Amount = bookingCancellationFeeAmount }
        };
        _infoCancellationServiceMock
            .Setup(x => x.GetInfoCancellationAsync(request))
            .ReturnsAsync(infoCancellationResponse);

        // Act
        var result = await _testee.GetCancellationRefundBreakdown(request, null, cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(expectedResponse);
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }
    
    [Fact]
    public async Task
        GetCancellationRefundBreakdown_WhenNoPaymentInfo_ShouldReturn0()
    {
        // Arrange
        var days = 62;
        var paymentAmount = 100;
        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new Transport()
                {
                    Routes = new List<Route>()
                    {
                        new Route()
                        {
                            DepDate = DateTime.UtcNow.AddDays(days).AddHours(1),
                            Direction = Direction.Outbound
                        }
                    },
                }
            },
            Guests = [new(), new()],
            IsExternalAgency = true
        };
        decimal fee = paymentAmount;
        BookingCancellationRefundBreakdown response = new BookingCancellationRefundBreakdown()
        {
            CancelFeeAmount = 0,
            AmendmentFeeAmount = 0,
            OneTimeUseCreditKeptAmount = 0,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = 0,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 0,
            CashRefundAmount = 0,
            CreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = days,
            OriginalBookingValue = 1000
        };
        CancellationToken cancellationToken = new CancellationToken();
        InfoCancellationResponse infoCancellationResponse = new InfoCancellationResponse()
        {
            CancellationFeeItem = new FeeItem() { Amount = fee, }
        };
        _infoCancellationServiceMock
            .Setup(x => x.GetInfoCancellationAsync(request))
            .ReturnsAsync(infoCancellationResponse);

        // Act
#if DEBUG
        Log(request, response, this);
#endif
        var result = await _testee.GetCancellationRefundBreakdown(request, null, cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(response);
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }
}