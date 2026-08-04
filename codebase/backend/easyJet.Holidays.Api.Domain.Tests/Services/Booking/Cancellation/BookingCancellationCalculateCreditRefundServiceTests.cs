using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Interfaces.Settings;
using easyJet.Holidays.Api.Domain.Services.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Settings;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using System.Collections.ObjectModel;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking.Cancellation;

public class BookingCancellationCalculateCreditRefundServiceTests : BaseCancellationTests
{
#pragma warning disable CA1805
    readonly CancellationToken _cancellationToken = default;
#pragma warning restore CA1805
    private readonly Mock<IApiSettingsService> _apiSettingsService = new Mock<IApiSettingsService>();

    private readonly ILogger<BookingCancellationCalculateCreditRefundService> _logger =
        Mock.Of<ILogger<BookingCancellationCalculateCreditRefundService>>();

    private readonly BookingCancellationCalculateCreditRefundService _testee;


    private const string PromotionStaffCreditIdent = "PromotionStaffCredit";
    private const string PromotionStaffCredit2324 = "PromotionStaffCredit2324";
    private const string PromotionStaffCredit2425 = "PromotionStaffCredit2425";
    private const string PromotionStaffCredit2526 = "PromotionStaffCredit2526";
    private const string PromoMarketing = "PromoMarketing";
    private const string PromoTesco = "PromoTesco";
    private const string GiftCard = "GiftCard";
    private const string Refund = "Refund";
    private const string Goodwill = "Goodwill";
    private const string Incentive = "Incentive";
    private const string OneTimeUse = "OneTimeUse";


    private readonly Dictionary<string, PaymentCodesSettings> _paymentCodes =
        new()
        {
            {
                PromotionStaffCreditIdent, new PaymentCodesSettings
                {
                    Reason = "Promotion - Staff Credit",
                    Issued = new PaymentTypeSettings { Code = "PSTI", Group = "CA" },
                    Redeemed = new PaymentTypeSettings { Code = "PSTR", Group = "CA" },
                    PriorityNumber = 1,
                    ExpirationDate = DateTime.UtcNow.AddDays(100),
                }
            },
            {
                PromotionStaffCredit2324, new PaymentCodesSettings
                {
                    Reason = "Promotion - Staff credit 23-24",
                    Issued = new PaymentTypeSettings { Code = "PSTJ", Group = "CA" },
                    Redeemed = new PaymentTypeSettings { Code = "PSTK", Group = "CA" },
                    PriorityNumber = 2,
                    ExpirationDate = DateTime.UtcNow.AddDays(100),
                }
            },
            {
                PromotionStaffCredit2425, new PaymentCodesSettings
                {
                    Reason = "Promotion - Staff credit 24-25",
                    Issued = new PaymentTypeSettings { Code = "PSTL", Group = "CA" },
                    Redeemed = new PaymentTypeSettings { Code = "PSTM", Group = "CA" },
                    PriorityNumber = 3,
                    ExpirationDate = DateTime.UtcNow.AddDays(100),
                }
            },
            {
                PromotionStaffCredit2526, new PaymentCodesSettings
                {
                    Reason = "Promotion - Staff credit 25-26",
                    Issued = new PaymentTypeSettings { Code = "PSTO", Group = "CA" },
                    Redeemed = new PaymentTypeSettings { Code = "PSTN", Group = "CA" },
                    PriorityNumber = 4,
                    ExpirationDate = DateTime.UtcNow.AddDays(100),
                }
            },
            {
                PromoMarketing, new PaymentCodesSettings
                {
                    Reason = "Promotion - Marketing",
                    Issued = new PaymentTypeSettings { Code = "PMKI", Group = "CA" },
                    Redeemed = new PaymentTypeSettings { Code = "PMKR", Group = "CA" },
                    PriorityNumber = 5,
                    ExpirationDate = DateTime.UtcNow.AddDays(100),
                }
            },
            {
                PromoTesco, new PaymentCodesSettings
                {
                    Reason = "Promotion - Tesco",
                    Issued = new PaymentTypeSettings { Code = "PTCI", Group = "CA" },
                    Redeemed = new PaymentTypeSettings { Code = "PTCR", Group = "CA" },
                    PriorityNumber = 6,
                    ExpirationDate = DateTime.UtcNow.AddDays(100),
                }
            },
            {
                GiftCard, new PaymentCodesSettings
                {
                    Reason = "giftcard",
                    Issued = new PaymentTypeSettings { Code = "GCI", Group = "CA" },
                    Redeemed = new PaymentTypeSettings { Code = "GCR", Group = "CA" },
                    PriorityNumber = 7,
                    ExpirationDate = DateTime.UtcNow.AddDays(100),
                }
            },
            {
                Refund, new PaymentCodesSettings
                {
                    Reason = "refund",
                    Issued = new PaymentTypeSettings { Code = "CI", Group = "CA" },
                    Redeemed = new PaymentTypeSettings { Code = "CR", Group = "CA" },
                    PriorityNumber = 8,
                    ExpirationDate = DateTime.UtcNow.AddDays(100),
                }
            },
            {
                Goodwill, new PaymentCodesSettings
                {
                    Reason = "goodwill",
                    Issued = new PaymentTypeSettings { Code = "GI", Group = "CA" },
                    Redeemed = new PaymentTypeSettings { Code = "GR", Group = "CA" },
                    PriorityNumber = 9,
                    ExpirationDate = DateTime.UtcNow.AddDays(100),
                }
            },
            {
                Incentive, new PaymentCodesSettings
                {
                    Reason = "incentive",
                    Issued = new PaymentTypeSettings { Code = "II", Group = "CA" },
                    Redeemed = new PaymentTypeSettings { Code = "IR", Group = "CA" },
                    PriorityNumber = 10,
                    ExpirationDate = DateTime.UtcNow.AddDays(100),
                }
            },
            {
                OneTimeUse, new PaymentCodesSettings
                {
                    Reason = "onetimeuse",
                    Issued = new PaymentTypeSettings { Code = "OTCI", Group = "CA" },
                    Redeemed = new PaymentTypeSettings { Code = "OTCR", Group = "CA" },
                    PriorityNumber = 11,
                    ExpirationDate = DateTime.UtcNow.AddDays(100),
                }
            }
        };

    public BookingCancellationCalculateCreditRefundServiceTests()
    {
        _testee = new BookingCancellationCalculateCreditRefundService(_apiSettingsService.Object, _logger);
    }

