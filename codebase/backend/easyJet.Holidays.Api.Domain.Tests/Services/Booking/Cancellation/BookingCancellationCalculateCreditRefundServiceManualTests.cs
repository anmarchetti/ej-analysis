using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Payment;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.Settings;
using easyJet.Holidays.Api.Domain.Services.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.BreakdownStrategies;
using easyJet.Holidays.Api.Domain.Settings;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using System.Collections.ObjectModel;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking.Cancellation;

public class BookingCancellationCalculateCreditRefundServiceManualTests : BaseCancellationTests
{
    readonly CancellationToken _cancellationToken = CancellationToken.None;
    private readonly Mock<IApiSettingsService> _apiSettingsService = new Mock<IApiSettingsService>();

    private readonly ILogger<BookingCancellationCalculateCreditRefundService> _logger =
        Mock.Of<ILogger<BookingCancellationCalculateCreditRefundService>>();

    private readonly BookingCancellationCalculateCreditRefundService
        _sutBookingCancellationCalculateCreditRefundService;

    private readonly CustomerLedBreakdownStrategy _sutCustomerLedBreakdownStrategy;
    private readonly EasyJetLedBreakdownStrategy _sutEasyJetLedBreakdownStrategy;
    private readonly Mock<IInfoCancellationService> _infoCancellationServiceMock = new Mock<IInfoCancellationService>();
    private readonly Mock<ISettingsService> _settingsServiceMock = new Mock<ISettingsService>();

    private readonly Mock<IBookingCancellationCreditRulesEngine> _bookingCancellationRulesEngineMock =
        new Mock<IBookingCancellationCreditRulesEngine>();

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


    private static readonly Dictionary<string, PaymentCodesSettings> PaymentCodes =
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

    public BookingCancellationCalculateCreditRefundServiceManualTests()
    {
        _sutBookingCancellationCalculateCreditRefundService =
            new BookingCancellationCalculateCreditRefundService(_apiSettingsService.Object, _logger);

        _settingsServiceMock.Setup(x => x.GetCancelCreditSettings())
            .ReturnsAsync(new CreditAndCashRefundSettings()
            {
                ApplyOneTimeUseCreditForXOrMoreDaysBeforeDeparture = 60,
                ShowOnlyOriginalPaymentMethodForXOrMoreDaysBeforeDeparture = 27,
                EnableAmendmentFee = true,
                EnableOneTimeUseCredit = true,
            });
        Mock<IFeeCalculator> feeCalculatorMock = new ();
        Mock<IOptions<AtcomSettings>> atcomSettings = new();
        atcomSettings.SetupGet(x => x.Value).Returns(new AtcomSettings()
        {
            BookingStatus = new BookingStatus() { Booking = "BOOKING", Canceled = "CANCELED" }
        });

        _sutCustomerLedBreakdownStrategy = new CustomerLedBreakdownStrategy(_infoCancellationServiceMock.Object,
            _settingsServiceMock.Object, _bookingCancellationRulesEngineMock.Object, feeCalculatorMock.Object);

        _sutEasyJetLedBreakdownStrategy = new EasyJetLedBreakdownStrategy(_infoCancellationServiceMock.Object, feeCalculatorMock.Object, atcomSettings.Object);
    }
    
    #region CustomerLed
    [Fact]
    public async Task CalculateCreditRefund_RefundInBookingWithTwoPaymentsOfTheSamePromoCashAndWithTwoOneTimeUse_ShouldReturnResult()
    {
        BookingResponse bookingResponse = new()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new()
                {
                    Routes =
                    [
                        new ()
                        {
                            DepDate = DateTime.UtcNow.AddDays(82), Direction = Direction.Outbound
                        }
                    ],
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 2465.68m,
                PaymentHistory = new[]
                {
                    CashPayment(120m),
                    OneTimeUseCreditPayment(15m, transNo: "onetimeuse transaction id 1"),
                    OneTimeUseCreditPayment(15m, transNo: "onetimeuse transaction id 2"),
                    PromoCreditPayment(23.98m, PromoMarketing, transNo: "promo transaction id 1"),
                    CashPayment(104.10m),
                    PromoCreditPayment(30m, PromoMarketing, transNo: "promo transaction id 2"),
                }
            },
            Guests = []
        };