    [Theory]
    [InlineData(1000, 120)]
    [InlineData(880, 120)]
    [InlineData(760, 240)]
    public async Task CalculateCreditRefund_WhenCashAndOneTimeUseCreditOnly_ShouldReturnResult(decimal cashAmount,
        decimal oneTimeUseCreditAmount)
    {
        // Arrange
        var total = cashAmount + oneTimeUseCreditAmount;
        BookingResponse bookingResponse = new()
        {
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = total,
                PaymentHistory = new List<PaymentHistoryItem>()
                {
                    CashPayment(cashAmount), 
                    OneTimeUseCreditPayment(oneTimeUseCreditAmount, "one time use credit transaction id")
                }.ToArray()
            },
        };
        BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown = new()
        {
            CancelFeeAmount = 0,
            OneTimeUseCreditRefundAmount = oneTimeUseCreditAmount,
            TotalRefundAmount = total,
            OneTimeUseCreditKeptAmount = 0,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = cashAmount,
            CashRefundAmount = cashAmount,
            CreditRefundAmount = oneTimeUseCreditAmount,
            OriginalBookingValue = total,
        };
        var expectedResult = new BookingCancellationCreditRefundBreakdown() { OneTimeUse = oneTimeUseCreditAmount, OneTimeUseCreditStructure = new()
        {
            OneTimeUseCreditMadeOf = new ([new MadeOf("one time use credit transaction id" , oneTimeUseCreditAmount)])
        }};

        // Act
        BookingCancellationCreditRefundBreakdown result =
            await _testee.CalculateCreditRefund(bookingResponse, bookingCancellationRefundBreakdown,
                BookingCancellationRequestRefundOption.OriginalPayment, _cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(expectedResult);
    }

    [Theory]
    [InlineData(1000, 120)]
    [InlineData(880, 120)]
    [InlineData(760, 240)]
    public async Task CalculateCreditRefund_WhenCashAndGoodWillCreditOnly_ShouldReturnResult(decimal cashAmount,
        decimal goodWillCreditAmount)
    {
        // Arrange
        var total = cashAmount + goodWillCreditAmount;
        BookingResponse bookingResponse = new()
        {
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = total,
                PaymentHistory = new List<PaymentHistoryItem>()
                {
                    CashPayment(cashAmount), 
                    GoodWillPayment(goodWillCreditAmount/4, transNo: "goodwill transaction id 1"), 
                    GoodWillPayment(goodWillCreditAmount/4*3, transNo: "goodwill transaction id 2")
                }.ToArray()
            },
        };
        BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown = new()
        {
            CancelFeeAmount = 0,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = total,
            OneTimeUseCreditKeptAmount = 0,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = total,
            CashRefundAmount = cashAmount,
            CreditRefundAmount = goodWillCreditAmount,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = goodWillCreditAmount,
            OriginalBookingValue = total,
        };

        // Act
        BookingCancellationCreditRefundBreakdown result =
            await _testee.CalculateCreditRefund(bookingResponse, bookingCancellationRefundBreakdown,
                BookingCancellationRequestRefundOption.OriginalPayment, _cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(new BookingCancellationCreditRefundBreakdown()
        {
            OneTimeUse = 0, 
            Goodwill = goodWillCreditAmount, 
            GoodwillCreditMadeOf = new([new MadeOf("goodwill transaction id 1", goodWillCreditAmount/4),new MadeOf("goodwill transaction id 2", goodWillCreditAmount/4*3)])
        });
    }

    [Theory]
    [InlineData(1000, 120)]
    [InlineData(880, 120)]
    [InlineData(760, 240)]
    public async Task CalculateCreditRefund_WhenCashAndGiftCardCreditOnly_ShouldReturnResult(decimal cashAmount,
        decimal giftCardCreditAmount)
    {
        // Arrange
        var total = cashAmount + giftCardCreditAmount;
        BookingResponse bookingResponse = new()
        {
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = total,
                PaymentHistory = new List<PaymentHistoryItem>()
                {
                    CashPayment(cashAmount), 
                    GiftCardCreditPayment(giftCardCreditAmount, transNo: "gift card transaction id")
                }.ToArray()
            },
        };
        BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown = new()
        {
            CancelFeeAmount = 0,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = total,
            OneTimeUseCreditKeptAmount = 0,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = total,
            CashRefundAmount = cashAmount,
            CreditRefundAmount = giftCardCreditAmount,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = giftCardCreditAmount,
            OriginalBookingValue = total,
        };
        var expectedResult = new BookingCancellationCreditRefundBreakdown()
        {
            OneTimeUse = 0, 
            GiftCard = giftCardCreditAmount, 
            GiftCardCreditMadeOf = new([new MadeOf("gift card transaction id", giftCardCreditAmount)])
        };

        // Act
        BookingCancellationCreditRefundBreakdown result =
            await _testee.CalculateCreditRefund(bookingResponse, bookingCancellationRefundBreakdown,
                BookingCancellationRequestRefundOption.OriginalPayment, _cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(expectedResult);
    }

    [Theory]
    [InlineData(1000, 120)]
    [InlineData(880, 120)]
    [InlineData(760, 240)]
    public async Task CalculateCreditRefund_WhenCashAndPromoCreditOnly_ShouldReturnResult(decimal cashAmount,
        decimal promoCreditAmount)
    {
        // Arrange
        var total = cashAmount + promoCreditAmount;
        BookingResponse bookingResponse = new()
        {
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = total,
                PaymentHistory = new List<PaymentHistoryItem>()
                {
                    CashPayment(cashAmount), 
                    PromoCreditPayment(promoCreditAmount, transNo: "promo credit transaction id")
                }.ToArray()
            },
        };
        BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown = new()
        {
            CancelFeeAmount = 0,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = total,
            OneTimeUseCreditKeptAmount = 0,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = total,
            CashRefundAmount = cashAmount,
            CreditRefundAmount = promoCreditAmount,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = promoCreditAmount,
            OriginalBookingValue = total,
        };

        var refundPromoCreditCodeSettings = _paymentCodes[PromotionStaffCreditIdent];

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByPaymentCode(It.IsAny<string>()))
            .Returns(refundPromoCreditCodeSettings);

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByReason(It.IsAny<string>()))
            .Returns(refundPromoCreditCodeSettings);

        // Act
        BookingCancellationCreditRefundBreakdown result =
            await _testee.CalculateCreditRefund(bookingResponse, bookingCancellationRefundBreakdown,
                BookingCancellationRequestRefundOption.OriginalPayment, _cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(new BookingCancellationCreditRefundBreakdown()
        {
            OneTimeUse = 0,
            PromoBreakdownItems =
            [
                new BookingCancellationPromoRefundBreakdownItem()
                {
                    Amount = promoCreditAmount,
                    ExpirationDate = refundPromoCreditCodeSettings.ExpirationDate,
                    Reason = refundPromoCreditCodeSettings.Reason,
                    PromoId = 2,
                    MadeOf = [new MadeOfWithReason("promo credit transaction id", promoCreditAmount, refundPromoCreditCodeSettings.Reason)],
                }
            ]
        });
    }

    [Theory]
    [InlineData(1000, 120)]
    [InlineData(880, 120)]
    [InlineData(760, 240)]
    [InlineData(500, 0)]
    public async Task CalculateCreditRefund_WhenCashAndRefundCreditOnly_ShouldReturnResult(decimal cashAmount,
        decimal refundCreditAmount)
    {
        // Arrange
        var total = cashAmount + refundCreditAmount;
        BookingResponse bookingResponse = new()
        {
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = total,
                PaymentHistory = new List<PaymentHistoryItem>()
                {
                    CashPayment(cashAmount), 
                    RefundCreditPayment(refundCreditAmount, "refund credit transaction id")
                }.ToArray()
            },
        };
        BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown = new()
        {
            CancelFeeAmount = 0,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = total,
            OneTimeUseCreditKeptAmount = 0,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = total,
            CashRefundAmount = cashAmount,
            CreditRefundAmount = refundCreditAmount,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = refundCreditAmount,
            OriginalBookingValue = total,
        };

        // Act
        BookingCancellationCreditRefundBreakdown result =
            await _testee.CalculateCreditRefund(bookingResponse, bookingCancellationRefundBreakdown,
                BookingCancellationRequestRefundOption.OriginalPayment, _cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(new BookingCancellationCreditRefundBreakdown()
        {
            OneTimeUse = 0, 
            Refund = refundCreditAmount, 
            RefundCreditMadeOf = refundCreditAmount > 0 ? new([new MadeOf("refund credit transaction id", refundCreditAmount)]) : new ReadOnlyCollection<MadeOf>([])
        });
    }

    [Theory]
    [InlineData(1000, 120)]
    [InlineData(880, 120)]
    [InlineData(760, 240)]
    public async Task CalculateCreditRefund_WhenCashAndTescoClubCardOnly_ShouldReturnResult(decimal cashAmount,
        decimal tescoClubCardAmount)
    {
        // Arrange
        var total = cashAmount + tescoClubCardAmount;
        BookingResponse bookingResponse = new()
        {
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = total,
                PaymentHistory = new List<PaymentHistoryItem>()
                {
                    CashPayment(cashAmount), 
                    PromoCreditPayment(tescoClubCardAmount, transNo: "promo transaction id")
                }.ToArray()
            },
        };
        BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown = new()
        {
            CancelFeeAmount = 0,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = total,
            OneTimeUseCreditKeptAmount = 0,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = total,
            CashRefundAmount = cashAmount,
            CreditRefundAmount = tescoClubCardAmount,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = tescoClubCardAmount,
            OriginalBookingValue = total,
        };

        var refundPromoCreditCodeSettings = _paymentCodes[PromoTesco];

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByPaymentCode(It.IsAny<string>()))
            .Returns(refundPromoCreditCodeSettings);

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByReason(It.IsAny<string>()))
            .Returns(refundPromoCreditCodeSettings);

        // Act
        BookingCancellationCreditRefundBreakdown result =
            await _testee.CalculateCreditRefund(bookingResponse, bookingCancellationRefundBreakdown,
                BookingCancellationRequestRefundOption.OriginalPayment, _cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(new BookingCancellationCreditRefundBreakdown()
        {
            OneTimeUse = 0,
            PromoBreakdownItems =
            [
                new BookingCancellationPromoRefundBreakdownItem()
                {
                    Amount = tescoClubCardAmount,
                    ExpirationDate = refundPromoCreditCodeSettings.ExpirationDate,
                    Reason = refundPromoCreditCodeSettings.Reason,
                    PromoId = 2,
                    MadeOf = [new MadeOfWithReason("promo transaction id", tescoClubCardAmount, refundPromoCreditCodeSettings.Reason)],
                }
            ]
        });
    }

    [Theory]
    [InlineData(1000, 120, 2)]
    [InlineData(1000, 180, 2)]
    [InlineData(1000, 240, 2)]
    [InlineData(1000, 240, 3)]
    [InlineData(1000, 240, 4)]
    public async Task
        CalculateCreditRefund_WhenPaidByGoodWillCreditOnlyAndItIsMoreThen60DaysBeforeDeparture_ShouldReturnResult(
            decimal totalAmount,
            decimal goodWillCreditAmount, int passengersAmount)
    {
        // Arrange
        BookingResponse bookingResponse = new()
        {
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = totalAmount,
                PaymentHistory = new List<PaymentHistoryItem>() { GoodWillPayment(goodWillCreditAmount, transNo: "goodwill transaction id"), }
                    .ToArray()
            },
        };
        BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown = new()
        {
            CancelFeeAmount = 0,
            OneTimeUseCreditRefundAmount = passengersAmount * 60,
            TotalRefundAmount = goodWillCreditAmount,
            OneTimeUseCreditKeptAmount = 0,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = goodWillCreditAmount - passengersAmount * 60,
            CashRefundAmount = 0,
            CreditRefundAmount = goodWillCreditAmount,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = goodWillCreditAmount - passengersAmount * 60,
            OriginalBookingValue = totalAmount,
        };

        // Act
        BookingCancellationCreditRefundBreakdown result =
            await _testee.CalculateCreditRefund(bookingResponse, bookingCancellationRefundBreakdown,
                BookingCancellationRequestRefundOption.OriginalPayment, _cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(new BookingCancellationCreditRefundBreakdown()
        {
            OneTimeUse = passengersAmount * 60, 
            Goodwill = goodWillCreditAmount - passengersAmount * 60,
            GoodwillCreditMadeOf =  goodWillCreditAmount - passengersAmount * 60 > 0 ?
                new ([new MadeOf("goodwill transaction id", goodWillCreditAmount - passengersAmount * 60)])
                : new ([]),
            OneTimeUseCreditStructure = new OneTimeUseCreditStructure()
            {
                GoodwillCreditMadeOf = new([new MadeOf("goodwill transaction id", passengersAmount * 60)])
            }
        });
    }

    [Theory]
    [InlineData(1000, 120, 2)]
    [InlineData(1000, 180, 2)]
    [InlineData(1000, 240, 2)]
    [InlineData(1000, 240, 3)]
    [InlineData(1000, 240, 4)]
    public async Task CalculateCreditRefund_WhenPaidByRefundOnlyAndItIsMoreThen60DaysBeforeDeparture_ShouldReturnResult(
        decimal totalAmount,
        decimal refundAmount, int passengersAmount)
    {
        // Arrange
        BookingResponse bookingResponse = new()
        {
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = totalAmount,
                PaymentHistory = new List<PaymentHistoryItem>() { RefundCreditPayment(refundAmount, transNo: "refund transaction id"), }.ToArray()
            },
        };
        BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown = new()
        {
            CancelFeeAmount = 0,
            OneTimeUseCreditRefundAmount = passengersAmount * 60,
            TotalRefundAmount = refundAmount,
            OneTimeUseCreditKeptAmount = 0,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = refundAmount - passengersAmount * 60,
            CashRefundAmount = 0,
            CreditRefundAmount = refundAmount,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = refundAmount - passengersAmount * 60,
            OriginalBookingValue = totalAmount,
        };

        // Act
        BookingCancellationCreditRefundBreakdown result =
            await _testee.CalculateCreditRefund(bookingResponse, bookingCancellationRefundBreakdown,
                BookingCancellationRequestRefundOption.OriginalPayment, _cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(new BookingCancellationCreditRefundBreakdown()
        {
            OneTimeUse = passengersAmount * 60, 
            Refund = refundAmount - passengersAmount * 60,
            RefundCreditMadeOf = refundAmount - passengersAmount * 60 > 0 ?
                new ([new MadeOf("refund transaction id", refundAmount - passengersAmount * 60)])
                : new ([]),
            OneTimeUseCreditStructure = new OneTimeUseCreditStructure()
            {
                RefundCreditMadeOf = new([new MadeOf("refund transaction id", passengersAmount * 60)])
            }
        });
    }

    [Theory]
    [InlineData(1000, 120, 2)]
    [InlineData(1000, 180, 2)]
    [InlineData(1000, 240, 2)]
    [InlineData(1000, 240, 3)]
    [InlineData(1000, 240, 4)]
    [InlineData(1000, 580, 2)]
    public async Task
        CalculateCreditRefund_WhenPaidByGiftCardCreditOnlyAndItIsMoreThen60DaysBeforeDeparture_ShouldReturnResult(
            decimal totalAmount,
            decimal giftCardCreditAmount, int passengersAmount)
    {
        // Arrange
        BookingResponse bookingResponse = new()
        {
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = totalAmount,
                PaymentHistory = new List<PaymentHistoryItem>() { GiftCardCreditPayment(giftCardCreditAmount, transNo: "gift card transaction id"), }
                    .ToArray()
            },
        };
        var oneTimeUseCreditOnBooking = passengersAmount * 60;
        BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown = new()
        {
            CancelFeeAmount = 0,
            OneTimeUseCreditRefundAmount = oneTimeUseCreditOnBooking,
            TotalRefundAmount = giftCardCreditAmount,
            OneTimeUseCreditKeptAmount = 0,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount =
                decimal.Max(giftCardCreditAmount - oneTimeUseCreditOnBooking, 0),
            CashRefundAmount = 0,
            CreditRefundAmount = giftCardCreditAmount,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount =
                decimal.Max(giftCardCreditAmount - oneTimeUseCreditOnBooking, 0),
            OriginalBookingValue = totalAmount,
        };

        // Act
        BookingCancellationCreditRefundBreakdown result =
            await _testee.CalculateCreditRefund(bookingResponse, bookingCancellationRefundBreakdown,
                BookingCancellationRequestRefundOption.OriginalPayment, _cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(new BookingCancellationCreditRefundBreakdown()
        {
            OneTimeUse = passengersAmount * 60,
            GiftCard = giftCardCreditAmount - passengersAmount * 60,
            GiftCardCreditMadeOf = giftCardCreditAmount - passengersAmount * 60 > 0 ?
                new ([new MadeOf("gift card transaction id", giftCardCreditAmount - passengersAmount * 60)])
                : new ([]),
            OneTimeUseCreditStructure =
                new OneTimeUseCreditStructure()
                {
                    GiftCardCreditMadeOf = new ([new MadeOf("gift card transaction id", passengersAmount * 60)])
                }
        });
    }

    [Theory]
    [InlineData(1000, 120, 2)]
    [InlineData(1000, 180, 2)]
    [InlineData(1000, 240, 2)]
    [InlineData(1000, 240, 3)]
    [InlineData(1000, 240, 4)]
    public async Task
        CalculateCreditRefund_WhenPaidByTescoClubCardCreditOnlyAndItIsMoreThen60DaysBeforeDeparture_ShouldReturnResult(
            decimal totalAmount,
            decimal tescoClubCardCreditAmount, int passengersAmount)
    {
        // Arrange
        BookingResponse bookingResponse = new()
        {
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = totalAmount,
                PaymentHistory = new List<PaymentHistoryItem>()
                {
                    PromoCreditPayment(tescoClubCardCreditAmount, transNo: "tesco transaction id"),
                }.ToArray()
            },
        };
        BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown = new()
        {
            CancelFeeAmount = 0,
            OneTimeUseCreditRefundAmount = passengersAmount * 60,
            TotalRefundAmount = tescoClubCardCreditAmount,
            OneTimeUseCreditKeptAmount = 0,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = tescoClubCardCreditAmount - passengersAmount * 60,
            CashRefundAmount = 0,
            CreditRefundAmount = tescoClubCardCreditAmount,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount =
                tescoClubCardCreditAmount - passengersAmount * 60,
            OriginalBookingValue = totalAmount,
        };

        var refundPromoCreditCodeSettings = _paymentCodes[PromoTesco];

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByPaymentCode(It.IsAny<string>()))
            .Returns(refundPromoCreditCodeSettings);

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByReason(It.IsAny<string>()))
            .Returns(refundPromoCreditCodeSettings);

        // Act
        BookingCancellationCreditRefundBreakdown result =
            await _testee.CalculateCreditRefund(bookingResponse, bookingCancellationRefundBreakdown,
                BookingCancellationRequestRefundOption.OriginalPayment, _cancellationToken);

        // Assert

        List<BookingCancellationPromoRefundBreakdownItem> promoBreakdownItems =
        [
            new()
            {
                Amount = tescoClubCardCreditAmount - passengersAmount * 60,
                ExpirationDate = refundPromoCreditCodeSettings.ExpirationDate,
                Reason = refundPromoCreditCodeSettings.Reason,
                PromoId = 1,
                MadeOf = [new MadeOfWithReason("tesco transaction id", tescoClubCardCreditAmount - passengersAmount * 60, refundPromoCreditCodeSettings.Reason)]
            }
        ];

        result.Should().BeEquivalentTo(new BookingCancellationCreditRefundBreakdown()
        {
            OneTimeUse = passengersAmount * 60,
            PromoBreakdownItems =
                bookingCancellationRefundBreakdown.TotalRefundAmountExceptOneTimeUseCreditRefundAmount > 0
                    ? promoBreakdownItems
                    : new List<BookingCancellationPromoRefundBreakdownItem>(),
            OneTimeUseCreditStructure =
                new OneTimeUseCreditStructure()
                {
                    PromoCreditMadeOf = new ReadOnlyCollection<MadeOfWithReason>([new MadeOfWithReason($"tesco transaction id",passengersAmount * 60, refundPromoCreditCodeSettings.Reason)])
                }
        });
    }

    [Theory]
    [InlineData(1000, 120, 2)]
    [InlineData(1000, 180, 2)]
    [InlineData(1000, 240, 2)]
    [InlineData(1000, 240, 3)]
    [InlineData(1000, 240, 4)]
    public async Task
        CalculateCreditRefund_WhenPaidByPromoCreditOnlyAndItIsMoreThen60DaysBeforeDeparture_ShouldReturnResult(
            decimal totalAmount,
            decimal promoCreditAmount, int passengersAmount)
    {
        // Arrange
        BookingResponse bookingResponse = new()
        {
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = totalAmount,
                PaymentHistory = new List<PaymentHistoryItem>() { PromoCreditPayment(promoCreditAmount, transNo: "promo transaction id"), }
                    .ToArray()
            },
        };
        BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown = new()
        {
            CancelFeeAmount = 0,
            OneTimeUseCreditRefundAmount = passengersAmount * 60,
            TotalRefundAmount = promoCreditAmount,
            OneTimeUseCreditKeptAmount = 0,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = promoCreditAmount - passengersAmount * 60,
            CashRefundAmount = 0,
            CreditRefundAmount = promoCreditAmount,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = promoCreditAmount - passengersAmount * 60,
            OriginalBookingValue = totalAmount,
        };

        var refundPromoCreditCodeSettings = _paymentCodes[PromotionStaffCredit2324];

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByPaymentCode(It.IsAny<string>()))
            .Returns(refundPromoCreditCodeSettings);

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByReason(It.IsAny<string>()))
            .Returns(refundPromoCreditCodeSettings);

        // Act
        BookingCancellationCreditRefundBreakdown result =
            await _testee.CalculateCreditRefund(bookingResponse, bookingCancellationRefundBreakdown,
                BookingCancellationRequestRefundOption.OriginalPayment, _cancellationToken);

        // Assert
        List<BookingCancellationPromoRefundBreakdownItem> promoBreakdownItems =
        [
            new()
            {
                Amount = promoCreditAmount - passengersAmount * 60,
                ExpirationDate = refundPromoCreditCodeSettings.ExpirationDate,
                Reason = refundPromoCreditCodeSettings.Reason,
                PromoId = 1,
                MadeOf = [new MadeOfWithReason("promo transaction id", promoCreditAmount - passengersAmount * 60, refundPromoCreditCodeSettings.Reason)]
            }
        ];

        result.Should().BeEquivalentTo(new BookingCancellationCreditRefundBreakdown()
        {
            OneTimeUse = passengersAmount * 60,
            PromoBreakdownItems = promoCreditAmount - passengersAmount * 60 > 0
                ? promoBreakdownItems
                : new List<BookingCancellationPromoRefundBreakdownItem>(),
            OneTimeUseCreditStructure =
                new OneTimeUseCreditStructure()
                {
                    PromoCreditMadeOf = new ReadOnlyCollection<MadeOfWithReason>([new MadeOfWithReason($"promo transaction id",passengersAmount * 60, refundPromoCreditCodeSettings.Reason)])
                }
        });
    }

    [Theory]
    [InlineData(1000, 120, 120, 180)]
    public async Task CalculateCreditRefund_WhenCashTescoClubCardAndRefundCredit_ShouldReturnResult(decimal cashAmount,
        decimal tescoClubCardAmount, decimal refundCreditAmount, decimal feeAmount)
    {
        // Arrange
        var total = cashAmount + tescoClubCardAmount + refundCreditAmount + feeAmount;
        var totalRefund = total - feeAmount;
        BookingResponse bookingResponse = new()
        {
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = total,
                PaymentHistory = new List<PaymentHistoryItem>()
                {
                    CashPayment(cashAmount),
                    PromoCreditPayment(tescoClubCardAmount, transNo:"tesco club card transaction id"),
                    RefundCreditPayment(refundCreditAmount, transNo: "refund credit transaction id")
                }.ToArray()
            },
        };
        BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown = new()
        {
            CancelFeeAmount = feeAmount,
            OneTimeUseCreditRefundAmount = feeAmount,
            TotalRefundAmount = totalRefund - feeAmount,
            OneTimeUseCreditKeptAmount = 0,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = total - feeAmount,
            CashRefundAmount = cashAmount,
            CreditRefundAmount = tescoClubCardAmount + refundCreditAmount - feeAmount,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount =
                tescoClubCardAmount + refundCreditAmount - 180,
            OriginalBookingValue = total,
            DaysBeforeDeparture = 61
        };

        var refundPromoCreditCodeSettings = _paymentCodes[PromoTesco];

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByPaymentCode(It.IsAny<string>()))
            .Returns(refundPromoCreditCodeSettings);

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByReason(It.IsAny<string>()))
            .Returns(refundPromoCreditCodeSettings);

        // Act
        BookingCancellationCreditRefundBreakdown result =
            await _testee.CalculateCreditRefund(bookingResponse, bookingCancellationRefundBreakdown,
                BookingCancellationRequestRefundOption.OriginalPayment,
                _cancellationToken);

        // Assert
        var refundLeft = Math.Max(refundCreditAmount - feeAmount, 0);
        var feeLeft = Math.Max(feeAmount - refundCreditAmount, 0);
        var tescoClubCardAmountLeft = tescoClubCardAmount - feeLeft;
        result.Should().BeEquivalentTo(new BookingCancellationCreditRefundBreakdown()
        {
            OneTimeUse = feeAmount,
            PromoBreakdownItems =
            [
                new BookingCancellationPromoRefundBreakdownItem()
                {
                    Amount = tescoClubCardAmountLeft,
                    ExpirationDate = refundPromoCreditCodeSettings.ExpirationDate,
                    Reason = refundPromoCreditCodeSettings.Reason,
                    PromoId = 3,
                    MadeOf = [new MadeOfWithReason("tesco club card transaction id", tescoClubCardAmountLeft, refundPromoCreditCodeSettings.Reason)]
                }
            ],
            Refund = refundLeft,
            OneTimeUseCreditStructure =
                new OneTimeUseCreditStructure() { 
                    PromoCreditMadeOf = new ReadOnlyCollection<MadeOfWithReason>([new MadeOfWithReason("tesco club card transaction id", tescoClubCardAmount - feeLeft, refundPromoCreditCodeSettings.Reason)]),
                    RefundCreditMadeOf = new ReadOnlyCollection<MadeOf>([new MadeOf("refund credit transaction id", Math.Min(refundCreditAmount, feeAmount))])
                }
        });
    }


    [Fact]
    public async Task CalculateCreditRefund_ShouldReturnEmptyBreakdown_WhenTotalRefundAmountIsZero()
    {
        // Arrange
        var bookingResponse = new BookingResponse();
        var refundBreakdown =
            new BookingCancellationRefundBreakdown { TotalRefundAmount = 0, OriginalBookingValue = 0, };
        var refundOption = BookingCancellationRequestRefundOption.Credit;
        var cancellationToken = CancellationToken.None;

        // Act
        var result =
            await _testee.CalculateCreditRefund(bookingResponse, refundBreakdown, refundOption, cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(new BookingCancellationCreditRefundBreakdown());
    }

    [Fact]
    public async Task
        CalculateCreditRefund_ShouldReturnPromoBreakdownItems_WhenPromoCreditRefundAmountIsGreaterThanZero()
    {
        // Arrange
        var promoCreditAmount = 200m;
        var bookingResponse = new BookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                PaymentHistory =
                    new List<PaymentHistoryItem> { PromoCreditPayment(promoCreditAmount) }.ToArray()
            }
        };
        var refundBreakdown = new BookingCancellationRefundBreakdown
        {
            TotalRefundAmount = promoCreditAmount,
            CreditRefundAmount = promoCreditAmount,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = promoCreditAmount,
            OriginalBookingValue = promoCreditAmount,
        };

        var promoCreditCodeSettings = _paymentCodes[PromotionStaffCredit2324];
        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByPaymentCode(It.IsAny<string>()))
            .Returns(promoCreditCodeSettings);
        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByReason(It.IsAny<string>()))
            .Returns(promoCreditCodeSettings);

        // Act
        var result = await _testee.CalculateCreditRefund(bookingResponse, refundBreakdown,
            BookingCancellationRequestRefundOption.OriginalPayment, _cancellationToken);

        // Assert
        result.PromoBreakdownItems.Should().NotBeEmpty();
    }

    [Fact]
    public async Task CalculateCreditRefund_ShouldReturnEmptyPromoBreakdownItems_WhenNoPromoCreditsInPaymentHistory()
    {
        // Arrange
        var promoCreditAmount = 200m;
        var bookingResponse = new BookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                PaymentHistory = new List<PaymentHistoryItem> { CashPayment(1000m) }.ToArray()
            }
        };
        var refundBreakdown = new BookingCancellationRefundBreakdown
        {
            TotalRefundAmount = promoCreditAmount,
            CreditRefundAmount = promoCreditAmount,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = promoCreditAmount,
            OriginalBookingValue = promoCreditAmount,
        };

        // Act
        var result = await _testee.CalculateCreditRefund(bookingResponse, refundBreakdown,
            BookingCancellationRequestRefundOption.OriginalPayment, _cancellationToken);

        // Assert
        result.PromoBreakdownItems.Should().BeEmpty();
    }

    [Fact]
    public async Task CalculateCreditRefund_ShouldRefundInTheRightOrder_FullRefund()
    {
        // Arrange
        var singlePaymentAmount = 50;
        var promoPaymentHistoryItems = new List<PaymentHistoryItem>
        {
            PromoCreditPayment(singlePaymentAmount, PromotionStaffCredit2324),
            PromoCreditPayment(singlePaymentAmount, PromotionStaffCredit2425),
            PromoCreditPayment(singlePaymentAmount, PromotionStaffCredit2526),
            PromoCreditPayment(singlePaymentAmount, PromoMarketing),
            PromoCreditPayment(singlePaymentAmount, PromoTesco)
#pragma warning disable CA5394
        }.OrderBy(_ => Guid.NewGuid()).ToList();
#pragma warning restore CA5394

        var bookingResponse = new BookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                PaymentHistory = new[]
                {
                    GoodWillPayment(singlePaymentAmount), RefundCreditPayment(singlePaymentAmount),
                    OneTimeUseCreditPayment(singlePaymentAmount), GiftCardCreditPayment(singlePaymentAmount)
                }.Concat(promoPaymentHistoryItems).ToArray()
            }
        };

        var totalRefundAmount = bookingResponse.PaymentInfo.PaymentHistory.Length * singlePaymentAmount;

        var refundBreakdown = new BookingCancellationRefundBreakdown
        {
            TotalRefundAmount = totalRefundAmount,
            CreditRefundAmount = totalRefundAmount,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = totalRefundAmount - singlePaymentAmount,
            OriginalBookingValue = 5 * singlePaymentAmount,
        };

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByPaymentCode(It.IsAny<string>()))
            .Returns((string paymentCode) => _paymentCodes[paymentCode]);

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByReason(It.IsAny<string>()))
            .Returns((string reason) =>
            {
                var setting = _paymentCodes.Values.FirstOrDefault(i => i.Reason == reason);
                if (setting == null)
                    throw new ApiException(ApiExceptionCodes.BookingCreditInconsistentError);
                return setting;
            });

        // Act
        var result = await _testee.CalculateCreditRefund(bookingResponse, refundBreakdown,
            BookingCancellationRequestRefundOption.OriginalPayment, _cancellationToken);

        // Assert
        result.PromoBreakdownItems.Should().NotBeEmpty();
        result.PromoBreakdownItems.ElementAt(0).Reason.Should().Be(_paymentCodes[PromotionStaffCredit2324].Reason);
        result.PromoBreakdownItems.ElementAt(1).Reason.Should().Be(_paymentCodes[PromotionStaffCredit2425].Reason);
        result.PromoBreakdownItems.ElementAt(2).Reason.Should().Be(_paymentCodes[PromotionStaffCredit2526].Reason);
        result.PromoBreakdownItems.ElementAt(3).Reason.Should().Be(_paymentCodes[PromoMarketing].Reason);
        result.PromoBreakdownItems.ElementAt(4).Reason.Should().Be(_paymentCodes[PromoTesco].Reason);
    }

    [Fact]
    public async Task CalculateCreditRefund_ShouldRefundInTheRightOrder_25PercentRefund()
    {
        // Arrange
        var singlePaymentAmount = 50;
        var promoPaymentHistoryItems = new List<PaymentHistoryItem>
        {
            PromoCreditPayment(singlePaymentAmount, PromotionStaffCredit2324),
            PromoCreditPayment(singlePaymentAmount, PromotionStaffCredit2425),
            PromoCreditPayment(singlePaymentAmount, PromotionStaffCredit2526),
            PromoCreditPayment(singlePaymentAmount, PromoMarketing),
            PromoCreditPayment(singlePaymentAmount, PromoTesco)
        }.OrderBy(_ => Guid.NewGuid()).ToList();

        var bookingResponse = new BookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                PaymentHistory = new[]
                {
                    GoodWillPayment(singlePaymentAmount), RefundCreditPayment(singlePaymentAmount),
                    OneTimeUseCreditPayment(singlePaymentAmount), GiftCardCreditPayment(singlePaymentAmount)
                }.Concat(promoPaymentHistoryItems).ToArray()
            }
        };

        var total = (bookingResponse.PaymentInfo.PaymentHistory.Length) * singlePaymentAmount;
        var totalRefundAmount = total * 0.25m;
        var refundBreakdown = new BookingCancellationRefundBreakdown
        {
            TotalRefundAmount = totalRefundAmount,
            CreditRefundAmount = totalRefundAmount,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = totalRefundAmount,
            OneTimeUseCreditRefundAmount = 0,
            OneTimeUseCreditKeptAmount = 0,
            OriginalBookingValue = 1000,
        };

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByPaymentCode(It.IsAny<string>()))
            .Returns((string paymentCode) => _paymentCodes[paymentCode]);

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByReason(It.IsAny<string>()))
            .Returns((string reason) =>
            {
                var setting = _paymentCodes.Values.FirstOrDefault(i => i.Reason == reason);
                if (setting == null)
                    throw new ApiException(ApiExceptionCodes.BookingCreditInconsistentError);
                return setting;
            });

        // Act
        var result = await _testee.CalculateCreditRefund(bookingResponse, refundBreakdown,
            BookingCancellationRequestRefundOption.OriginalPayment, _cancellationToken);

        // Assert
        result.PromoBreakdownItems.Should().NotBeEmpty();
        result.PromoBreakdownItems.Count.Should().Be(3);
        result.PromoBreakdownItems.ElementAt(0).Reason.Should().Be(_paymentCodes[PromotionStaffCredit2324].Reason);
        result.PromoBreakdownItems.ElementAt(0).Amount.Should().Be(50);
        result.PromoBreakdownItems.ElementAt(1).Reason.Should().Be(_paymentCodes[PromotionStaffCredit2425].Reason);
        result.PromoBreakdownItems.ElementAt(1).Amount.Should().Be(50);
        result.PromoBreakdownItems.ElementAt(2).Reason.Should().Be(_paymentCodes[PromotionStaffCredit2526].Reason);
        result.PromoBreakdownItems.ElementAt(2).Amount.Should().Be(12.5m);
    }

    [Fact]
    public async Task CalculateCreditRefund_ShouldRefundInTheRightOrder_33PercentRefund()
    {
        // Arrange
        var singlePaymentAmount = 50;
        var promoPaymentHistoryItems = new List<PaymentHistoryItem>
        {
            PromoCreditPayment(singlePaymentAmount, PromotionStaffCredit2324),
            PromoCreditPayment(singlePaymentAmount, PromotionStaffCredit2425),
            PromoCreditPayment(singlePaymentAmount, PromotionStaffCredit2526),
            PromoCreditPayment(singlePaymentAmount, PromoMarketing),
            PromoCreditPayment(singlePaymentAmount, PromoTesco)
        }.OrderBy(_ => Guid.NewGuid()).ToList();

        var bookingResponse = new BookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                PaymentHistory = new[]
                {
                    GoodWillPayment(singlePaymentAmount), RefundCreditPayment(singlePaymentAmount),
                    OneTimeUseCreditPayment(singlePaymentAmount), GiftCardCreditPayment(singlePaymentAmount)
                }.Concat(promoPaymentHistoryItems).ToArray()
            }
        };

        var total = (bookingResponse.PaymentInfo.PaymentHistory.Length) * singlePaymentAmount;
        var totalRefundAmount = total * 0.33m;
        var refundBreakdown = new BookingCancellationRefundBreakdown
        {
            TotalRefundAmount = totalRefundAmount,
            CreditRefundAmount = totalRefundAmount,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = totalRefundAmount,
            OneTimeUseCreditRefundAmount = 0,
            OneTimeUseCreditKeptAmount = 0,
            OriginalBookingValue = 1000,
        };

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByPaymentCode(It.IsAny<string>()))
            .Returns((string paymentCode) => _paymentCodes[paymentCode]);

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByReason(It.IsAny<string>()))
            .Returns((string reason) =>
            {
                var setting = _paymentCodes.Values.FirstOrDefault(i => i.Reason == reason);
                if (setting == null)
                    throw new ApiException(ApiExceptionCodes.BookingCreditInconsistentError);
                return setting;
            });

        // Act
        var result = await _testee.CalculateCreditRefund(bookingResponse, refundBreakdown,
            BookingCancellationRequestRefundOption.OriginalPayment, _cancellationToken);

        // Assert
        result.PromoBreakdownItems.Should().NotBeEmpty();
        result.PromoBreakdownItems.Count.Should().Be(3);
        result.PromoBreakdownItems.ElementAt(0).Reason.Should().Be(_paymentCodes[PromotionStaffCredit2324].Reason);
        result.PromoBreakdownItems.ElementAt(0).Amount.Should().Be(50);
        result.PromoBreakdownItems.ElementAt(1).Reason.Should().Be(_paymentCodes[PromotionStaffCredit2425].Reason);
        result.PromoBreakdownItems.ElementAt(1).Amount.Should().Be(50);
        result.PromoBreakdownItems.ElementAt(2).Reason.Should().Be(_paymentCodes[PromotionStaffCredit2526].Reason);
        result.PromoBreakdownItems.ElementAt(2).Amount.Should().Be(48.5m);
    }

    [Fact]
    public async Task CalculateCreditRefund_ShouldRefundInTheRightOrder_75PercentRefund()
    {
        // Arrange
        var singlePaymentAmount = 50;
        var promoPaymentHistoryItems = new List<PaymentHistoryItem>
        {
            PromoCreditPayment(singlePaymentAmount, PromotionStaffCredit2324),
            PromoCreditPayment(singlePaymentAmount, PromotionStaffCredit2425),
            PromoCreditPayment(singlePaymentAmount, PromotionStaffCredit2526),
            PromoCreditPayment(singlePaymentAmount, PromoMarketing),
            PromoCreditPayment(singlePaymentAmount, PromoTesco)
        }.OrderBy(_ => Guid.NewGuid()).ToList();

        var bookingResponse = new BookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                PaymentHistory = new[]
                {
                    GoodWillPayment(singlePaymentAmount), RefundCreditPayment(singlePaymentAmount),
                    OneTimeUseCreditPayment(singlePaymentAmount), GiftCardCreditPayment(singlePaymentAmount)
                }.Concat(promoPaymentHistoryItems).ToArray()
            }
        };

        var total = (bookingResponse.PaymentInfo.PaymentHistory.Length) * singlePaymentAmount;
        var totalRefundAmount = total * 0.75m;
        var refundBreakdown = new BookingCancellationRefundBreakdown
        {
            TotalRefundAmount = totalRefundAmount,
            CreditRefundAmount = totalRefundAmount,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = totalRefundAmount,
            OneTimeUseCreditRefundAmount = 0,
            OneTimeUseCreditKeptAmount = 0,
            OriginalBookingValue = total,
        };

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByPaymentCode(It.IsAny<string>()))
            .Returns((string paymentCode) => _paymentCodes[paymentCode]);

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByReason(It.IsAny<string>()))
            .Returns((string reason) =>
            {
                var setting = _paymentCodes.Values.FirstOrDefault(i => i.Reason == reason);
                if (setting == null)
                    throw new ApiException(ApiExceptionCodes.BookingCreditInconsistentError);
                return setting;
            });

        // Act
        var result = await _testee.CalculateCreditRefund(bookingResponse, refundBreakdown,
            BookingCancellationRequestRefundOption.OriginalPayment, _cancellationToken);

        // Assert
        result.PromoBreakdownItems.Should().NotBeEmpty();
        result.PromoBreakdownItems.Count.Should().Be(5);
        result.PromoBreakdownItems.ElementAt(0).Reason.Should().Be(_paymentCodes[PromotionStaffCredit2324].Reason);
        result.PromoBreakdownItems.ElementAt(0).Amount.Should().Be(50);
        result.PromoBreakdownItems.ElementAt(1).Reason.Should().Be(_paymentCodes[PromotionStaffCredit2425].Reason);
        result.PromoBreakdownItems.ElementAt(1).Amount.Should().Be(50);
        result.PromoBreakdownItems.ElementAt(2).Reason.Should().Be(_paymentCodes[PromotionStaffCredit2526].Reason);
        result.PromoBreakdownItems.ElementAt(2).Amount.Should().Be(50);
        result.PromoBreakdownItems.ElementAt(3).Reason.Should().Be(_paymentCodes[PromoMarketing].Reason);
        result.PromoBreakdownItems.ElementAt(3).Amount.Should().Be(50);
        result.PromoBreakdownItems.ElementAt(4).Reason.Should().Be(_paymentCodes[PromoTesco].Reason);
        result.PromoBreakdownItems.ElementAt(4).Amount.Should().Be(50);
        result.GiftCard.Should().Be(50);
        result.Refund.Should().Be(37.5m);
    }

    [Fact]
    public async Task CalculateCreditRefund_ShouldRefundInTheRightOrder_OriginalPayment()
    {
        // Arrange
        var promoPaymentHistoryItems = new List<PaymentHistoryItem>
        {
            PromoCreditPayment(60, PromotionStaffCredit2425), PromoCreditPayment(50, PromotionStaffCredit2526),
        }.OrderBy(_ => Guid.NewGuid()).ToList();

        var bookingResponse = new BookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                PaymentHistory = new[] { OneTimeUseCreditPayment(40), CashPayment(70) }
                    .Concat(promoPaymentHistoryItems).ToArray()
            }
        };

        var refundBreakdown = new BookingCancellationRefundBreakdown
        {
            TotalRefundAmount = 100,
            CreditRefundAmount = 30,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 30,
            OneTimeUseCreditRefundAmount = 0,
            OneTimeUseCreditKeptAmount = 40,
            CashRefundAmount = 70,
            CancelFeeAmount = 120,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 100,
            TransferredCashPaymentToRefundCreditAmount = 0,
            OriginalBookingValue = 1000,
        };

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByPaymentCode(It.IsAny<string>()))
            .Returns((string paymentCode) => _paymentCodes[paymentCode]);

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByReason(It.IsAny<string>()))
            .Returns((string reason) =>
            {
                var setting = _paymentCodes.Values.FirstOrDefault(i => i.Reason == reason);
                if (setting == null)
                    throw new ApiException(ApiExceptionCodes.BookingCreditInconsistentError);
                return setting;
            });

        // Act
        var result = await _testee.CalculateCreditRefund(bookingResponse, refundBreakdown,
            BookingCancellationRequestRefundOption.OriginalPayment, _cancellationToken);

        // Assert
        result.PromoBreakdownItems.Should().NotBeEmpty();
        result.PromoBreakdownItems.Count.Should().Be(1);
        result.PromoBreakdownItems.ElementAt(0).Reason.Should().Be(_paymentCodes[PromotionStaffCredit2425].Reason);
        result.PromoBreakdownItems.ElementAt(0).Amount.Should().Be(30);
    }
    
    [Fact]
    public void RemainingOneTimeUseCreditMadeOfTransNo_ReturnsEmptyList_WhenNoOneTimeUseCreditsInBooking()
    {
        // Arrange
        var bookingResponse = new BookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                PaymentHistory = new List<PaymentHistoryItem>
                {
                    CashPayment(100m),
                    RefundCreditPayment(200m)
                }.ToArray()
            }
        };
        var daysBeforeDeparture = 63;
        var originalCancelFeeAmount = 50m;
    
        // Act
        var result = BookingCancellationCalculateCreditRefundService.GetRemainingOneTimeUseCreditMadeOfTransNo(
            bookingResponse, daysBeforeDeparture, originalCancelFeeAmount, 0, 0);
    
        // Assert
        result.Should().BeEmpty();
    }
    
    [Fact]
    public void RemainingOneTimeUseCreditMadeOfTransNo_ReturnsAllTransactionIds_WhenFeeToRetainIsZero()
    {
        // Arrange
        var bookingResponse = new BookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                PaymentHistory = new List<PaymentHistoryItem>
                {
                    OneTimeUseCreditPayment(100m, "OTU1"),
                    OneTimeUseCreditPayment(50m, "OTU2")
                }.ToArray()
            }
        };
        var daysBeforeDeparture = 90; // More than 60 days
        var originalCancelFeeAmount = 0m;
    
        // Act
        var result = BookingCancellationCalculateCreditRefundService.GetRemainingOneTimeUseCreditMadeOfTransNo(
            bookingResponse, daysBeforeDeparture, originalCancelFeeAmount, 0, 0);
    
        // Assert
        result.Should().BeEquivalentTo([ new MadeOf("OTU1", 100), new MadeOf("OTU2", 50)] );
    }
    
    [Fact]
    public void RemainingOneTimeUseCreditMadeOfTransNo_ExcludesTransactions_WhenFeeToRetainExceedsCreditAmounts()
    {
        // Arrange
        var bookingResponse = new BookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                PaymentHistory = new List<PaymentHistoryItem>
                {
                    OneTimeUseCreditPayment(30m, "OTU1"),
                    OneTimeUseCreditPayment(20m, "OTU2")
                }.ToArray()
            }
        };
        var daysBeforeDeparture = 63;
        var originalCancelFeeAmount = 100m;
    
        // Act
        var result = BookingCancellationCalculateCreditRefundService.GetRemainingOneTimeUseCreditMadeOfTransNo(
            bookingResponse, daysBeforeDeparture, originalCancelFeeAmount, 0, 0);
    
        // Assert
        result.Should().BeEmpty();
    }
    
    [Fact]
    public void RemainingOneTimeUseCreditMadeOfTransNo_ReturnsPartialTransactionIds_WhenFeeToRetainPartiallyCoversCredits()
    {
        // Arrange
        var bookingResponse = new BookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                PaymentHistory = new List<PaymentHistoryItem>
                {
                    OneTimeUseCreditPayment(50m, "OTU1"),
                    OneTimeUseCreditPayment(100m, "OTU2")
                }.ToArray()
            }
        };
        var daysBeforeDeparture = 63;
        var originalCancelFeeAmount = 70m;
    
        // Act
        var result = BookingCancellationCalculateCreditRefundService.GetRemainingOneTimeUseCreditMadeOfTransNo(
            bookingResponse, daysBeforeDeparture, originalCancelFeeAmount, 0, 0);
    
        // Assert
        result.Should().BeEquivalentTo([ new MadeOf("OTU2", 80) ]);
    }
    
    [Fact]
    public void RemainingOneTimeUseCreditMadeOfTransNo_ReturnsAllTransactionIds_WhenFeeToRetainIsLessThanTotalCredits()
    {
        // Arrange
        var bookingResponse = new BookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                PaymentHistory = new List<PaymentHistoryItem>
                {
                    OneTimeUseCreditPayment(50m, "OTU1"),
                    OneTimeUseCreditPayment(100m, "OTU2")
                }.ToArray()
            }
        };
        var daysBeforeDeparture = 63; 
        var originalCancelFeeAmount = 30m;
    
        // Act
        var result = BookingCancellationCalculateCreditRefundService.GetRemainingOneTimeUseCreditMadeOfTransNo(
            bookingResponse, daysBeforeDeparture, originalCancelFeeAmount, 0, 0);
    
        // Assert
        result.Should().BeEquivalentTo([new MadeOf("OTU1", 20), new MadeOf("OTU2", 100) ]);
    }
    
    [Fact]
    public void RemainingOneTimeUseCreditMadeOfTransNo_ReturnsAllTransactionIds_WhenUnder60DaysBeforeDepartureFeeToRetainIsLessThanTotalCredits()
    {
        // Arrange
        var bookingResponse = new BookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                PaymentHistory = new List<PaymentHistoryItem>
                {
                    OneTimeUseCreditPayment(50m, "OTU1"),
                    OneTimeUseCreditPayment(100m, "OTU2")
                }.ToArray()
            }
        };
        var daysBeforeDeparture = 63; 
        var originalCancelFeeAmount = 200m;
    
        // Act
        var result = BookingCancellationCalculateCreditRefundService.GetRemainingOneTimeUseCreditMadeOfTransNo(
            bookingResponse, daysBeforeDeparture, originalCancelFeeAmount, 0, 0);
    
        // Assert
        result.Should().BeEquivalentTo(new List<MadeOf>());
    }
}