        for (int i = 0; i < 2; i++)
        {
            bookingResponse.Guests.Add(
                new PersonWithDetails()
                {
                    Age = 20 + i,
                    FirstName = $"TestFirstName{i}",
                    LastName = $"TestLastName{i}",
                    Type = PersonType.Adult
                });
        }

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByPaymentCode(It.IsAny<string>()))
            .Returns((string paymentCode) => PaymentCodes[paymentCode]);

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByReason(It.IsAny<string>()))
            .Returns((string reason) =>
            {
                var setting = PaymentCodes.Values.FirstOrDefault(i => i.Reason == reason);
                if (setting == null)
                    throw new ApiException(ApiExceptionCodes.BookingCreditInconsistentError);
                return setting;
            });

        var feeAmount = 120;
        InfoCancellationResponse infoCancellationResponse = new()
        {
            CancellationFeeItem = new FeeItem() { Amount = feeAmount }
        };
        _infoCancellationServiceMock
            .Setup(x => x.GetInfoCancellationAsync(It.IsAny<BookingResponse>()))
            .ReturnsAsync(infoCancellationResponse);

        var refundOption = BookingCancellationRequestRefundOption.Credit;

        // Act
        var bookingCancellationRefundBreakdown = await _sutCustomerLedBreakdownStrategy.GetCancellationRefundBreakdown(bookingResponse, null, _cancellationToken);
        var bookingCancellationCreditRefundBreakdown = await _sutBookingCancellationCalculateCreditRefundService.CalculateCreditRefund(bookingResponse, bookingCancellationRefundBreakdown, refundOption, _cancellationToken);

        // Assert
        bookingCancellationCreditRefundBreakdown.Should().BeEquivalentTo(new BookingCancellationCreditRefundBreakdown()
        {
            OneTimeUse = 90,
            Goodwill = 0,
            GiftCard = 0,
            Refund = 188.08m,
            PromoBreakdownItems = [],
            OneTimeUseCreditStructure = new OneTimeUseCreditStructure()
            {
                PromoCreditMadeOf =
                    new ReadOnlyCollection<MadeOfWithReason>([
                        new MadeOfWithReason("promo transaction id 1", 23.98m,
                            PaymentCodes[PromoMarketing].Reason),
                        new MadeOfWithReason("promo transaction id 2", 30m,
                            PaymentCodes[PromoMarketing].Reason),
                    ]),
            }
        });
    }

    [Fact]
    public async Task CalculateCreditRefund_Ser684_ShouldReturnResult()
    {
        BookingResponse bookingResponse = new()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new ()
                {
                    Routes =
                    [
                        new ()
                        {
                            DepDate = DateTime.UtcNow.AddDays(82), Direction = Direction.Outbound
                        }
                    ],
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 4339m,
                PaymentHistory = new[]
                {
                    PromoCreditPayment(100m, PromoTesco, transNo: "promo transaction id 1"),
                    PromoCreditPayment(180m, PromoTesco, transNo: "promo transaction id 2"),
                    GoodWillPayment(180m, transNo: "goodwill transaction id 1"),
                    GoodWillPayment(180m, transNo: "goodwill transaction id 2"),
                    RefundCreditPayment(1761.76m, transNo: "refund credit transaction id 1"),
                    RefundCreditPayment(1937.24m, transNo: "refund credit transaction id 2"),
                }
            },
            Guests = []
        };

        for (int i = 0; i < 2; i++)
        {
            bookingResponse.Guests.Add(
                new PersonWithDetails()
                {
                    Age = 20 + i,
                    FirstName = $"TestFirstName{i}",
                    LastName = $"TestLastName{i}",
                    Type = PersonType.Adult
                });
        }

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByPaymentCode(It.IsAny<string>()))
            .Returns((string paymentCode) => PaymentCodes[paymentCode]);

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByReason(It.IsAny<string>()))
            .Returns((string reason) =>
            {
                var setting = PaymentCodes.Values.FirstOrDefault(i => i.Reason == reason);
                if (setting == null)
                    throw new ApiException(ApiExceptionCodes.BookingCreditInconsistentError);
                return setting;
            });

        var feeAmount = 360;
        InfoCancellationResponse infoCancellationResponse = new()
        {
            CancellationFeeItem = new FeeItem() { Amount = feeAmount }
        };
        _infoCancellationServiceMock
            .Setup(x => x.GetInfoCancellationAsync(It.IsAny<BookingResponse>()))
            .ReturnsAsync(infoCancellationResponse);

        var refundOption = BookingCancellationRequestRefundOption.Credit;

        // Act
        var bookingCancellationRefundBreakdown = await _sutCustomerLedBreakdownStrategy.GetCancellationRefundBreakdown(bookingResponse, null, _cancellationToken);
        var bookingCancellationCreditRefundBreakdown = await _sutBookingCancellationCalculateCreditRefundService.CalculateCreditRefund(bookingResponse, bookingCancellationRefundBreakdown, refundOption, _cancellationToken);

        // Assert
        bookingCancellationCreditRefundBreakdown.Should().BeEquivalentTo(new BookingCancellationCreditRefundBreakdown()
        {
            OneTimeUse = 360,
            Goodwill = 0,
            GiftCard = 0,
            Refund = 3699.00m,
            PromoBreakdownItems = new List<BookingCancellationPromoRefundBreakdownItem>()
            {
                new BookingCancellationPromoRefundBreakdownItem()
                {
                    Amount = 280,
                    PromoId = 6,
                    Reason = "Promotion - Tesco",
                    ExpirationDate = bookingCancellationCreditRefundBreakdown.PromoBreakdownItems.First().ExpirationDate,
                    MadeOf = new List<MadeOfWithReason>()
                    {
                        new MadeOfWithReason("promo transaction id 1", 100, "Promotion - Tesco"),
                        new MadeOfWithReason("promo transaction id 2", 180, "Promotion - Tesco"),
                    }
                }
            },
            OneTimeUseCreditStructure = new OneTimeUseCreditStructure()
            {
                GoodwillCreditMadeOf = 
                    new ReadOnlyCollection<MadeOf>([
                        new MadeOf("goodwill transaction id 1", 180),
                        new MadeOf("goodwill transaction id 2", 180)
                    ]),
            },
            RefundCreditMadeOf = new ReadOnlyCollection<MadeOf>(new List<MadeOf>()
            {
                new MadeOf("refund credit transaction id 1", 1761.76m),
                new MadeOf("refund credit transaction id 2", 1937.24m)
            })
        });
    }

    [Fact]
    public async Task CalculateCreditRefund_RefundInBookingWithTwoPaymentsOfTheSamePromoAndTransactionIdCashAndWithTwoOneTimeUse_ShouldReturnResult()
    {
        BookingResponse bookingResponse = new()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new ()
                {
                    Routes =
                    [
                        new ()
                        {
                            DepDate = DateTime.UtcNow.AddDays(82), Direction = Direction.Outbound
                        }
                    ],
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 2465.68m,
                PaymentHistory = new[]
                {
                    CashPayment(120m),
                    OneTimeUseCreditPayment(15m, transNo: "onetimeuse transaction id 1"),
                    OneTimeUseCreditPayment(15m, transNo: "onetimeuse transaction id 2"),
                    PromoCreditPayment(23.98m, PromoMarketing, transNo: "promo transaction id 1"),
                    CashPayment(104.10m),
                    PromoCreditPayment(30m, PromoMarketing, transNo: "promo transaction id 1"),
                }
            },
            Guests = []
        };

        for (int i = 0; i < 2; i++)
        {
            bookingResponse.Guests.Add(
                new PersonWithDetails()
                {
                    Age = 20 + i,
                    FirstName = $"TestFirstName{i}",
                    LastName = $"TestLastName{i}",
                    Type = PersonType.Adult
                });
        }

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByPaymentCode(It.IsAny<string>()))
            .Returns((string paymentCode) => PaymentCodes[paymentCode]);

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByReason(It.IsAny<string>()))
            .Returns((string reason) =>
            {
                var setting = PaymentCodes.Values.FirstOrDefault(i => i.Reason == reason);
                if (setting == null)
                    throw new ApiException(ApiExceptionCodes.BookingCreditInconsistentError);
                return setting;
            });

        var feeAmount = 120;
        InfoCancellationResponse infoCancellationResponse = new()
        {
            CancellationFeeItem = new FeeItem() { Amount = feeAmount }
        };
        _infoCancellationServiceMock
            .Setup(x => x.GetInfoCancellationAsync(It.IsAny<BookingResponse>()))
            .ReturnsAsync(infoCancellationResponse);

        var refundOption = BookingCancellationRequestRefundOption.Credit;

        // Act
        var bookingCancellationRefundBreakdown = await _sutCustomerLedBreakdownStrategy.GetCancellationRefundBreakdown(bookingResponse, null, _cancellationToken);
        var bookingCancellationCreditRefundBreakdown = await _sutBookingCancellationCalculateCreditRefundService.CalculateCreditRefund(bookingResponse, bookingCancellationRefundBreakdown, refundOption, _cancellationToken);

        // Assert
        bookingCancellationCreditRefundBreakdown.Should().BeEquivalentTo(new BookingCancellationCreditRefundBreakdown()
        {
            OneTimeUse = 90,
            Goodwill = 0,
            GiftCard = 0,
            Refund = 188.08m,
            PromoBreakdownItems = [],
            OneTimeUseCreditStructure = new OneTimeUseCreditStructure()
            {
                PromoCreditMadeOf =
                    new ReadOnlyCollection<MadeOfWithReason>([
                        new MadeOfWithReason("promo transaction id 1", 53.98m,
                            PaymentCodes[PromoMarketing].Reason),
                    ]),
            }
        });
    }
    
    [Fact]
    public async Task CalculateCreditRefund_RefundInBookingWithTwoPaymentsOfTheSamePromoCashAndWithOneTimeUse_ShouldReturnResult()
    {
        BookingResponse bookingResponse = new()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new()
                {
                    Routes =
                    [
                        new ()
                        {
                            DepDate = DateTime.UtcNow.AddDays(82), Direction = Direction.Outbound
                        }
                    ],
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 2737.72m,
                PaymentHistory = new[]
                {
                    CashPayment(60m),
                    OneTimeUseCreditPayment(60m, transNo: "onetimeuse transaction id"),
                    CashPayment(25.98m),
                    PromoCreditPayment(15m, PromotionStaffCredit2324, transNo: "promo transaction id 1"),
                    CashPayment(268.02m),
                    PromoCreditPayment(25m, PromotionStaffCredit2324, transNo: "promo transaction id 2"),
                }
            },
            Guests = []
        };

        for (int i = 0; i < 2; i++)
        {
            bookingResponse.Guests.Add(
                new PersonWithDetails()
                {
                    Age = 20 + i,
                    FirstName = $"TestFirstName{i}",
                    LastName = $"TestLastName{i}",
                    Type = PersonType.Adult
                });
        }

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByPaymentCode(It.IsAny<string>()))
            .Returns((string paymentCode) => PaymentCodes[paymentCode]);

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByReason(It.IsAny<string>()))
            .Returns((string reason) =>
            {
                var setting = PaymentCodes.Values.FirstOrDefault(i => i.Reason == reason);
                if (setting == null)
                    throw new ApiException(ApiExceptionCodes.BookingCreditInconsistentError);
                return setting;
            });

        var feeAmount = 120;
        InfoCancellationResponse infoCancellationResponse = new()
        {
            CancellationFeeItem = new FeeItem() { Amount = feeAmount }
        };
        _infoCancellationServiceMock
            .Setup(x => x.GetInfoCancellationAsync(It.IsAny<BookingResponse>()))
            .ReturnsAsync(infoCancellationResponse);

        var refundOption = BookingCancellationRequestRefundOption.Credit;

        // Act
        var bookingCancellationRefundBreakdown = await _sutCustomerLedBreakdownStrategy.GetCancellationRefundBreakdown(bookingResponse, null, _cancellationToken);
        var bookingCancellationCreditRefundBreakdown = await _sutBookingCancellationCalculateCreditRefundService.CalculateCreditRefund(bookingResponse, bookingCancellationRefundBreakdown, refundOption, _cancellationToken);

        // Assert
        bookingCancellationCreditRefundBreakdown.Should().BeEquivalentTo(new BookingCancellationCreditRefundBreakdown()
        {
            OneTimeUse = 60,
            Goodwill = 0,
            GiftCard = 0,
            Refund = 334m,
            PromoBreakdownItems = [],
            OneTimeUseCreditStructure = new OneTimeUseCreditStructure()
            {
                PromoCreditMadeOf =
                    new ReadOnlyCollection<MadeOfWithReason>([
                        new MadeOfWithReason("promo transaction id 1", 15m,
                            PaymentCodes[PromotionStaffCredit2324].Reason),
                        new MadeOfWithReason("promo transaction id 2", 25m,
                            PaymentCodes[PromotionStaffCredit2324].Reason)
                    ]),
            }
        });
    }
    
    [Fact]
    public async Task CalculateCreditRefund_RefundInBookingWithTwoDifferentPromoCashAndWithOneTimeUse_ShouldReturnResult()
    {
        BookingResponse bookingResponse = new()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new()
                {
                    Routes =
                    [
                        new ()
                        {
                            DepDate = DateTime.UtcNow.AddDays(82), Direction = Direction.Outbound
                        }
                    ],
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 2737.72m,
                PaymentHistory = new[]
                {
                    CashPayment(60m),
                    OneTimeUseCreditPayment(60m, transNo: "onetimeuse transaction id"),
                    CashPayment(25.98m),
                    PromoCreditPayment(15m, PromotionStaffCredit2324, transNo: "promo transaction id 2324"),
                    CashPayment(268.02m),
                    PromoCreditPayment(25m, PromotionStaffCredit2526, transNo: "promo transaction id 2526"),
                }
            },
            Guests = []
        };

        for (int i = 0; i < 2; i++)
        {
            bookingResponse.Guests.Add(
                new PersonWithDetails()
                {
                    Age = 20 + i,
                    FirstName = $"TestFirstName{i}",
                    LastName = $"TestLastName{i}",
                    Type = PersonType.Adult
                });
        }

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByPaymentCode(It.IsAny<string>()))
            .Returns((string paymentCode) => PaymentCodes[paymentCode]);

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByReason(It.IsAny<string>()))
            .Returns((string reason) =>
            {
                var setting = PaymentCodes.Values.FirstOrDefault(i => i.Reason == reason);
                if (setting == null)
                    throw new ApiException(ApiExceptionCodes.BookingCreditInconsistentError);
                return setting;
            });

        var feeAmount = 120;
        InfoCancellationResponse infoCancellationResponse = new()
        {
            CancellationFeeItem = new FeeItem() { Amount = feeAmount }
        };
        _infoCancellationServiceMock
            .Setup(x => x.GetInfoCancellationAsync(It.IsAny<BookingResponse>()))
            .ReturnsAsync(infoCancellationResponse);

        var refundOption = BookingCancellationRequestRefundOption.Credit;

        // Act
        var bookingCancellationRefundBreakdown = await _sutCustomerLedBreakdownStrategy.GetCancellationRefundBreakdown(bookingResponse, null, _cancellationToken);
        var bookingCancellationCreditRefundBreakdown = await _sutBookingCancellationCalculateCreditRefundService.CalculateCreditRefund(bookingResponse, bookingCancellationRefundBreakdown, refundOption, _cancellationToken);

        // Assert
        bookingCancellationCreditRefundBreakdown.Should().BeEquivalentTo(new BookingCancellationCreditRefundBreakdown()
        {
            OneTimeUse = 60,
            Goodwill = 0,
            GiftCard = 0,
            Refund = 334m,
            PromoBreakdownItems = [],
            OneTimeUseCreditStructure = new OneTimeUseCreditStructure()
            {
                PromoCreditMadeOf =
                    new ReadOnlyCollection<MadeOfWithReason>([
                        new MadeOfWithReason("promo transaction id 2324", 15m,
                            PaymentCodes[PromotionStaffCredit2324].Reason),
                        new MadeOfWithReason("promo transaction id 2526", 25m,
                            PaymentCodes[PromotionStaffCredit2526].Reason)
                    ]),
            }
        });
    }
    
    [Fact]
    public async Task CalculateCreditRefund_AmendmentRefundInBookingWithPromoAndWithOneTimeUse_ShouldReturnResult()
    {
        BookingResponse bookingResponse = new()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new ()
                {
                    Routes =
                    [
                        new ()
                        {
                            DepDate = DateTime.UtcNow.AddDays(82), Direction = Direction.Outbound
                        }
                    ],
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 2485.92m,
                PaymentHistory = new[]
                {
                    CashPayment(60m),
                    OneTimeUseCreditPayment(60m, transNo: "onetimeuse transaction id"),
                    PromoCreditPayment(28.98m, PromotionStaffCredit2526, transNo: "promo transaction id"),
                }
            },
            Guests = []
        };

        for (int i = 0; i < 2; i++)
        {
            bookingResponse.Guests.Add(
                new PersonWithDetails()
                {
                    Age = 20 + i,
                    FirstName = $"TestFirstName{i}",
                    LastName = $"TestLastName{i}",
                    Type = PersonType.Adult
                });
        }

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByPaymentCode(It.IsAny<string>()))
            .Returns((string paymentCode) => PaymentCodes[paymentCode]);

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByReason(It.IsAny<string>()))
            .Returns((string reason) =>
            {
                var setting = PaymentCodes.Values.FirstOrDefault(i => i.Reason == reason);
                if (setting == null)
                    throw new ApiException(ApiExceptionCodes.BookingCreditInconsistentError);
                return setting;
            });

        var feeAmount = 120;
        InfoCancellationResponse infoCancellationResponse = new()
        {
            CancellationFeeItem = new FeeItem() { Amount = feeAmount }
        };
        _infoCancellationServiceMock
            .Setup(x => x.GetInfoCancellationAsync(It.IsAny<BookingResponse>()))
            .ReturnsAsync(infoCancellationResponse);

        var refundOption = BookingCancellationRequestRefundOption.Credit;

        // Act
        var bookingCancellationRefundBreakdown = await _sutCustomerLedBreakdownStrategy.GetCancellationRefundBreakdown(bookingResponse, null, _cancellationToken);
        var bookingCancellationCreditRefundBreakdown = await _sutBookingCancellationCalculateCreditRefundService.CalculateCreditRefund(bookingResponse, bookingCancellationRefundBreakdown, refundOption, _cancellationToken);

        // Assert
        bookingCancellationCreditRefundBreakdown.Should().BeEquivalentTo(new BookingCancellationCreditRefundBreakdown()
        {
            OneTimeUse = 60,
            Goodwill = 0,
            GiftCard = 0,
            Refund = 28.98m,
            PromoBreakdownItems = [],
            OneTimeUseCreditStructure = new OneTimeUseCreditStructure()
            {
                PromoCreditMadeOf =
                    new ReadOnlyCollection<MadeOfWithReason>([
                        new MadeOfWithReason("promo transaction id", 28.98m,
                            PaymentCodes[PromotionStaffCredit2526].Reason)
                    ]),
            }
        });
    }
    
    [Fact]
    public async Task CalculateCreditRefund_AmendmentRefundInBookingWithMultipleVouchersRefundCreditWithOneTimeUse_ShouldReturnResult()
    {
        BookingResponse bookingResponse = new()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new ()
                {
                    Routes =
                    [
                        new Route()
                        {
                            DepDate = DateTime.UtcNow.AddDays(82), Direction = Direction.Outbound
                        }
                    ],
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 3353.78m,
                PaymentHistory = new[]
                {
                    CashPayment(3253.78m),
                    PromoCreditPayment(20, PromoTesco),
                    PromoCreditPayment(40, PromotionStaffCredit2526),
                    RefundCreditPayment(30),
                    GoodWillPayment(10),
                    RefundCreditPayment(-224.02m),
                    PromoCreditPayment(-40, PromotionStaffCredit2526),
                    PromoCreditPayment(-20, PromoTesco)
                }
            },
            Guests = []
        };

        for (int i = 0; i < 2; i++)
        {
            bookingResponse.Guests.Add(
                new PersonWithDetails()
                {
                    Age = 20 + i,
                    FirstName = $"TestFirstName{i}",
                    LastName = $"TestLastName{i}",
                    Type = PersonType.Adult
                });
        }

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByPaymentCode(It.IsAny<string>()))
            .Returns((string paymentCode) => PaymentCodes[paymentCode]);

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByReason(It.IsAny<string>()))
            .Returns((string reason) =>
            {
                var setting = PaymentCodes.Values.FirstOrDefault(i => i.Reason == reason);
                if (setting == null)
                    throw new ApiException(ApiExceptionCodes.BookingCreditInconsistentError);
                return setting;
            });

        var feeAmount = 120;
        InfoCancellationResponse infoCancellationResponse = new()
        {
            CancellationFeeItem = new FeeItem() { Amount = feeAmount }
        };
        _infoCancellationServiceMock
            .Setup(x => x.GetInfoCancellationAsync(It.IsAny<BookingResponse>()))
            .ReturnsAsync(infoCancellationResponse);

        var refundOption = BookingCancellationRequestRefundOption.Credit;

        // Act
        var bookingCancellationRefundBreakdown = await _sutCustomerLedBreakdownStrategy.GetCancellationRefundBreakdown(bookingResponse, null, _cancellationToken);
        var bookingCancellationCreditRefundBreakdown = await _sutBookingCancellationCalculateCreditRefundService.CalculateCreditRefund(bookingResponse, bookingCancellationRefundBreakdown, refundOption, _cancellationToken);

        // Assert

        bookingCancellationCreditRefundBreakdown.GiftCard.Should().Be(0);
        bookingCancellationCreditRefundBreakdown.OneTimeUse.Should().Be(feeAmount);
        bookingCancellationCreditRefundBreakdown.Refund.Should().Be(bookingCancellationRefundBreakdown.CashRefundAmount);
    }

    [Fact]
    public async Task CalculateCreditRefund_AmendmentRefundInBookingWithMultipleVouchersRefundOriginalPaymentWith120Fee_ShouldReturnResult()
    {
        BookingResponse bookingResponse = new()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new ()
                {
                    Routes =
                    [
                        new ()
                        {
                            DepDate = DateTime.UtcNow.AddDays(82), Direction = Direction.Outbound
                        }
                    ],
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 3353.78m,
                PaymentHistory = new[]
                {
                    CashPayment(3253.78m),
                    PromoCreditPayment(20, PromoTesco),
                    PromoCreditPayment(40, PromotionStaffCredit2526),
                    RefundCreditPayment(30),
                    GoodWillPayment(10),
                    RefundCreditPayment(-224.02m),
                    PromoCreditPayment(-40, PromotionStaffCredit2526),
                    PromoCreditPayment(-20, PromoTesco)
                }
            },
            Guests = []
        };

        for (int i = 0; i < 2; i++)
        {
            bookingResponse.Guests.Add(
                new PersonWithDetails()
                {
                    Age = 20 + i,
                    FirstName = $"TestFirstName{i}",
                    LastName = $"TestLastName{i}",
                    Type = PersonType.Adult
                });
        }

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByPaymentCode(It.IsAny<string>()))
            .Returns((string paymentCode) => PaymentCodes[paymentCode]);

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByReason(It.IsAny<string>()))
            .Returns((string reason) =>
            {
                var setting = PaymentCodes.Values.FirstOrDefault(i => i.Reason == reason);
                if (setting == null)
                    throw new ApiException(ApiExceptionCodes.BookingCreditInconsistentError);
                return setting;
            });

        InfoCancellationResponse infoCancellationResponse = new()
        {
            CancellationFeeItem = new FeeItem() { Amount = 120 }
        };
        _infoCancellationServiceMock
            .Setup(x => x.GetInfoCancellationAsync(It.IsAny<BookingResponse>()))
            .ReturnsAsync(infoCancellationResponse);

        var refundOption = BookingCancellationRequestRefundOption.OriginalPayment;

        // Act
        var bookingCancellationRefundBreakdown = await _sutCustomerLedBreakdownStrategy.GetCancellationRefundBreakdown(bookingResponse, null, _cancellationToken);
        var bookingCancellationCreditRefundBreakdown = await _sutBookingCancellationCalculateCreditRefundService.CalculateCreditRefund(bookingResponse, bookingCancellationRefundBreakdown, refundOption, _cancellationToken);

        // Assert
        bookingCancellationRefundBreakdown.CashRefundAmount.Should().Be(2949.76m);
        bookingCancellationCreditRefundBreakdown.GiftCard.Should().Be(0);
        bookingCancellationCreditRefundBreakdown.Refund.Should().Be(0);
        bookingCancellationCreditRefundBreakdown.OneTimeUse.Should().Be(120);
        bookingCancellationCreditRefundBreakdown.Goodwill.Should().Be(0);
        bookingCancellationCreditRefundBreakdown.PromoBreakdownItems.Should().BeEmpty();
    }



    [Fact]
    public async Task CalculateCreditRefund_PaidWithOtucAmendmentRefundFee120_ShouldReturnResult()
    {
        BookingResponse bookingResponse = new()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new ()
                {
                    Routes =
                    [
                        new ()
                        {
                            DepDate = DateTime.UtcNow.AddDays(82), Direction = Direction.Outbound
                        }
                    ],
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 2374.04m,
                PaymentHistory = new[]
                {
                    OneTimeUseCreditPayment(3284.32m),
                    RefundCreditPayment(-910.28m)
                }
            },
            Guests = []
        };

        for (int i = 0; i < 2; i++)
        {
            bookingResponse.Guests.Add(
                new PersonWithDetails()
                {
                    Age = 20 + i,
                    FirstName = $"TestFirstName{i}",
                    LastName = $"TestLastName{i}",
                    Type = PersonType.Adult
                });
        }

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByPaymentCode(It.IsAny<string>()))
            .Returns((string paymentCode) => PaymentCodes[paymentCode]);

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByReason(It.IsAny<string>()))
            .Returns((string reason) =>
            {
                var setting = PaymentCodes.Values.FirstOrDefault(i => i.Reason == reason);
                if (setting == null)
                    throw new ApiException(ApiExceptionCodes.BookingCreditInconsistentError);
                return setting;
            });

        InfoCancellationResponse infoCancellationResponse = new()
        {
            CancellationFeeItem = new FeeItem() { Amount = 120 }
        };
        _infoCancellationServiceMock
            .Setup(x => x.GetInfoCancellationAsync(It.IsAny<BookingResponse>()))
            .ReturnsAsync(infoCancellationResponse);

        var refundOption = BookingCancellationRequestRefundOption.OriginalPayment;

        // Act
        var bookingCancellationRefundBreakdown = await _sutCustomerLedBreakdownStrategy.GetCancellationRefundBreakdown(bookingResponse, null, _cancellationToken);
        var bookingCancellationCreditRefundBreakdown = await _sutBookingCancellationCalculateCreditRefundService.CalculateCreditRefund(bookingResponse, bookingCancellationRefundBreakdown, refundOption, _cancellationToken);

        // Assert
        bookingCancellationCreditRefundBreakdown.OneTimeUse.Should().Be(2254.04m);
    }

    #endregion

    #region EasyJetLed

    [Fact]
    public async Task CalculateCreditRefund_IssueWithToHighReturns_ShouldReturnResult()
    {
        BookingCancellationCreditRefundBreakdown expected = new BookingCancellationCreditRefundBreakdown()
        {
            Goodwill = 16.04m,
            GoodwillCreditMadeOf = new List<MadeOf>() { new MadeOf("4", 16.04m) }.AsReadOnly(),
            OneTimeUse = 103.96m,
            OneTimeUseCreditStructure = new OneTimeUseCreditStructure()
            {
                GoodwillCreditMadeOf = new List<MadeOf>() { new MadeOf("4", 103.96m) }.AsReadOnly()
            },
            Refund = 2287.94m,
            RefundCreditMadeOf = new ReadOnlyCollection<MadeOf>(new List<MadeOf>(){
                //new MadeOf("12", 69.96m),
                //new MadeOf("10", 66.96m),
                //new MadeOf("8", 21.00m),
                new MadeOf("7", 127.14m),
                new MadeOf("6", 915.80m),
                new MadeOf("5", 912.80m),
                new MadeOf("2", 247.99m),
                new MadeOf("3", 84.21m)
            })
        };
        BookingResponse bookingResponse = new()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new ()
                {
                    Routes =
                    [
                        new ()
                    {
                        DepDate = DateTime.UtcNow.AddDays(101), Direction = Direction.Outbound
                    }
                    ],
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 2423.98m,
                PaymentHistory = new PaymentHistoryItem[]
                {
                new() { Amount = 16.04m, PaymentDate = new DateTimeOffset(2025, 7, 12, 17, 22, 48, TimeSpan.FromHours(1)), IsCredit = true, Card = null, CurIso = "GBP", IsGiftCardCredit = false, IsPromoCredit = false, IsGoodWill = false, IsOneTimeUseCredit = true, TransNo = "1"},
                new() { Amount = 247.99m, PaymentDate = new DateTimeOffset(2025, 7, 12, 17, 22, 49, TimeSpan.FromHours(1)), IsCredit = true, Card = null, CurIso = "GBP", IsGiftCardCredit = false, IsPromoCredit = false, IsGoodWill = false, IsOneTimeUseCredit = false, TransNo = "2" },
                new() { Amount = 84.21m, PaymentDate = new DateTimeOffset(2025, 7, 12, 17, 22, 49, TimeSpan.FromHours(1)), IsCredit = true, Card = null, CurIso = "GBP", IsGiftCardCredit = false, IsPromoCredit = false, IsGoodWill = false, IsOneTimeUseCredit = false, TransNo = "3" },
                new() { Amount = 120.00m, PaymentDate = new DateTimeOffset(2025, 7, 12, 17, 22, 50, TimeSpan.FromHours(1)), IsCredit = true, Card = null, CurIso = "GBP", IsGiftCardCredit = false, IsPromoCredit = false, IsGoodWill = true, IsOneTimeUseCredit = false, TransNo = "4" },
                new() { Amount = 912.80m, PaymentDate = new DateTimeOffset(2025, 7, 12, 17, 22, 52, TimeSpan.FromHours(1)), IsCredit = true, Card = null, CurIso = "GBP", IsGiftCardCredit = false, IsPromoCredit = false, IsGoodWill = false, IsOneTimeUseCredit = false, TransNo = "5" },
                new() { Amount = 915.80m, PaymentDate = new DateTimeOffset(2025, 7, 12, 17, 22, 53, TimeSpan.FromHours(1)), IsCredit = true, Card = null, CurIso = "GBP", IsGiftCardCredit = false, IsPromoCredit = false, IsGoodWill = false, IsOneTimeUseCredit = false, TransNo = "6" },
                new() { Amount = 167.66m, PaymentDate = new DateTimeOffset(2025, 7, 26, 20, 25, 24, TimeSpan.FromHours(1)), IsCredit = true, Card = null, CurIso = "GBP", IsGiftCardCredit = false, IsPromoCredit = false, IsGoodWill = false, IsOneTimeUseCredit = false, TransNo = "7" },
                new() { Amount = 21.00m, PaymentDate = new DateTimeOffset(2025, 7, 26, 20, 30, 29, TimeSpan.FromHours(1)), IsCredit = true, Card = null, CurIso = "GBP", IsGiftCardCredit = false, IsPromoCredit = false, IsGoodWill = false, IsOneTimeUseCredit = false, TransNo = "8" },
                new() { Amount = -88.48m, PaymentDate = new DateTimeOffset(2025, 7, 28, 18, 39, 24, TimeSpan.FromHours(1)), IsCredit = true, Card = null, CurIso = "GBP", IsGiftCardCredit = false, IsPromoCredit = false, IsGoodWill = false, IsOneTimeUseCredit = false, TransNo = "9" },
                new() { Amount = 66.96m, PaymentDate = new DateTimeOffset(2025, 7, 28, 18, 41, 54, TimeSpan.FromHours(1)), IsCredit = true, Card = null, CurIso = "GBP", IsGiftCardCredit = false, IsPromoCredit = false, IsGoodWill = false, IsOneTimeUseCredit = false, TransNo = "10" },
                new() { Amount = -109.96m, PaymentDate = new DateTimeOffset(2025, 8, 12, 16, 45, 35, TimeSpan.FromHours(1)), IsCredit = true, Card = null, CurIso = "GBP", IsGiftCardCredit = false, IsPromoCredit = false, IsGoodWill = false, IsOneTimeUseCredit = false, TransNo = "11" },
                new() { Amount = 69.96m, PaymentDate = new DateTimeOffset(2025, 8, 29, 12, 3, 10, TimeSpan.FromHours(1)), IsCredit = true, Card = null, CurIso = "GBP", IsGiftCardCredit = false, IsPromoCredit = false, IsGoodWill = false, IsOneTimeUseCredit = false, TransNo = "12" }
                }
            },
            Guests = []
        };

        for (int i = 0; i < 2; i++)
        {
            bookingResponse.Guests.Add(
                new PersonWithDetails()
                {
                    Age = 20 + i,
                    FirstName = $"TestFirstName{i}",
                    LastName = $"TestLastName{i}",
                    Type = PersonType.Adult
                });
        }

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByPaymentCode(It.IsAny<string>()))
            .Returns((string paymentCode) => PaymentCodes[paymentCode]);

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByReason(It.IsAny<string>()))
            .Returns((string reason) =>
            {
                var setting = PaymentCodes.Values.FirstOrDefault(i => i.Reason == reason);
                if (setting == null)
                    throw new ApiException(ApiExceptionCodes.BookingCreditInconsistentError);
                return setting;
            });

        var feeAmount = 120;
        InfoCancellationResponse infoCancellationResponse = new()
        {
            CancellationFeeItem = new FeeItem() { Amount = feeAmount }
        };
        _infoCancellationServiceMock
            .Setup(x => x.GetInfoCancellationAsync(It.IsAny<BookingResponse>()))
            .ReturnsAsync(infoCancellationResponse);

        var refundOption = BookingCancellationRequestRefundOption.Credit;

        // Act
        var bookingCancellationRefundBreakdown = await _sutCustomerLedBreakdownStrategy.GetCancellationRefundBreakdown(bookingResponse, null, _cancellationToken);
        var bookingCancellationCreditRefundBreakdown = await _sutBookingCancellationCalculateCreditRefundService.CalculateCreditRefund(bookingResponse, bookingCancellationRefundBreakdown, refundOption, _cancellationToken);

        // Assert

        bookingCancellationCreditRefundBreakdown.Should().BeEquivalentTo(expected);
    }

    [Fact]
    public async Task CalculateCreditRefund_PaymentOnlyRefundCredit_ShouldReturnResult()
    {
        BookingCancellationCreditRefundBreakdown expected = new BookingCancellationCreditRefundBreakdown()
        {
            Refund = 1886.38m,
            RefundCreditMadeOf = new ReadOnlyCollection<MadeOf>(new List<MadeOf>(){
                new MadeOf("1", 1886.38m),
            }),
            OneTimeUse = 120m,
            OneTimeUseCreditStructure = new OneTimeUseCreditStructure()
            {
                RefundCreditMadeOf = new ReadOnlyCollection<MadeOf>(new List<MadeOf>()
                {
                    new MadeOf("1", 120.0m)
                })
            }
        };
        BookingResponse bookingResponse = new()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new Transport()
                {
                    Routes =
                    [
                        new ()
                    {
                        DepDate = DateTime.UtcNow.AddDays(101), Direction = Direction.Outbound
                    }
                    ],
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 2085.96m,
                PaymentHistory = new PaymentHistoryItem[]
                {
                new() { Amount = 2085.96m, IsCredit = true, Card = null, CurIso = "GBP", IsGiftCardCredit = false, IsPromoCredit = false, IsGoodWill = false, IsOneTimeUseCredit = false, TransNo = "1"},
                new() { Amount = -79.58m, IsCredit = true, Card = null, CurIso = "GBP", IsGiftCardCredit = false, IsPromoCredit = false, IsGoodWill = false, IsOneTimeUseCredit = false, TransNo = "2"},
                }
            },
            Guests = []
        };

        for (int i = 0; i < 2; i++)
        {
            bookingResponse.Guests.Add(
                new PersonWithDetails()
                {
                    Age = 20 + i,
                    FirstName = $"TestFirstName{i}",
                    LastName = $"TestLastName{i}",
                    Type = PersonType.Adult
                });
        }

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByPaymentCode(It.IsAny<string>()))
            .Returns((string paymentCode) => PaymentCodes[paymentCode]);

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByReason(It.IsAny<string>()))
            .Returns((string reason) =>
            {
                var setting = PaymentCodes.Values.FirstOrDefault(i => i.Reason == reason);
                if (setting == null)
                    throw new ApiException(ApiExceptionCodes.BookingCreditInconsistentError);
                return setting;
            });

        var feeAmount = 120;
        InfoCancellationResponse infoCancellationResponse = new()
        {
            CancellationFeeItem = new FeeItem() { Amount = feeAmount }
        };
        _infoCancellationServiceMock
            .Setup(x => x.GetInfoCancellationAsync(It.IsAny<BookingResponse>()))
            .ReturnsAsync(infoCancellationResponse);

        var refundOption = BookingCancellationRequestRefundOption.Credit;

        // Act
        var bookingCancellationRefundBreakdown = await _sutCustomerLedBreakdownStrategy.GetCancellationRefundBreakdown(bookingResponse, null, _cancellationToken);
        var bookingCancellationCreditRefundBreakdown = await _sutBookingCancellationCalculateCreditRefundService.CalculateCreditRefund(bookingResponse, bookingCancellationRefundBreakdown, refundOption, _cancellationToken);

        // Assert

        bookingCancellationCreditRefundBreakdown.Should().BeEquivalentTo(expected);
    }

        [Fact]
    public async Task CalculateCreditRefund_AmendmentInBookingAndPaidByCardRefundCredit_ShouldReturnResult()
    {
        BookingCancellationCreditRefundBreakdown expected = new BookingCancellationCreditRefundBreakdown()
        {
            Refund = 1089.00M,
            OneTimeUse = 103.96M,
            OneTimeUseCreditStructure = new OneTimeUseCreditStructure()
            {
                OneTimeUseCreditMadeOf = new ReadOnlyCollection<MadeOf>(new List<MadeOf>()
                {
                    new MadeOf(null, 102.02M)
                }),
                GoodwillCreditMadeOf = new ReadOnlyCollection<MadeOf>(new List<MadeOf>()
                {
                    new MadeOf(null, 1.94M)
                })
            }
        };
        BookingResponse bookingResponse = new()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new ()
                {
                    Routes =
                    [
                        new ()
                    {
                        DepDate = DateTime.UtcNow.AddDays(101), Direction = Direction.Outbound
                    }
                    ],
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 1472.02m,
                PaymentHistory = new PaymentHistoryItem[]
                {
                    new() { Amount = 1072.02m, PaymentDate = new DateTimeOffset(2025, 11, 28, 9, 28, 8, TimeSpan.Zero), IsCredit = false, Card = null, CurIso = null, IsGiftCardCredit = false, IsPromoCredit = false, IsGoodWill = false, IsOneTimeUseCredit = false },
                    new() { Amount = 103.96m, PaymentDate = new DateTimeOffset(2025, 11, 28, 9, 28, 9, TimeSpan.Zero), IsCredit = true, Card = null, CurIso = null, IsGiftCardCredit = false, IsPromoCredit = false, IsGoodWill = false, IsOneTimeUseCredit = true },
                    new() { Amount = 120.00m, PaymentDate = new DateTimeOffset(2025, 11, 28, 9, 28, 9, TimeSpan.Zero), IsCredit = true, Card = null, CurIso = null, IsGiftCardCredit = false, IsPromoCredit = false, IsGoodWill = false, IsOneTimeUseCredit = true },
                    new() { Amount = 76.04m, PaymentDate = new DateTimeOffset(2025, 11, 28, 9, 28, 10, TimeSpan.Zero), IsCredit = true, Card = null, CurIso = null, IsGiftCardCredit = false, IsPromoCredit = false, IsGoodWill = false, IsOneTimeUseCredit = false },
                    new() { Amount = 100.00m, PaymentDate = new DateTimeOffset(2025, 11, 28, 9, 28, 10, TimeSpan.Zero), IsCredit = true, Card = null, CurIso = null, IsGiftCardCredit = false, IsPromoCredit = false, IsGoodWill = false, IsOneTimeUseCredit = false },
                    new() { Amount = -177.98m, PaymentDate = new DateTimeOffset(2025, 11, 28, 9, 28, 10, TimeSpan.Zero), IsCredit = true, Card = null, CurIso = null, IsGiftCardCredit = false, IsPromoCredit = false, IsGoodWill = false, IsOneTimeUseCredit = false },
                    new() { Amount = 18.92m, PaymentDate = new DateTimeOffset(2025, 11, 28, 9, 28, 10, TimeSpan.Zero), IsCredit = false, Card = null, CurIso = null, IsGiftCardCredit = false, IsPromoCredit = false, IsGoodWill = false, IsOneTimeUseCredit = false },
                    new() { Amount = 50m, PaymentDate = new DateTimeOffset(2025, 11, 28, 9, 28, 10, TimeSpan.Zero), IsCredit = true, Card = null, CurIso = null, IsGiftCardCredit = false, IsPromoCredit = false, IsGoodWill = true, IsOneTimeUseCredit = false }
                },
                AmendmentFeesItems = new []{new FeeItem(){Amount = 50}}
            },
            Guests = []
        };

        for (int i = 0; i < 2; i++)
        {
            bookingResponse.Guests.Add(
                new PersonWithDetails()
                {
                    Age = 20 + i,
                    FirstName = $"TestFirstName{i}",
                    LastName = $"TestLastName{i}",
                    Type = PersonType.Adult
                });
        }

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByPaymentCode(It.IsAny<string>()))
            .Returns((string paymentCode) => PaymentCodes[paymentCode]);

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByReason(It.IsAny<string>()))
            .Returns((string reason) =>
            {
                var setting = PaymentCodes.Values.FirstOrDefault(i => i.Reason == reason);
                if (setting == null)
                    throw new ApiException(ApiExceptionCodes.BookingCreditInconsistentError);
                return setting;
            });

        var feeAmount = 120;
        InfoCancellationResponse infoCancellationResponse = new()
        {
            CancellationFeeItem = new FeeItem() { Amount = feeAmount }
        };
        _infoCancellationServiceMock
            .Setup(x => x.GetInfoCancellationAsync(It.IsAny<BookingResponse>()))
            .ReturnsAsync(infoCancellationResponse);

        var refundOption = BookingCancellationRequestRefundOption.Credit;

        // Act
        var bookingCancellationRefundBreakdown = await _sutCustomerLedBreakdownStrategy.GetCancellationRefundBreakdown(bookingResponse, null, _cancellationToken);
        var bookingCancellationCreditRefundBreakdown = await _sutBookingCancellationCalculateCreditRefundService.CalculateCreditRefund(bookingResponse, bookingCancellationRefundBreakdown, refundOption, _cancellationToken);

        // Assert

        bookingCancellationCreditRefundBreakdown.Should().BeEquivalentTo(expected);
    }

    [Fact]
    public async Task CalculateCreditRefund_AmendmentRefundInBookingWithMultipleVouchersRefundCredit_ShouldReturnResult()
    {
        BookingResponse bookingResponse = new()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new ()
                {
                    Routes =
                    [
                        new ()
                        {
                            DepDate = DateTime.UtcNow.AddDays(82), Direction = Direction.Outbound
                        }
                    ],
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 3353.78m,
                PaymentHistory = new[]
                {
                    CashPayment(3253.78m),
                    PromoCreditPayment(20, PromoTesco),
                    PromoCreditPayment(40, PromotionStaffCredit2526),
                    RefundCreditPayment(30),
                    GoodWillPayment(10),
                    RefundCreditPayment(-224.02m),
                    PromoCreditPayment(-40, PromotionStaffCredit2526),
                    PromoCreditPayment(-20, PromoTesco)
                }
            },
            Guests = []
        };

        for (int i = 0; i < 2; i++)
        {
            bookingResponse.Guests.Add(
                new PersonWithDetails()
                {
                    Age = 20 + i,
                    FirstName = $"TestFirstName{i}",
                    LastName = $"TestLastName{i}",
                    Type = PersonType.Adult
                });
        }

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByPaymentCode(It.IsAny<string>()))
            .Returns((string paymentCode) => PaymentCodes[paymentCode]);

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByReason(It.IsAny<string>()))
            .Returns((string reason) =>
            {
                var setting = PaymentCodes.Values.FirstOrDefault(i => i.Reason == reason);
                if (setting == null)
                    throw new ApiException(ApiExceptionCodes.BookingCreditInconsistentError);
                return setting;
            });

        var refundOption = BookingCancellationRequestRefundOption.Credit;

        // Act
        var bookingCancellationRefundBreakdown = await _sutEasyJetLedBreakdownStrategy.GetCancellationRefundBreakdown(bookingResponse, null, _cancellationToken);
        var bookingCancellationCreditRefundBreakdown = await _sutBookingCancellationCalculateCreditRefundService.CalculateCreditRefund(bookingResponse, bookingCancellationRefundBreakdown, refundOption, _cancellationToken);

        // Assert

        bookingCancellationCreditRefundBreakdown.GiftCard.Should().Be(0);
        bookingCancellationCreditRefundBreakdown.Refund.Should().Be(bookingCancellationRefundBreakdown.CashRefundAmount);
    }

    [Fact]
    public async Task CalculateCreditRefund_AmendmentRefundInBookingWithMultipleVouchersRefundOriginalPayment_ShouldReturnResult()
    {
        BookingResponse bookingResponse = new()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new ()
                {
                    Routes =
                    [
                        new ()
                        {
                            DepDate = DateTime.UtcNow.AddDays(82), Direction = Direction.Outbound
                        }
                    ],
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 3353.78m,
                PaymentHistory = new[]
                {
                    CashPayment(3253.78m),
                    PromoCreditPayment(20, PromoTesco),
                    PromoCreditPayment(40, PromotionStaffCredit2526),
                    RefundCreditPayment(30),
                    GoodWillPayment(10),
                    RefundCreditPayment(-224.02m),
                    PromoCreditPayment(-40, PromotionStaffCredit2526),
                    PromoCreditPayment(-20, PromoTesco)
                }
            },
            Guests = []
        };

        for (int i = 0; i < 2; i++)
        {
            bookingResponse.Guests.Add(
                new PersonWithDetails()
                {
                    Age = 20 + i,
                    FirstName = $"TestFirstName{i}",
                    LastName = $"TestLastName{i}",
                    Type = PersonType.Adult
                });
        }

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByPaymentCode(It.IsAny<string>()))
            .Returns((string paymentCode) => PaymentCodes[paymentCode]);

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByReason(It.IsAny<string>()))
            .Returns((string reason) =>
            {
                var setting = PaymentCodes.Values.FirstOrDefault(i => i.Reason == reason);
                if (setting == null)
                    throw new ApiException(ApiExceptionCodes.BookingCreditInconsistentError);
                return setting;
            });

        var refundOption = BookingCancellationRequestRefundOption.OriginalPayment;

        // Act
        var bookingCancellationRefundBreakdown = await _sutEasyJetLedBreakdownStrategy.GetCancellationRefundBreakdown(bookingResponse, null, _cancellationToken);
        var bookingCancellationCreditRefundBreakdown = await _sutBookingCancellationCalculateCreditRefundService.CalculateCreditRefund(bookingResponse, bookingCancellationRefundBreakdown, refundOption, _cancellationToken);

        // Assert
        bookingCancellationRefundBreakdown.CashRefundAmount.Should().Be(3069.76m);
        bookingCancellationCreditRefundBreakdown.GiftCard.Should().Be(0);
        bookingCancellationCreditRefundBreakdown.Refund.Should().Be(0);
        bookingCancellationCreditRefundBreakdown.OneTimeUse.Should().Be(0);
        bookingCancellationCreditRefundBreakdown.Goodwill.Should().Be(0);
        bookingCancellationCreditRefundBreakdown.PromoBreakdownItems.Should().BeEmpty();
    }

    [Fact]
    public async Task CalculateCreditRefund_PaidWithOtucAmendmentRefundNoFee_ShouldReturnResult()
    {
        BookingResponse bookingResponse = new()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new ()
                {
                    Routes =
                    [
                        new ()
                        {
                            DepDate = DateTime.UtcNow.AddDays(82), Direction = Direction.Outbound
                        }
                    ],
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 2374.04m,
                PaymentHistory = new[]
                {
                    OneTimeUseCreditPayment(3284.32m),
                    RefundCreditPayment(-910.28m)
                }
            },
            Guests = []
        };

        for (int i = 0; i < 2; i++)
        {
            bookingResponse.Guests.Add(
                new PersonWithDetails()
                {
                    Age = 20 + i,
                    FirstName = $"TestFirstName{i}",
                    LastName = $"TestLastName{i}",
                    Type = PersonType.Adult
                });
        }

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByPaymentCode(It.IsAny<string>()))
            .Returns((string paymentCode) => PaymentCodes[paymentCode]);

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByReason(It.IsAny<string>()))
            .Returns((string reason) =>
            {
                var setting = PaymentCodes.Values.FirstOrDefault(i => i.Reason == reason);
                if (setting == null)
                    throw new ApiException(ApiExceptionCodes.BookingCreditInconsistentError);
                return setting;
            });

        var refundOption = BookingCancellationRequestRefundOption.OriginalPayment;

        // Act
        var bookingCancellationRefundBreakdown = await _sutEasyJetLedBreakdownStrategy.GetCancellationRefundBreakdown(bookingResponse, null, _cancellationToken);
        var bookingCancellationCreditRefundBreakdown = await _sutBookingCancellationCalculateCreditRefundService.CalculateCreditRefund(bookingResponse, bookingCancellationRefundBreakdown, refundOption, _cancellationToken);

        // Assert
        bookingCancellationCreditRefundBreakdown.OneTimeUse.Should().Be(2374.04m);
    }


    [Fact]
    public async Task CalculateCreditRefund_AmendmentRefundInBookingRefundCredit_ShouldReturnResult()
    {
        BookingResponse bookingResponse = new()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new ()
                {
                    Routes =
                    [
                        new ()
                        {
                            DepDate = DateTime.UtcNow.AddDays(82), Direction = Direction.Outbound
                        }
                    ],
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 2173.66m,
                PaymentHistory = new[]
                {
                    CashPayment(120.00m),
                    CashPayment(2053.66m),
                    RefundCreditPayment(-671.02m)
                }
            },
            Guests = []
        };

        for (int i = 0; i < 2; i++)
        {
            bookingResponse.Guests.Add(
                new PersonWithDetails()
                {
                    Age = 20 + i,
                    FirstName = $"TestFirstName{i}",
                    LastName = $"TestLastName{i}",
                    Type = PersonType.Adult
                });
        }

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByPaymentCode(It.IsAny<string>()))
            .Returns((string paymentCode) => PaymentCodes[paymentCode]);

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByReason(It.IsAny<string>()))
            .Returns((string reason) =>
            {
                var setting = PaymentCodes.Values.FirstOrDefault(i => i.Reason == reason);
                if (setting == null)
                    throw new ApiException(ApiExceptionCodes.BookingCreditInconsistentError);
                return setting;
            });

        var refundOption = BookingCancellationRequestRefundOption.Credit;

        // Act
        var bookingCancellationRefundBreakdown = await _sutEasyJetLedBreakdownStrategy.GetCancellationRefundBreakdown(bookingResponse, null, _cancellationToken);
        var bookingCancellationCreditRefundBreakdown = await _sutBookingCancellationCalculateCreditRefundService.CalculateCreditRefund(bookingResponse, bookingCancellationRefundBreakdown, refundOption, _cancellationToken);

        // Assert
        bookingCancellationCreditRefundBreakdown.Refund.Should()
            .Be(bookingCancellationRefundBreakdown.CashRefundAmount);
    }

    [Fact]
    public async Task CalculateCreditRefund_TwiceAmendmentRefundInBookingRefundCredit_ShouldReturnResult()
    {
        BookingResponse bookingResponse = new()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new ()
                {
                    Routes =
                    [
                        new ()
                        {
                            DepDate = DateTime.UtcNow.AddDays(82), Direction = Direction.Outbound
                        }
                    ],
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 2474.67m,
                PaymentHistory = new[]
                {
                    OneTimeUseCreditPayment(120.00m),
                    GoodWillPayment(201.01m),
                    PromoCreditPayment(100, PromotionStaffCredit2526),
                    CashPayment(2053.66m),
                    RefundCreditPayment(-671.02m),
                    GoodWillPayment(-201.01m)
                }
            },
            Guests = []
        };

        for (int i = 0; i < 2; i++)
        {
            bookingResponse.Guests.Add(
                new PersonWithDetails()
                {
                    Age = 20 + i,
                    FirstName = $"TestFirstName{i}",
                    LastName = $"TestLastName{i}",
                    Type = PersonType.Adult
                });
        }

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByPaymentCode(It.IsAny<string>()))
            .Returns((string paymentCode) => PaymentCodes[paymentCode]);

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByReason(It.IsAny<string>()))
            .Returns((string reason) =>
            {
                var setting = PaymentCodes.Values.FirstOrDefault(i => i.Reason == reason);
                if (setting == null)
                    throw new ApiException(ApiExceptionCodes.BookingCreditInconsistentError);
                return setting;
            });

        var refundOption = BookingCancellationRequestRefundOption.Credit;

        // Act
        var bookingCancellationRefundBreakdown = await _sutEasyJetLedBreakdownStrategy.GetCancellationRefundBreakdown(bookingResponse, null, _cancellationToken);
        var bookingCancellationCreditRefundBreakdown = await _sutBookingCancellationCalculateCreditRefundService.CalculateCreditRefund(bookingResponse, bookingCancellationRefundBreakdown, refundOption, _cancellationToken);

        // Assert
        bookingCancellationRefundBreakdown.TotalRefundAmount.Should().Be(1602.64m);
        bookingCancellationRefundBreakdown.OneTimeUseCreditRefundAmount.Should().Be(120);
        bookingCancellationCreditRefundBreakdown.Refund.Should().Be(1482.64m);
        bookingCancellationCreditRefundBreakdown.OneTimeUse.Should().Be(120);
    }

    [Fact]
    public async Task CalculateCreditRefund_TwiceAmendmentRefundWithRefundCreditInBookingMoreCreditThanCashRefundCredit_ShouldReturnResult()
    {
        BookingResponse bookingResponse = new()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new ()
                {
                    Routes =
                    [
                        new ()
                        {
                            DepDate = DateTime.UtcNow.AddDays(82), Direction = Direction.Outbound
                        }
                    ],
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 2474.67m,
                PaymentHistory = new[]
                {
                    RefundCreditPayment(1421.01m),
                    CashPayment(1053.66m),
                    RefundCreditPayment(-421.01m),
                    RefundCreditPayment(45.00m)
                }
            },
            Guests = []
        };

        for (int i = 0; i < 2; i++)
        {
            bookingResponse.Guests.Add(
                new PersonWithDetails()
                {
                    Age = 20 + i,
                    FirstName = $"TestFirstName{i}",
                    LastName = $"TestLastName{i}",
                    Type = PersonType.Adult
                });
        }

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByPaymentCode(It.IsAny<string>()))
            .Returns((string paymentCode) => PaymentCodes[paymentCode]);

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByReason(It.IsAny<string>()))
            .Returns((string reason) =>
            {
                var setting = PaymentCodes.Values.FirstOrDefault(i => i.Reason == reason);
                if (setting == null)
                    throw new ApiException(ApiExceptionCodes.BookingCreditInconsistentError);
                return setting;
            });

        var refundOption = BookingCancellationRequestRefundOption.Credit;

        // Act
        var bookingCancellationRefundBreakdown = await _sutEasyJetLedBreakdownStrategy.GetCancellationRefundBreakdown(bookingResponse, null, _cancellationToken);
        var bookingCancellationCreditRefundBreakdown = await _sutBookingCancellationCalculateCreditRefundService.CalculateCreditRefund(bookingResponse, bookingCancellationRefundBreakdown, refundOption, _cancellationToken);

        // Assert
        bookingCancellationRefundBreakdown.TotalRefundAmount.Should().Be(2098.66m);
        bookingCancellationCreditRefundBreakdown.Refund.Should().Be(2098.66m);
    }

    [Fact]
    public async Task CalculateCreditRefund_TwiceAmendmentRefundInBookingMoreCreditThanCashRefundCredit_ShouldReturnResult()
    {
        BookingResponse bookingResponse = new()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new ()
                {
                    Routes =
                    [
                        new ()
                        {
                            DepDate = DateTime.UtcNow.AddDays(82), Direction = Direction.Outbound
                        }
                    ],
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 2474.67m,
                PaymentHistory = new[]
                {
                    OneTimeUseCreditPayment(120.00m),
                    GoodWillPayment(1201.01m),
                    PromoCreditPayment(100, PromotionStaffCredit2526),
                    CashPayment(1053.66m),
                    RefundCreditPayment(-671.02m),
                    GoodWillPayment(-201.01m)
                }
            },
            Guests = []
        };

        for (int i = 0; i < 2; i++)
        {
            bookingResponse.Guests.Add(
                new PersonWithDetails()
                {
                    Age = 20 + i,
                    FirstName = $"TestFirstName{i}",
                    LastName = $"TestLastName{i}",
                    Type = PersonType.Adult
                });
        }

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByPaymentCode(It.IsAny<string>()))
            .Returns((string paymentCode) => PaymentCodes[paymentCode]);

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByReason(It.IsAny<string>()))
            .Returns((string reason) =>
            {
                var setting = PaymentCodes.Values.FirstOrDefault(i => i.Reason == reason);
                if (setting == null)
                    throw new ApiException(ApiExceptionCodes.BookingCreditInconsistentError);
                return setting;
            });

        var refundOption = BookingCancellationRequestRefundOption.Credit;

        // Act
        var bookingCancellationRefundBreakdown = await _sutEasyJetLedBreakdownStrategy.GetCancellationRefundBreakdown(bookingResponse, null, _cancellationToken);
        var bookingCancellationCreditRefundBreakdown = await _sutBookingCancellationCalculateCreditRefundService.CalculateCreditRefund(bookingResponse, bookingCancellationRefundBreakdown, refundOption, _cancellationToken);

        // Assert
        bookingCancellationRefundBreakdown.TotalRefundAmount.Should().Be(1602.64m);
        bookingCancellationRefundBreakdown.OneTimeUseCreditRefundAmount.Should().Be(120);
        bookingCancellationCreditRefundBreakdown.Refund.Should().Be(1053.66m);
        bookingCancellationCreditRefundBreakdown.OneTimeUse.Should().Be(120);
        bookingCancellationCreditRefundBreakdown.Goodwill.Should().Be(328.98m);
        bookingCancellationCreditRefundBreakdown.PromoBreakdownItems.Count.Should().Be(1);
        bookingCancellationCreditRefundBreakdown.PromoBreakdownItems.ElementAt(0).Amount.Should().Be(100);
    }

    [Fact]
    public async Task CalculateCreditRefund_PaidWithOtucAndCashChangedFlightCreditOnlyRefund_ShouldReturnResult()
    {
        BookingResponse bookingResponse = new()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new ()
                {
                    Routes =
                    [
                        new ()
                        {
                            DepDate = DateTime.UtcNow.AddDays(82), Direction = Direction.Outbound
                        }
                    ],
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 2300.99m,
                PaymentHistory = new[]
                {
                    OneTimeUseCreditPayment(120.00m),
                    CashPayment(2180.99m),
                    CashPayment(-300.00m),
                }
            },
            Guests = []
        };

        for (int i = 0; i < 2; i++)
        {
            bookingResponse.Guests.Add(
                new PersonWithDetails()
                {
                    Age = 20 + i,
                    FirstName = $"TestFirstName{i}",
                    LastName = $"TestLastName{i}",
                    Type = PersonType.Adult
                });
        }

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByPaymentCode(It.IsAny<string>()))
            .Returns((string paymentCode) => PaymentCodes[paymentCode]);

        _apiSettingsService
            .Setup(x => x.GetPaymentCodesSettingsByReason(It.IsAny<string>()))
            .Returns((string reason) =>
            {
                var setting = PaymentCodes.Values.FirstOrDefault(i => i.Reason == reason);
                if (setting == null)
                    throw new ApiException(ApiExceptionCodes.BookingCreditInconsistentError);
                return setting;
            });

        var refundOption = BookingCancellationRequestRefundOption.Credit;

        // Act
        var bookingCancellationRefundBreakdown = await _sutEasyJetLedBreakdownStrategy.GetCancellationRefundBreakdown(bookingResponse, null, _cancellationToken);
        var bookingCancellationCreditRefundBreakdown = await _sutBookingCancellationCalculateCreditRefundService.CalculateCreditRefund(bookingResponse, bookingCancellationRefundBreakdown, refundOption, _cancellationToken);

        // Assert
        bookingCancellationRefundBreakdown.TotalRefundAmount.Should().Be(2000.99m);
        bookingCancellationRefundBreakdown.OneTimeUseCreditRefundAmount.Should().Be(120);
        bookingCancellationCreditRefundBreakdown.OneTimeUse.Should().Be(120);
        bookingCancellationCreditRefundBreakdown.Refund.Should().Be(1880.99m);
    }

    #endregion

    [Theory]
    [MemberData(nameof(CreditOnlyInputData))]
    public async Task CalculateCreditRefund_WhenPaidByPromoGiftCardAndGoodWillCreditAndItIsMoreThen60DaysBeforeDeparture_ShouldReturnResult(
            TransferObject transferObject,
            BookingCancellationCreditRefundBreakdown bookingCancellationCreditRefundBreakdownCompareObject,
            decimal cashRefund, string because)
    {
        // Arrange
        ArgumentNullException.ThrowIfNull(transferObject);

        BookingResponse bookingResponse = GetBookingResponse(transferObject);
        var refundPromoCreditCodeSettings = PaymentCodes[PromotionStaffCredit2324];

        _apiSettingsService
            .SetupSequence(x => x.GetPaymentCodesSettingsByPaymentCode(It.IsAny<string>()))
            .Returns(refundPromoCreditCodeSettings)
            .Returns(PaymentCodes[PromoTesco]);

        _apiSettingsService
            .SetupSequence(x => x.GetPaymentCodesSettingsByReason(It.IsAny<string>()))
            .Returns(refundPromoCreditCodeSettings)
            .Returns(PaymentCodes[PromoTesco]);

        if (transferObject.HasMatchingDestinationRule)
        {
            _bookingCancellationRulesEngineMock.Setup(x => x.FindEligibleRule(It.IsAny<BookingResponse>()))
                .ReturnsAsync([new CreditOnlyRefundRule()]);
        }

        InfoCancellationResponse infoCancellationResponse = new()
        {
            CancellationFeeItem = new FeeItem() { Amount = transferObject.CancellationFee }
        };
        _infoCancellationServiceMock
            .Setup(x => x.GetInfoCancellationAsync(It.IsAny<BookingResponse>()))
            .ReturnsAsync(infoCancellationResponse);

        var refundOption = transferObject.RefundOptionType;

        // Act
        var bookingCancellationRefundBreakdown =
            await _sutCustomerLedBreakdownStrategy.GetCancellationRefundBreakdown(bookingResponse,
                transferObject.OverrideFeeAmount, _cancellationToken);
        var bookingCancellationCreditRefundBreakdown =
            await _sutBookingCancellationCalculateCreditRefundService.CalculateCreditRefund(bookingResponse,
                bookingCancellationRefundBreakdown, refundOption, _cancellationToken);

        // Assert
        bookingCancellationCreditRefundBreakdown.Should()
            .BeEquivalentTo(bookingCancellationCreditRefundBreakdownCompareObject, because);
        if (transferObject.RefundOptionType == BookingCancellationRequestRefundOption.OriginalPayment)
            bookingCancellationRefundBreakdown.CashRefundAmount.Should().Be(cashRefund, because);
    }

    private static BookingResponse GetBookingResponse(TransferObject transferObject)
    {
        var totalPrice = transferObject.TotalPrice;
        var promoCreditAmount = transferObject.PromoCreditAmount;
        var tescoCreditAmount = transferObject.TescoCreditAmount;
        var goodwillCreditAmount = transferObject.GoodwillCreditAmount;
        var giftCardCreditAmount = transferObject.GiftCardCreditAmount;
        var cashAmount = transferObject.CashAmount;
        var oneTimeUseCreditAmount = transferObject.OneTimeUseAmount;
        var daysUntilDeparture = transferObject.DaysUntilDeparture;
        var amendmentFees = transferObject.AmendmentFee;

        var paymentHistory = new List<PaymentHistoryItem>()
        {
            PromoCreditPayment(promoCreditAmount, transNo: "promo transaction id"),
            GoodWillPayment(goodwillCreditAmount, transNo: "goodwill transaction id"),
            GiftCardCreditPayment(giftCardCreditAmount, transNo: "gift card transaction id"),
            CashPayment(cashAmount),
            OneTimeUseCreditPayment(oneTimeUseCreditAmount, "one time use credit transaction id")
        };
        if (tescoCreditAmount > 0)
        {
            paymentHistory.Add(PromoCreditPayment(tescoCreditAmount, transNo: "tesco transaction id"));
        }

        BookingResponse bookingResponse = new()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new ()
                {
                    Routes =
                    [
                        new ()
                        {
                            DepDate = DateTime.UtcNow.AddDays(daysUntilDeparture),
                            Direction = Direction.Outbound
                        }
                    ],
                }
            },
            PaymentInfo = new PriceInfo() { TotalPrice = totalPrice, PaymentHistory = paymentHistory.ToArray() },
            Guests = []
        };

        if (amendmentFees is > 0)
        {
            var feeItemList = new List<FeeItem>();
            var list = Enumerable.Repeat(amendmentFees / transferObject.PassengersCount, (int)transferObject.PassengersCount).ToList();
            foreach (var amendmentFeeAmount in list)
            {
                feeItemList.Add(new FeeItem()
                {
                    Amount = amendmentFeeAmount ?? 0
                });
            }

            bookingResponse.PaymentInfo.AmendmentFeesItems = feeItemList.ToArray();
        }

        for (int i = 0; i < transferObject.PassengersCount; i++)
        {
            bookingResponse.Guests.Add(
                new PersonWithDetails()
                {
                    Age = 20 + i,
                    FirstName = $"TestFirstName{i}",
                    LastName = $"TestLastName{i}",
                    Type = PersonType.Adult
                });
        }

        return bookingResponse;
    }

    public static IEnumerable<object[]> CreditOnlyInputData()
    {
        return new List<object[]>()
        {
            new object[]
            {
                new TransferObject()
                {
                    TotalPrice = 1000,
                    PromoCreditAmount = 200,
                    GoodwillCreditAmount = 300,
                    GiftCardCreditAmount = 50,
                    CashAmount = 450,
                    PassengersCount = 2,
                    RefundOptionType = BookingCancellationRequestRefundOption.Credit,
                    CancellationFee = 2 * 60
                },
                new BookingCancellationCreditRefundBreakdown()
                {
                    OneTimeUse = 120,
                    Goodwill = 180,
                    GiftCard = 50,
                    Refund = 450,
                    GoodwillCreditMadeOf = new([new MadeOf("goodwill transaction id", 180)]),
                    GiftCardCreditMadeOf = new([new MadeOf("gift card transaction id", 50)]),
                    PromoBreakdownItems =
                    [
                        new BookingCancellationPromoRefundBreakdownItem()
                        {
                            Amount = 200,
                            ExpirationDate = PaymentCodes["PromotionStaffCredit2324"].ExpirationDate,
                            PromoId = 5,
                            Reason = PaymentCodes["PromotionStaffCredit2324"].Reason,
                            MadeOf =
                            [
                                new MadeOfWithReason("promo transaction id", 200,
                                    PaymentCodes["PromotionStaffCredit2324"].Reason)
                            ]
                        }
                    ],
                    OneTimeUseCreditStructure =
                        new OneTimeUseCreditStructure()
                        {
                            GoodwillCreditMadeOf =
                                new ReadOnlyCollection<MadeOf>([new MadeOf("goodwill transaction id", 120)]),
                            OneTimeUseCreditMadeOf = new([]),
                        }
                },
                0, "DifferentPaymentTypes"
            },
            new object[]
            {
                new TransferObject()
                {
                    TotalPrice = 1000,
                    PromoCreditAmount = 200,
                    GoodwillCreditAmount = 0,
                    GiftCardCreditAmount = 50,
                    CashAmount = 750,
                    PassengersCount = 2,
                    RefundOptionType = BookingCancellationRequestRefundOption.Credit,
                    CancellationFee = 2 * 60
                },
                new BookingCancellationCreditRefundBreakdown()
                {
                    OneTimeUse = 120,
                    Goodwill = 0,
                    GiftCard = 0,
                    Refund = 750,
                    PromoBreakdownItems =
                    [
                        new BookingCancellationPromoRefundBreakdownItem()
                        {
                            Amount = 130,
                            ExpirationDate = PaymentCodes["PromotionStaffCredit2324"].ExpirationDate,
                            PromoId = 5,
                            Reason = PaymentCodes["PromotionStaffCredit2324"].Reason,
                            MadeOf =
                            [
                                new MadeOfWithReason("promo transaction id", 130,
                                    PaymentCodes["PromotionStaffCredit2324"].Reason)
                            ]
                        }
                    ],
                    OneTimeUseCreditStructure =
                        new OneTimeUseCreditStructure()
                        {
                            PromoCreditMadeOf =
                                new ReadOnlyCollection<MadeOfWithReason>([
                                    new MadeOfWithReason("promo transaction id", 70,
                                        PaymentCodes["PromotionStaffCredit2324"].Reason)
                                ]),
                            GiftCardCreditMadeOf =
                                new ReadOnlyCollection<MadeOf>([new MadeOf("gift card transaction id", 50)]),
                            OneTimeUseCreditMadeOf = new([])
                        }
                },
                0, "NoGoodWillCredit"
            },
            new object[]
            {
                new TransferObject()
                {
                    TotalPrice = 1000,
                    PromoCreditAmount = 0,
                    GoodwillCreditAmount = 0,
                    GiftCardCreditAmount = 0,
                    CashAmount = 1000,
                    PassengersCount = 2,
                    RefundOptionType = BookingCancellationRequestRefundOption.Credit,
                    CancellationFee = 2 * 60
                },
                new BookingCancellationCreditRefundBreakdown()
                {
                    OneTimeUse = 120,
                    Goodwill = 0,
                    GiftCard = 0,
                    Refund = 880,
                    PromoBreakdownItems = [],
                    OneTimeUseCreditStructure = new() { OneTimeUseCreditMadeOf = new([]) }
                },
                0, "FullPayedWithCash"
            },
            new object[]
            {
                new TransferObject()
                {
                    TotalPrice = 1000,
                    PromoCreditAmount = 0,
                    GoodwillCreditAmount = 50,
                    GiftCardCreditAmount = 0,
                    CashAmount = 950,
                    PassengersCount = 2,
                    RefundOptionType = BookingCancellationRequestRefundOption.Credit,
                    CancellationFee = 2 * 60
                },
                new BookingCancellationCreditRefundBreakdown()
                {
                    OneTimeUse = 120,
                    Goodwill = 0,
                    GiftCard = 0,
                    Refund = 880,
                    PromoBreakdownItems = [],
                    OneTimeUseCreditStructure =
                        new OneTimeUseCreditStructure()
                        {
                            GoodwillCreditMadeOf = new([new MadeOf("goodwill transaction id", 50)]),
                            OneTimeUseCreditMadeOf = new([])
                        }
                },
                0, "ReduceOneTimeUseCreditFromCash"
            },
            new object[]
            {
                new TransferObject()
                {
                    TotalPrice = 2000,
                    PromoCreditAmount = 0,
                    GoodwillCreditAmount = 100,
                    GiftCardCreditAmount = (decimal)260.12,
                    CashAmount = (decimal)1639.88,
                    PassengersCount = 4,
                    RefundOptionType = BookingCancellationRequestRefundOption.Credit,
                    CancellationFee = 4 * 60
                },
                new BookingCancellationCreditRefundBreakdown()
                {
                    OneTimeUse = 240,
                    Goodwill = 0,
                    GiftCard = (decimal)120.12,
                    Refund = (decimal)1639.88,
                    PromoBreakdownItems = [],
                    GiftCardCreditMadeOf = new([new MadeOf("gift card transaction id", (decimal)120.12)]),
                    OneTimeUseCreditStructure =
                        new OneTimeUseCreditStructure()
                        {
                            GoodwillCreditMadeOf = new([new MadeOf("goodwill transaction id", 100)]),
                            GiftCardCreditMadeOf = new([new MadeOf("gift card transaction id", 140)]),
                            OneTimeUseCreditMadeOf = new([])
                        }
                },
                0, "DecimalAmounts"
            },
            new object[]
            {
                new TransferObject()
                {
                    TotalPrice = 2000,
                    PromoCreditAmount = 0,
                    GoodwillCreditAmount = 0,
                    GiftCardCreditAmount = 0,
                    OneTimeUseAmount = 120,
                    CashAmount = 1880,
                    PassengersCount = 2,
                    RefundOptionType = BookingCancellationRequestRefundOption.Credit,
                    CancellationFee = 2 * 60
                },
                new BookingCancellationCreditRefundBreakdown()
                {
                    OneTimeUse = 0,
                    Goodwill = 0,
                    GiftCard = 0,
                    Refund = 1880,
                    PromoBreakdownItems = [],
                    OneTimeUseCreditStructure = new() { OneTimeUseCreditMadeOf = new([]) }
                },
                0, "PaidWithOneTimeUseCreditAndCashAmount"
            },
            new object[]
            {
                new TransferObject()
                {
                    TotalPrice = 2000,
                    PromoCreditAmount = 246,
                    GoodwillCreditAmount = (decimal)812.32,
                    GiftCardCreditAmount = 0,
                    OneTimeUseAmount = 0,
                    CashAmount = (decimal)941.68,
                    PassengersCount = 2,
                    RefundOptionType = BookingCancellationRequestRefundOption.OriginalPayment,
                    CancellationFee = 2 * 60
                },
                new BookingCancellationCreditRefundBreakdown()
                {
                    OneTimeUse = 120,
                    Goodwill = (decimal)692.32,
                    GiftCard = 0,
                    Refund = 0,
                    GoodwillCreditMadeOf = new([new MadeOf("goodwill transaction id", (decimal)692.32)]),
                    PromoBreakdownItems =
                    [
                        new BookingCancellationPromoRefundBreakdownItem()
                        {
                            Amount = 246,
                            ExpirationDate = PaymentCodes["PromotionStaffCredit2324"].ExpirationDate,
                            PromoId = 5,
                            Reason = PaymentCodes["PromotionStaffCredit2324"].Reason,
                            MadeOf =
                            [
                                new MadeOfWithReason("promo transaction id", 246,
                                    PaymentCodes["PromotionStaffCredit2324"].Reason)
                            ]
                        }
                    ],
                    OneTimeUseCreditStructure =
                        new OneTimeUseCreditStructure()
                        {
                            GoodwillCreditMadeOf = new([new MadeOf("goodwill transaction id", 120)]),
                            OneTimeUseCreditMadeOf = new([])
                        }
                },
                (decimal)941.68, "PaidWith"
            },
            new object[]
            {
                new TransferObject()
                {
                    TotalPrice = 2000,
                    PromoCreditAmount = 246,
                    GoodwillCreditAmount = (decimal)812.32,
                    GiftCardCreditAmount = 0,
                    OneTimeUseAmount = 0,
                    CashAmount = (decimal)941.68,
                    PassengersCount = 2,
                    RefundOptionType = BookingCancellationRequestRefundOption.Credit,
                    HasMatchingDestinationRule = true,
                    CancellationFee = 2 * 60
                },
                new BookingCancellationCreditRefundBreakdown()
                {
                    OneTimeUse = 0,
                    Goodwill = (decimal)812.32,
                    GiftCard = 0,
                    Refund = (decimal)941.68,
                    GoodwillCreditMadeOf = new([new MadeOf("goodwill transaction id", (decimal)812.32)]),
                    PromoBreakdownItems =
                    [
                        new BookingCancellationPromoRefundBreakdownItem()
                        {
                            Amount = 246,
                            ExpirationDate = PaymentCodes["PromotionStaffCredit2324"].ExpirationDate,
                            PromoId = 5,
                            Reason = PaymentCodes["PromotionStaffCredit2324"].Reason,
                            MadeOf =
                            [
                                new MadeOfWithReason("promo transaction id", 246,
                                    PaymentCodes["PromotionStaffCredit2324"].Reason)
                            ]
                        }
                    ],
                    OneTimeUseCreditStructure = new() { OneTimeUseCreditMadeOf = new([]) }
                },
                0, "CheckMatchingDestinationRule"
            },
            new object[]
            {
                new TransferObject()
                {
                    TotalPrice = 1535.64m,
                    PromoCreditAmount = (decimal)811.30,
                    GoodwillCreditAmount = (decimal)200.00,
                    GiftCardCreditAmount = (decimal)248.52,
                    OneTimeUseAmount = (decimal)275.82,
                    CashAmount = (decimal)0.00,
                    PassengersCount = 2,
                    RefundOptionType = BookingCancellationRequestRefundOption.Credit,
                    HasMatchingDestinationRule = false,
                    DaysUntilDeparture = 50,
                    CancellationFee = 2 * 60
                },
                new BookingCancellationCreditRefundBreakdown()
                {
                    OneTimeUse = (decimal)155.82,
                    Goodwill = (decimal)200.00,
                    GiftCard = (decimal)248.52,
                    Refund = 0,
                    GoodwillCreditMadeOf = new([new MadeOf("goodwill transaction id", 200)]),
                    GiftCardCreditMadeOf = new([new MadeOf("gift card transaction id", 248.52m)]),
                    PromoBreakdownItems =
                    [
                        new BookingCancellationPromoRefundBreakdownItem()
                        {
                            Amount = (decimal)811.30,
                            ExpirationDate = PaymentCodes["PromotionStaffCredit2324"].ExpirationDate,
                            PromoId = 5,
                            Reason = PaymentCodes["PromotionStaffCredit2324"].Reason,
                            MadeOf =
                            [
                                new MadeOfWithReason("promo transaction id", 811.30m,
                                    PaymentCodes["PromotionStaffCredit2324"].Reason)
                            ]
                        }
                    ],
                    OneTimeUseCreditStructure =
                        new()
                        {
                            OneTimeUseCreditMadeOf =
                                new([new MadeOf("one time use credit transaction id", 155.82m)])
                        }
                },
                0, "Inside59DaysFullCreditPaymentKeepOneTimeUseCredit"
            },
            new object[]
            {
                new TransferObject()
                {
                    TotalPrice = 1535.64m,
                    PromoCreditAmount = (decimal)20.00,
                    GoodwillCreditAmount = (decimal)20.00,
                    GiftCardCreditAmount = (decimal)20.00,
                    OneTimeUseAmount = (decimal)40.00,
                    CashAmount = (decimal)20.00,
                    PassengersCount = 2,
                    RefundOptionType = BookingCancellationRequestRefundOption.Credit,
                    HasMatchingDestinationRule = false,
                    DaysUntilDeparture = 50,
                    CancellationFee = 2 * 60
                },
                new BookingCancellationCreditRefundBreakdown()
                {
                    OneTimeUse = (decimal)0.00,
                    Goodwill = (decimal)0.00,
                    GiftCard = (decimal)0.00,
                    Refund = 0,
                    PromoBreakdownItems = []
                },
                0, "Inside59DaysFullCreditPaymentOnlyCancelNoRefund"
            },
            new object[]
            {
                new TransferObject()
                {
                    TotalPrice = 1858.70m,
                    PromoCreditAmount = (decimal)1098.70,
                    GoodwillCreditAmount = (decimal)120.00,
                    GiftCardCreditAmount = (decimal)400.00,
                    OneTimeUseAmount = (decimal)80.00,
                    CashAmount = (decimal)160.00,
                    PassengersCount = 2,
                    RefundOptionType = BookingCancellationRequestRefundOption.OriginalPayment,
                    HasMatchingDestinationRule = false,
                    DaysUntilDeparture = 50,
                    CancellationFee = 2 * 60
                },
                new BookingCancellationCreditRefundBreakdown()
                {
                    OneTimeUse = (decimal)0.00,
                    Goodwill = (decimal)80.00,
                    GiftCard = (decimal)400.00,
                    Refund = 0,
                    GoodwillCreditMadeOf = new([new MadeOf("goodwill transaction id", 80)]),
                    GiftCardCreditMadeOf = new([new MadeOf("gift card transaction id", 400)]),
                    PromoBreakdownItems =
                    [
                        new BookingCancellationPromoRefundBreakdownItem()
                        {
                            Amount = (decimal)1098.70,
                            ExpirationDate = PaymentCodes["PromotionStaffCredit2324"].ExpirationDate,
                            PromoId = 5,
                            Reason = PaymentCodes["PromotionStaffCredit2324"].Reason,
                            MadeOf =
                            [
                                new MadeOfWithReason("promo transaction id", 1098.70m,
                                    PaymentCodes["PromotionStaffCredit2324"].Reason)
                            ]
                        }
                    ]
                },
                160, "Inside59DaysFullCreditAndCashPayment120CancellationFee"
            },
            new object[]
            {
                new TransferObject()
                {
                    TotalPrice = 1858.70m,
                    PromoCreditAmount = (decimal)1098.70,
                    GoodwillCreditAmount = (decimal)120.00,
                    GiftCardCreditAmount = (decimal)400.00,
                    OneTimeUseAmount = (decimal)80.00,
                    CashAmount = (decimal)160.00,
                    PassengersCount = 2,
                    RefundOptionType = BookingCancellationRequestRefundOption.OriginalPayment,
                    HasMatchingDestinationRule = false,
                    DaysUntilDeparture = 50,
                    CancellationFee = 429
                },
                new BookingCancellationCreditRefundBreakdown()
                {
                    OneTimeUse = (decimal)0.00,
                    Goodwill = (decimal)0.00,
                    GiftCard = (decimal)171.00,
                    Refund = 0,
                    GiftCardCreditMadeOf = new([new MadeOf("gift card transaction id", 171)]),
                    PromoBreakdownItems =
                    [
                        new BookingCancellationPromoRefundBreakdownItem()
                        {
                            Amount = (decimal)1098.70,
                            ExpirationDate = PaymentCodes["PromotionStaffCredit2324"].ExpirationDate,
                            PromoId = 5,
                            Reason = PaymentCodes["PromotionStaffCredit2324"].Reason,
                            MadeOf =
                            [
                                new MadeOfWithReason("promo transaction id", 1098.70m,
                                    PaymentCodes["PromotionStaffCredit2324"].Reason)
                            ]
                        }
                    ],
                },
                160, "Inside59DaysFullCreditAndCashPayment429CancellationFeeOriginalPaymentRefund"
            },
            new object[]
            {
                new TransferObject()
                {
                    TotalPrice = 1858.70m,
                    PromoCreditAmount = (decimal)1098.70,
                    GoodwillCreditAmount = (decimal)120.00,
                    GiftCardCreditAmount = (decimal)400.00,
                    OneTimeUseAmount = (decimal)80.00,
                    CashAmount = (decimal)160.00,
                    PassengersCount = 2,
                    RefundOptionType = BookingCancellationRequestRefundOption.Credit,
                    HasMatchingDestinationRule = false,
                    DaysUntilDeparture = 50,
                    CancellationFee = 429
                },
                new BookingCancellationCreditRefundBreakdown()
                {
                    OneTimeUse = (decimal)0.00,
                    Goodwill = (decimal)0.00,
                    GiftCard = (decimal)171.00,
                    Refund = 160,
                    GiftCardCreditMadeOf = new([new MadeOf("gift card transaction id", 171)]),
                    PromoBreakdownItems =
                    [
                        new BookingCancellationPromoRefundBreakdownItem()
                        {
                            Amount = (decimal)1098.70,
                            ExpirationDate = PaymentCodes["PromotionStaffCredit2324"].ExpirationDate,
                            PromoId = 5,
                            Reason = PaymentCodes["PromotionStaffCredit2324"].Reason,
                            MadeOf =
                            [
                                new MadeOfWithReason("promo transaction id", 1098.70m,
                                    PaymentCodes["PromotionStaffCredit2324"].Reason)
                            ]
                        }
                    ],
                },
                0, "Inside59DaysFullCreditAndCashPayment429CancellationFeeCreditRefund"
            },
            new object[]
            {
                new TransferObject()
                {
                    TotalPrice = 1858.70m,
                    PromoCreditAmount = (decimal)1098.70,
                    GoodwillCreditAmount = (decimal)120.00,
                    GiftCardCreditAmount = (decimal)400.00,
                    OneTimeUseAmount = (decimal)80.00,
                    CashAmount = (decimal)160.00,
                    PassengersCount = 2,
                    RefundOptionType = BookingCancellationRequestRefundOption.Credit,
                    HasMatchingDestinationRule = false,
                    DaysUntilDeparture = 25,
                    CancellationFee = (decimal)1394.03
                },
                new BookingCancellationCreditRefundBreakdown()
                {
                    OneTimeUse = (decimal)0.00,
                    Goodwill = (decimal)0.00,
                    GiftCard = (decimal)0.00,
                    Refund = 160,
                    PromoBreakdownItems =
                    [
                        new BookingCancellationPromoRefundBreakdownItem()
                        {
                            Amount = (decimal)304.67,
                            ExpirationDate = PaymentCodes["PromotionStaffCredit2324"].ExpirationDate,
                            PromoId = 5,
                            Reason = PaymentCodes["PromotionStaffCredit2324"].Reason,
                            MadeOf =
                            [
                                new MadeOfWithReason("promo transaction id", 304.67m,
                                    PaymentCodes["PromotionStaffCredit2324"].Reason)
                            ],
                        }
                    ],
                },
                0, "Inside28DaysFullCreditAndCashPayment75PercentCancellationFeeCreditRefund"
            },
            new object[]
            {
                new TransferObject()
                {
                    TotalPrice = 1858.70m,
                    PromoCreditAmount = (decimal)1098.70,
                    GoodwillCreditAmount = (decimal)120.00,
                    GiftCardCreditAmount = (decimal)400.00,
                    OneTimeUseAmount = (decimal)80.00,
                    CashAmount = (decimal)160.00,
                    PassengersCount = 2,
                    RefundOptionType = BookingCancellationRequestRefundOption.OriginalPayment,
                    HasMatchingDestinationRule = false,
                    DaysUntilDeparture = 25,
                    CancellationFee = (decimal)1394.03
                },
                new BookingCancellationCreditRefundBreakdown()
                {
                    OneTimeUse = (decimal)0.00,
                    Goodwill = (decimal)0.00,
                    GiftCard = (decimal)0.00,
                    Refund = (decimal)0.00,
                    PromoBreakdownItems =
                    [
                        new BookingCancellationPromoRefundBreakdownItem()
                        {
                            Amount = (decimal)304.67,
                            ExpirationDate = PaymentCodes["PromotionStaffCredit2324"].ExpirationDate,
                            PromoId = 5,
                            Reason = PaymentCodes["PromotionStaffCredit2324"].Reason,
                            MadeOf =
                            [
                                new MadeOfWithReason("promo transaction id", 304.67m,
                                    PaymentCodes["PromotionStaffCredit2324"].Reason)
                            ],
                        }
                    ],
                },
                160, "Inside28DaysFullCreditAndCashPayment75PercentCancellationFeeOriginalPaymentRefund"
            },
            new object[]
            {
                new TransferObject()
                {
                    TotalPrice = 1858.70m,
                    PromoCreditAmount = (decimal)1098.70,
                    GoodwillCreditAmount = (decimal)120.00,
                    GiftCardCreditAmount = (decimal)400.00,
                    OneTimeUseAmount = (decimal)80.00,
                    CashAmount = (decimal)160.00,
                    PassengersCount = 2,
                    RefundOptionType = BookingCancellationRequestRefundOption.Credit,
                    HasMatchingDestinationRule = false,
                    DaysUntilDeparture = 25,
                    CancellationFee = (decimal)1765.77
                },
                new BookingCancellationCreditRefundBreakdown()
                {
                    OneTimeUse = (decimal)0.00,
                    Goodwill = (decimal)0.00,
                    GiftCard = (decimal)0.00,
                    Refund = (decimal)92.93,
                },
                0, "Inside28DaysFullCreditAndCashPayment95PercentCancellationFeeCreditRefund"
            },
            new object[]
            {
                new TransferObject()
                {
                    TotalPrice = 1858.70m,
                    PromoCreditAmount = (decimal)1098.70,
                    GoodwillCreditAmount = (decimal)120.00,
                    GiftCardCreditAmount = (decimal)400.00,
                    OneTimeUseAmount = (decimal)80.00,
                    CashAmount = (decimal)160.00,
                    PassengersCount = 2,
                    RefundOptionType = BookingCancellationRequestRefundOption.OriginalPayment,
                    HasMatchingDestinationRule = false,
                    DaysUntilDeparture = 25,
                    CancellationFee = (decimal)1765.77
                },
                new BookingCancellationCreditRefundBreakdown()
                {
                    OneTimeUse = (decimal)0.00,
                    Goodwill = (decimal)0.00,
                    GiftCard = (decimal)0.00,
                    Refund = (decimal)0.00,
                    PromoBreakdownItems = []
                },
                (decimal)92.93, "Inside28DaysFullCreditAndCashPayment95PercentCancellationFeeOriginalPaymentRefund"
            },
            new object[]
            {
                new TransferObject()
                {
                    TotalPrice = 1858.70m,
                    PromoCreditAmount = (decimal)1098.70,
                    GoodwillCreditAmount = (decimal)120.00,
                    GiftCardCreditAmount = (decimal)400.00,
                    OneTimeUseAmount = (decimal)80.00,
                    CashAmount = (decimal)160.00,
                    PassengersCount = 2,
                    RefundOptionType = BookingCancellationRequestRefundOption.Credit,
                    HasMatchingDestinationRule = false,
                    DaysUntilDeparture = 10,
                    CancellationFee = 1858.70m
                },
                new BookingCancellationCreditRefundBreakdown()
                {
                    OneTimeUse = (decimal)0.00,
                    Goodwill = (decimal)0.00,
                    GiftCard = (decimal)0.00,
                    Refund = (decimal)0.00,
                    PromoBreakdownItems = []
                },
                (decimal)0.00, "Inside14DaysFullCreditAndCashPayment100PercentCancellationFeeCreditRefund"
            },
            new object[]
            {
                new TransferObject()
                {
                    TotalPrice = 1858.70m,
                    PromoCreditAmount = (decimal)1098.70,
                    GoodwillCreditAmount = (decimal)120.00,
                    GiftCardCreditAmount = (decimal)400.00,
                    OneTimeUseAmount = (decimal)80.00,
                    CashAmount = (decimal)160.00,
                    PassengersCount = 2,
                    RefundOptionType = BookingCancellationRequestRefundOption.OriginalPayment,
                    HasMatchingDestinationRule = false,
                    DaysUntilDeparture = 10,
                    CancellationFee = 1858.70m
                },
                new BookingCancellationCreditRefundBreakdown()
                {
                    OneTimeUse = (decimal)0.00,
                    Goodwill = (decimal)0.00,
                    GiftCard = (decimal)0.00,
                    Refund = (decimal)0.00,
                    PromoBreakdownItems = []
                },
                (decimal)0.00, "Inside14DaysFullCreditAndCashPayment100PercentCancellationFeeOriginalPaymentRefund"
            },
            new object[]
            {
                new TransferObject()
                {
                    TotalPrice = 2000.00m,
                    PromoCreditAmount = (decimal)0.00,
                    GoodwillCreditAmount = (decimal)0.00,
                    GiftCardCreditAmount = (decimal)0.00,
                    OneTimeUseAmount = (decimal)80.00,
                    CashAmount = (decimal)200.00,
                    PassengersCount = 2,
                    RefundOptionType = BookingCancellationRequestRefundOption.OriginalPayment,
                    HasMatchingDestinationRule = false,
                    DaysUntilDeparture = 22,
                    CancellationFee = 1500.00m
                },
                new BookingCancellationCreditRefundBreakdown()
                {
                    OneTimeUse = (decimal)0.00,
                    Goodwill = (decimal)0.00,
                    GiftCard = (decimal)0.00,
                    Refund = (decimal)0.00,
                    PromoBreakdownItems = []
                },
                (decimal)0.00, "Inside28DaysDepositPlusCash75PercentCancellationFeeOriginalPaymentRefund"
            },
            new object[]
            {
                new TransferObject()
                {
                    TotalPrice = (decimal)1718.9,
                    PromoCreditAmount = (decimal)0.00,
                    GoodwillCreditAmount = (decimal)1031.34,
                    GiftCardCreditAmount = (decimal)0.00,
                    OneTimeUseAmount = (decimal)687.56,
                    CashAmount = 0,
                    PassengersCount = 2,
                    RefundOptionType = BookingCancellationRequestRefundOption.Credit,
                    HasMatchingDestinationRule = false,
                    DaysUntilDeparture = 22,
                    CancellationFee = 1500.00m,
                    OverrideFeeAmount = 0
                },
                new BookingCancellationCreditRefundBreakdown()
                {
                    OneTimeUse = (decimal)687.56,
                    Goodwill = (decimal)1031.34,
                    GiftCard = (decimal)0.00,
                    Refund = (decimal)0.00,
                    PromoBreakdownItems = [],
                    GoodwillCreditMadeOf = new([new MadeOf("goodwill transaction id", 1031.34m)]),
                    OneTimeUseCreditStructure =
                        new()
                        {
                            OneTimeUseCreditMadeOf = new([
                                new MadeOf("one time use credit transaction id", 687.56m)
                            ])
                        }
                },
                (decimal)0.00, "Inside28DaysOverrideFeeToZeroRefundEverything"
            },
            new object[]
            {
                new TransferObject()
                {
                    TotalPrice = 1858.70m,
                    PromoCreditAmount = (decimal)100.00,
                    TescoCreditAmount = (decimal)998.70,
                    GoodwillCreditAmount = (decimal)120.00,
                    GiftCardCreditAmount = (decimal)400.00,
                    OneTimeUseAmount = (decimal)80.00,
                    CashAmount = (decimal)160.00,
                    PassengersCount = 2,
                    RefundOptionType = BookingCancellationRequestRefundOption.Credit,
                    HasMatchingDestinationRule = false,
                    DaysUntilDeparture = 25,
                    CancellationFee = (decimal)1394.03
                },
                new BookingCancellationCreditRefundBreakdown()
                {
                    OneTimeUse = (decimal)0.00,
                    Goodwill = (decimal)0.00,
                    GiftCard = (decimal)0.00,
                    Refund = 160,
                    PromoBreakdownItems =
                    [
                        new BookingCancellationPromoRefundBreakdownItem()
                        {
                            Amount = 100,
                            ExpirationDate = PaymentCodes["PromotionStaffCredit2324"].ExpirationDate,
                            PromoId = 6,
                            Reason = PaymentCodes["PromotionStaffCredit2324"].Reason,
                            MadeOf =
                            [
                                new MadeOfWithReason("promo transaction id", 100,
                                    PaymentCodes["PromotionStaffCredit2324"].Reason)
                            ]
                        },
                        new BookingCancellationPromoRefundBreakdownItem()
                        {
                            Amount = (decimal)204.67,
                            ExpirationDate = PaymentCodes["PromoTesco"].ExpirationDate,
                            PromoId = 7,
                            Reason = PaymentCodes["PromoTesco"].Reason,
                            MadeOf =
                            [
                                new MadeOfWithReason("tesco transaction id", 204.67m,
                                    PaymentCodes["PromoTesco"].Reason)
                            ]
                        }
                    ],
                },
                0, "OneTimeUseCreditMadeOfOnePromo"
            },
            new object[]
            {
                new TransferObject()
                {
                    TotalPrice = 1858.70m,
                    PromoCreditAmount = (decimal)998.70,
                    TescoCreditAmount = (decimal)100.00,
                    GoodwillCreditAmount = (decimal)120.00,
                    GiftCardCreditAmount = (decimal)400.00,
                    OneTimeUseAmount = (decimal)80.00,
                    CashAmount = (decimal)160.00,
                    PassengersCount = 2,
                    RefundOptionType = BookingCancellationRequestRefundOption.Credit,
                    HasMatchingDestinationRule = false,
                    DaysUntilDeparture = 25,
                    CancellationFee = (decimal)1394.03
                },
                new BookingCancellationCreditRefundBreakdown()
                {
                    OneTimeUse = (decimal)0.00,
                    Goodwill = (decimal)0.00,
                    GiftCard = (decimal)0.00,
                    Refund = 160,
                    PromoBreakdownItems =
                    [
                        new BookingCancellationPromoRefundBreakdownItem()
                        {
                            Amount = (decimal)304.67,
                            ExpirationDate = PaymentCodes["PromotionStaffCredit2324"].ExpirationDate,
                            PromoId = 6,
                            Reason = PaymentCodes["PromotionStaffCredit2324"].Reason,
                            MadeOf =
                            [
                                new MadeOfWithReason("promo transaction id", 304.67m,
                                    PaymentCodes["PromotionStaffCredit2324"].Reason)
                            ],
                        }
                    ],
                },
                0, "OneTimeUseCreditMadeOfTwoPromo"
            },
            new object[]
            {
                new TransferObject()
                {
                    TotalPrice = 1858.70m,
                    PromoCreditAmount = 60,
                    TescoCreditAmount = 60,
                    GoodwillCreditAmount = 60,
                    GiftCardCreditAmount = 60,
                    OneTimeUseAmount = 0,
                    CashAmount = 0,
                    PassengersCount = 4,
                    RefundOptionType = BookingCancellationRequestRefundOption.Credit,
                    HasMatchingDestinationRule = false,
                    DaysUntilDeparture = 61,
                    CancellationFee = 240
                },
                new BookingCancellationCreditRefundBreakdown()
                {
                    OneTimeUse = (decimal)240.00,
                    Goodwill = (decimal)0.00,
                    GiftCard = (decimal)0.00,
                    Refund = 0,
                    PromoBreakdownItems =
                    [
                    ],
                    OneTimeUseCreditStructure = new OneTimeUseCreditStructure()
                    {
                        GoodwillCreditMadeOf =
                            new ReadOnlyCollection<MadeOf>([new MadeOf("goodwill transaction id", 60)]),
                        PromoCreditMadeOf = new ReadOnlyCollection<MadeOfWithReason>([
                            new MadeOfWithReason("promo transaction id", 60,
                                PaymentCodes["PromotionStaffCredit2324"].Reason),
                            new MadeOfWithReason("tesco transaction id", 60, PaymentCodes["PromoTesco"].Reason),
                        ]),
                        GiftCardCreditMadeOf =
                            new ReadOnlyCollection<MadeOf>([new MadeOf("gift card transaction id", 60)]),
                        OneTimeUseCreditMadeOf = new([]),
                    }
                },
                0, "OneTimeUseCreditMadeOfDepositPaidByTwoPromoTypesAndCredits"
            },
            new object[]
            {
                new TransferObject()
                {
                    TotalPrice = 1858.70m,
                    PromoCreditAmount = 120,
                    TescoCreditAmount = 0,
                    GoodwillCreditAmount = 60,
                    GiftCardCreditAmount = 60,
                    OneTimeUseAmount = 0,
                    CashAmount = 0,
                    PassengersCount = 4,
                    RefundOptionType = BookingCancellationRequestRefundOption.Credit,
                    HasMatchingDestinationRule = false,
                    DaysUntilDeparture = 61,
                    CancellationFee = 240
                },
                new BookingCancellationCreditRefundBreakdown()
                {
                    OneTimeUse = (decimal)240.00,
                    Goodwill = (decimal)0.00,
                    GiftCard = (decimal)0.00,
                    Refund = 0,
                    PromoBreakdownItems =
                    [
                    ],
                    OneTimeUseCreditStructure = new OneTimeUseCreditStructure()
                    {
                        GoodwillCreditMadeOf =
                            new ReadOnlyCollection<MadeOf>([new MadeOf("goodwill transaction id", 60)]),
                        PromoCreditMadeOf = new ReadOnlyCollection<MadeOfWithReason>([
                            new MadeOfWithReason("promo transaction id", 120,
                                PaymentCodes["PromotionStaffCredit2324"].Reason),
                        ]),
                        GiftCardCreditMadeOf =
                            new ReadOnlyCollection<MadeOf>([new MadeOf("gift card transaction id", 60)]),
                        OneTimeUseCreditMadeOf = new([]),
                    }
                },
                0, "OneTimeUseCreditMadeOfDepositPaidByPromoTypesAndCredits"
            },
            new object[]
            {
                new TransferObject()
                {
                    TotalPrice = 1858.70m,
                    PromoCreditAmount = 0,
                    TescoCreditAmount = 120,
                    GoodwillCreditAmount = 60,
                    GiftCardCreditAmount = 60,
                    OneTimeUseAmount = 0,
                    CashAmount = 0,
                    PassengersCount = 4,
                    RefundOptionType = BookingCancellationRequestRefundOption.Credit,
                    HasMatchingDestinationRule = false,
                    DaysUntilDeparture = 61,
                    CancellationFee = 240
                },
                new BookingCancellationCreditRefundBreakdown()
                {
                    OneTimeUse = (decimal)240.00,
                    Goodwill = (decimal)0.00,
                    GiftCard = (decimal)0.00,
                    Refund = 0,
                    PromoBreakdownItems =
                    [
                    ],
                    OneTimeUseCreditStructure = new OneTimeUseCreditStructure()
                    {
                        GoodwillCreditMadeOf =
                            new ReadOnlyCollection<MadeOf>([new MadeOf("goodwill transaction id", 60)]),
                        PromoCreditMadeOf = new ReadOnlyCollection<MadeOfWithReason>([
                            new MadeOfWithReason("tesco transaction id", 120, PaymentCodes["PromoTesco"].Reason),
                        ]),
                        GiftCardCreditMadeOf =
                            new ReadOnlyCollection<MadeOf>([new MadeOf("gift card transaction id", 60)]),
                        OneTimeUseCreditMadeOf = new([]),
                    }
                },
                0, "OneTimeUseCreditMadeOfDepositPaidByTescoTypesAndCredits"
            },
            new object[]
            {
                new TransferObject()
                {
                    TotalPrice = 1858.70m,
                    PromoCreditAmount = (decimal)60.01,
                    TescoCreditAmount = 60,
                    GoodwillCreditAmount = 60,
                    GiftCardCreditAmount = 60,
                    OneTimeUseAmount = 0,
                    CashAmount = 0,
                    PassengersCount = 4,
                    RefundOptionType = BookingCancellationRequestRefundOption.Credit,
                    HasMatchingDestinationRule = false,
                    DaysUntilDeparture = 61,
                    CancellationFee = 240
                },
                new BookingCancellationCreditRefundBreakdown()
                {
                    OneTimeUse = (decimal)240.00,
                    Goodwill = (decimal)0.00,
                    GiftCard = (decimal)0.00,
                    Refund = 0,
                    PromoBreakdownItems =
                    [
                        new BookingCancellationPromoRefundBreakdownItem()
                        {
                            Amount = (decimal)0.01,
                            ExpirationDate = PaymentCodes["PromotionStaffCredit2324"].ExpirationDate,
                            PromoId = 6,
                            Reason = PaymentCodes["PromotionStaffCredit2324"].Reason,
                            MadeOf =
                            [
                                new MadeOfWithReason("promo transaction id", 0.01m,
                                    PaymentCodes["PromotionStaffCredit2324"].Reason)
                            ]
                        }
                    ],
                    OneTimeUseCreditStructure = new OneTimeUseCreditStructure()
                    {
                        GoodwillCreditMadeOf =
                            new ReadOnlyCollection<MadeOf>([new MadeOf("goodwill transaction id", 60)]),
                        PromoCreditMadeOf = new ReadOnlyCollection<MadeOfWithReason>([
                            new MadeOfWithReason("promo transaction id", 60,
                                PaymentCodes["PromotionStaffCredit2324"].Reason),
                            new MadeOfWithReason("tesco transaction id", 60, PaymentCodes["PromoTesco"].Reason)
                        ]),
                        GiftCardCreditMadeOf =
                            new ReadOnlyCollection<MadeOf>([new MadeOf("gift card transaction id", 60)]),
                        OneTimeUseCreditMadeOf = new([]),
                    }
                },
                0, "OneTimeUseCreditMadeOfDepositPaidByTwoPromoTypesAndCreditsAndSmallRefund"
            },
            new object[]
            {
                new TransferObject()
                {
                    TotalPrice = 1858.70m,
                    PromoCreditAmount = 0,
                    TescoCreditAmount = 0,
                    GoodwillCreditAmount = 0,
                    GiftCardCreditAmount = 0,
                    OneTimeUseAmount = 80,
                    CashAmount = 1778.70m,
                    PassengersCount = 4,
                    RefundOptionType = BookingCancellationRequestRefundOption.Credit,
                    HasMatchingDestinationRule = false,
                    DaysUntilDeparture = 63,
                    CancellationFee = 240
                },
                new BookingCancellationCreditRefundBreakdown()
                {
                    OneTimeUse = (decimal)160.00,
                    Goodwill = (decimal)0.00,
                    GiftCard = (decimal)0.00,
                    Refund = 1618.70m,
                    PromoBreakdownItems =
                    [
                    ],
                    OneTimeUseCreditStructure = new OneTimeUseCreditStructure() { OneTimeUseCreditMadeOf = new([]), }
                },
                0, "OneTimeUseCreditMadeOfDepositPaidByOTUCAndCash"
            },
            new object[]
            {
                new TransferObject()
                {
                    TotalPrice = 1858.70m,
                    PromoCreditAmount = 0,
                    TescoCreditAmount = 0,
                    GoodwillCreditAmount = 0,
                    GiftCardCreditAmount = 0,
                    OneTimeUseAmount = 0,
                    CashAmount = 1858.70m,
                    PassengersCount = 4,
                    RefundOptionType = BookingCancellationRequestRefundOption.Credit,
                    HasMatchingDestinationRule = false,
                    DaysUntilDeparture = 59,
                    CancellationFee = 240,
                },
                new BookingCancellationCreditRefundBreakdown()
                {
                    OneTimeUse = (decimal)0.00,
                    Goodwill = (decimal)0.00,
                    GiftCard = (decimal)0.00,
                    Refund = 1618.70m,
                    PromoBreakdownItems =
                    [
                    ],
                    OneTimeUseCreditStructure = new OneTimeUseCreditStructure() { OneTimeUseCreditMadeOf = new([]), }
                },
                0, "RefundCreditMadeOfCash"
            },
            new object[]
            {
                new TransferObject()
                {
                    TotalPrice = 1858.70m,
                    PromoCreditAmount = 0,
                    TescoCreditAmount = 0,
                    GoodwillCreditAmount = 0,
                    GiftCardCreditAmount = 0,
                    OneTimeUseAmount = 0,
                    CashAmount = 1858.70m,
                    PassengersCount = 4,
                    RefundOptionType = BookingCancellationRequestRefundOption.Credit,
                    HasMatchingDestinationRule = false,
                    DaysUntilDeparture = 59,
                    CancellationFee = 240,
                    AmendmentFee = 75
                },
                new BookingCancellationCreditRefundBreakdown()
                {
                    OneTimeUse = (decimal)0.00,
                    Goodwill = (decimal)0.00,
                    GiftCard = (decimal)0.00,
                    Refund = (decimal)1543.70,
                    PromoBreakdownItems =
                    [
                    ],
                    OneTimeUseCreditStructure = new OneTimeUseCreditStructure() { OneTimeUseCreditMadeOf = new([]), }
                },
                0, "RefundCreditMadeOfCashAndReducedAmendmentFee"
            },
            new object[]
            {
                new TransferObject()
                {
                    TotalPrice = 1000,
                    PromoCreditAmount = 0,
                    GoodwillCreditAmount = 0,
                    GiftCardCreditAmount = 0,
                    CashAmount = 1000,
                    PassengersCount = 3,
                    RefundOptionType = BookingCancellationRequestRefundOption.Credit,
                    CancellationFee = 2 * 60,
                    AmendmentFee = 75
                },
                new BookingCancellationCreditRefundBreakdown()
                {
                    OneTimeUse = 120,
                    Goodwill = 0,
                    GiftCard = 0,
                    Refund = 805,
                    PromoBreakdownItems = [],
                    OneTimeUseCreditStructure = new() { OneTimeUseCreditMadeOf = new([]) }
                },
                0, "FullPayedWithCashReturnCreditCheckAmendmentFeeThatIsNotInOtuc"
            },
            new object[]
            {
                new TransferObject()
                {
                    TotalPrice = 1000,
                    PromoCreditAmount = 0,
                    GoodwillCreditAmount = 0,
                    GiftCardCreditAmount = 0,
                    CashAmount = 120,
                    PassengersCount = 2,
                    RefundOptionType = BookingCancellationRequestRefundOption.Credit,
                    CancellationFee = 2 * 60,
                    AmendmentFee = 50
                },
                new BookingCancellationCreditRefundBreakdown()
                {
                    OneTimeUse = 120,
                    Goodwill = 0,
                    GiftCard = 0,
                    Refund = 0,
                    PromoBreakdownItems = [],
                    OneTimeUseCreditStructure = new() { OneTimeUseCreditMadeOf = new([]) }
                },
                0, "OnlyPayedDepositBiggerFeeThanPayed"
            },
            new object[]
            {
                new TransferObject()
                {
                    TotalPrice = 1858.70m,
                    PromoCreditAmount = 0,
                    TescoCreditAmount = 0,
                    GoodwillCreditAmount = 0,
                    GiftCardCreditAmount = 0,
                    OneTimeUseAmount = 80,
                    CashAmount = 1778.70m,
                    PassengersCount = 4,
                    RefundOptionType = BookingCancellationRequestRefundOption.Credit,
                    HasMatchingDestinationRule = false,
                    DaysUntilDeparture = 63,
                    CancellationFee = 240,
                    AmendmentFee = 100
                },
                new BookingCancellationCreditRefundBreakdown()
                {
                    OneTimeUse = (decimal)160.00,
                    Goodwill = (decimal)0.00,
                    GiftCard = (decimal)0.00,
                    Refund = 1518.70m,
                    PromoBreakdownItems =
                    [
                    ],
                    OneTimeUseCreditStructure = new OneTimeUseCreditStructure() { OneTimeUseCreditMadeOf = new([]), }
                },
                0, "OneTimeUseCreditMadeOfDepositPaidByOTUCAndCashAndExtraAmendmentFees"
            },
            new object[]
            {
                new TransferObject()
                {
                    TotalPrice = 1858.70m,
                    PromoCreditAmount = 0,
                    TescoCreditAmount = 0,
                    GoodwillCreditAmount = 0,
                    GiftCardCreditAmount = 0,
                    OneTimeUseAmount = 80,
                    CashAmount = 1778.70m,
                    PassengersCount = 4,
                    RefundOptionType = BookingCancellationRequestRefundOption.Credit,
                    HasMatchingDestinationRule = false,
                    DaysUntilDeparture = 63,
                    CancellationFee = 240,
                    AmendmentFee = 100,
                    OverrideFeeAmount = 50
                },
                new BookingCancellationCreditRefundBreakdown()
                {
                    OneTimeUse = (decimal)30.00,
                    Goodwill = (decimal)0.00,
                    GiftCard = (decimal)0.00,
                    Refund = 1778.70m,
                    PromoBreakdownItems =
                    [
                    ],
                    OneTimeUseCreditStructure = new OneTimeUseCreditStructure() { OneTimeUseCreditMadeOf = new(new List<MadeOf>() { new MadeOf("one time use credit transaction id", 30) }), }
                },
                0, "OneTimeUseCreditMadeOfDepositPaidByOTUCAndCashAndExtraAmendmentFeesOverrideWith50"
            }
        };
    }

    [Fact]
    public void GetCreditToKept_ReturnsZero_WhenEmptyPaymentInfoInBooking()
    {
        // Arrange
        var bookingResponse = new BookingResponse();
        var totalRefundCreditAmount = 0m;
        var oneTimeUseCreditKeptAmount = 0m;
        var oneTimeUseCreditRefundAmount = 0m;

        // Act
        var result = BookingCancellationCalculateCreditRefundService.GetCreditToKept(
            bookingResponse, totalRefundCreditAmount, oneTimeUseCreditKeptAmount, oneTimeUseCreditRefundAmount);

        // Assert
        result.Should().Be(0);
    }

    [Fact]
    public void GetCreditToKept_ReturnsZero_WhenEmptyPaymentHisotryInBooking()
    {
        // Arrange
        var bookingResponse = new BookingResponse
        {
            PaymentInfo = new PriceInfo()
        };
        var totalRefundCreditAmount = 0m;
        var oneTimeUseCreditKeptAmount = 0m;
        var oneTimeUseCreditRefundAmount = 0m;

        // Act
        var result = BookingCancellationCalculateCreditRefundService.GetCreditToKept(
            bookingResponse, totalRefundCreditAmount, oneTimeUseCreditKeptAmount, oneTimeUseCreditRefundAmount);

        // Assert
        result.Should().Be(0);
    }
    
    [Fact]
    public void GetCreditToKept_ReturnsZero_WhenNoCreditsInBooking()
    {
        // Arrange
        var bookingResponse = new BookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                PaymentHistory = new List<PaymentHistoryItem> { CashPayment(100m) }.ToArray()
            }
        };
        var totalRefundCreditAmount = 0m;
        var oneTimeUseCreditKeptAmount = 0m;
        var oneTimeUseCreditRefundAmount = 0m;

        // Act
        var result = BookingCancellationCalculateCreditRefundService.GetCreditToKept(
            bookingResponse, totalRefundCreditAmount, oneTimeUseCreditKeptAmount, oneTimeUseCreditRefundAmount);

        // Assert
        result.Should().Be(0);
    }

    [Fact]
    public void GetCreditToKept_ReturnsCorrectAmount_WhenCreditsExceedRefundAndKeptAmounts()
    {
        // Arrange
        var bookingResponse = new BookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                PaymentHistory = new List<PaymentHistoryItem> { OneTimeUseCreditPayment(200m) }.ToArray()
            }
        };
        var totalRefundCreditAmount = 50m;
        var oneTimeUseCreditKeptAmount = 30m;
        var oneTimeUseCreditRefundAmount = 20m;

        // Act
        var result = BookingCancellationCalculateCreditRefundService.GetCreditToKept(
            bookingResponse, totalRefundCreditAmount, oneTimeUseCreditKeptAmount, oneTimeUseCreditRefundAmount);

        // Assert
        result.Should().Be(100);
    }

    [Fact]
    public void GetCreditToKept_ReturnsZero_WhenRefundAndKeptAmountsExceedCredits()
    {
        // Arrange
        var bookingResponse = new BookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                PaymentHistory = new List<PaymentHistoryItem> { GiftCardCreditPayment(100m) }.ToArray()
            }
        };
        var totalRefundCreditAmount = 50m;
        var oneTimeUseCreditKeptAmount = 30m;
        var oneTimeUseCreditRefundAmount = 50m;

        // Act
        var result = BookingCancellationCalculateCreditRefundService.GetCreditToKept(
            bookingResponse, totalRefundCreditAmount, oneTimeUseCreditKeptAmount, oneTimeUseCreditRefundAmount);

        // Assert
        result.Should().Be(0);
    }

    [Fact]
    public void GetCreditToKept_ReturnsCorrectAmount_WhenMultipleCreditsExist()
    {
        // Arrange
        var bookingResponse = new BookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                PaymentHistory = new List<PaymentHistoryItem> { PromoCreditPayment(100m), GoodWillPayment(50m) }
                    .ToArray()
            }
        };
        var totalRefundCreditAmount = 50m;
        var oneTimeUseCreditKeptAmount = 30m;
        var oneTimeUseCreditRefundAmount = 20m;

        // Act
        var result = BookingCancellationCalculateCreditRefundService.GetCreditToKept(
            bookingResponse, totalRefundCreditAmount, oneTimeUseCreditKeptAmount, oneTimeUseCreditRefundAmount);

        // Assert
        result.Should().Be(50);
    }

    public class TransferObject
    {
        public decimal TotalPrice { get; set; }
        public decimal PromoCreditAmount { get; set; }
        public decimal TescoCreditAmount { get; set; }
        public decimal GoodwillCreditAmount { get; set; }
        public decimal GiftCardCreditAmount { get; set; }
        public decimal OneTimeUseAmount { get; set; }
        public decimal CashAmount { get; set; }
        public decimal PassengersCount { get; set; }
        public BookingCancellationRequestRefundOption RefundOptionType { get; set; }
        public bool HasMatchingDestinationRule { get; set; }
        public int DaysUntilDeparture { get; set; } = 100;
        public decimal CancellationFee { get; set; }
        public decimal? AmendmentFee { get; set; }
        public decimal? OverrideFeeAmount { get; set; }
    }
}