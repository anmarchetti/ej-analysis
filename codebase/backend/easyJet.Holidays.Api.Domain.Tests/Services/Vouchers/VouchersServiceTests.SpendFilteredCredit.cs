using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Moq;
using Voucherify.DataModel;
using Xunit;
using Redemption = easyJet.Holidays.Api.Domain.Data.Vouchers.Redemption;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Vouchers;

public partial class VouchersServiceTests
{
    [Fact]
    public async Task SpendFilteredCredit_ExcludePromotionalVouchers()
    {
        // Arrange
        var currentBookingRef = "123";
        var sut = MockHappyPath(out var authService, out var bookingRepository, out var bookingPaymentsRepository,
            out var customersRepository, out var vouchersRepository, out var booking, out var cacheService);

        Gift gift = BuildGift();
        VoucherWithCustomer voucherWithCustomer = BuildVoucher(gift, "refund", "GBP", "test_v", currentBookingRef);
        VoucherWithCustomer promotionalVoucher = BuildVoucher(gift, "Promotion", "GBP", "test_v", currentBookingRef);
        VoucherWithCustomer otherVouhcherPromo = BuildVoucher(gift, "Promotion", "GBP", "test_v", "otherRef");
        VoucherWithCustomer otherVouhcherRefund = BuildVoucher(gift, "refund", "GBP", "test_v", "otherRef");

        customersRepository.Setup(x => x.GetCustomerVouchers(It.IsAny<string>())).ReturnsAsync([voucherWithCustomer, promotionalVoucher, otherVouhcherPromo, otherVouhcherRefund]);

        ValidationWithMeta validation = BuildValidation();
        vouchersRepository.Setup(x => x.ValidateRedemption(It.IsAny<string>(), It.IsAny<decimal>(), It.IsAny<string>(),
            It.IsAny<Dictionary<string, object>>())).ReturnsAsync(validation);

        Redemption redemption = BuildRedemption(voucherWithCustomer);
        vouchersRepository.Setup(x => x.ProcessRedemption(It.IsAny<string>(), It.IsAny<decimal>(), It.IsAny<string>(),
            It.IsAny<Dictionary<string, object>>())).ReturnsAsync(redemption);

        // Act
        var redemptionIDs = await sut.SpendFilteredCredits(50, Currency.GBP, currentBookingRef, null, null);

        redemptionIDs.Count().Should().Be(1);
        redemptionIDs.ElementAt(0).Should().BeEquivalentTo(new CreditSpend
        {
            Amount = 50M,
            RedemptionIds = "r_ID",
            VouchersIds = "test_v",
            ReasonCode = "refund"
        });
    }

    [Theory]
    [MemberData(nameof(GetPromotionTypesTestData))]
    public async Task SpendFilteredCredit_MissingVouchersSettingsTypes(VoucherReasonSettings vouchers)
    {
        // Arrange
        ApiSettings apiSettings = BuildSettings(vouchers);

        var sut = MockHappyPathWithSettings(out var authService, out var bookingRepository, out var bookingPaymentsRepository,
            out var customersRepository, out var vouchersRepository, out var booking, out var cacheService, apiSettings);

        Gift gift = BuildGift();

        VoucherWithCustomer voucherWithCustomer = BuildVoucher(gift, "refund", "GBP", "test_v");

        customersRepository.Setup(x => x.GetCustomerVouchers(It.IsAny<string>())).ReturnsAsync([voucherWithCustomer]);

        ValidationWithMeta validation = BuildValidation();
        vouchersRepository.Setup(x => x.ValidateRedemption(It.IsAny<string>(), It.IsAny<decimal>(), It.IsAny<string>(),
            It.IsAny<Dictionary<string, object>>())).ReturnsAsync(validation);

        Redemption redemption = BuildRedemption(voucherWithCustomer);
        vouchersRepository.Setup(x => x.ProcessRedemption(It.IsAny<string>(), It.IsAny<decimal>(), It.IsAny<string>(),
            It.IsAny<Dictionary<string, object>>())).ReturnsAsync(redemption);

        // Act
        var redemptionIDs = await sut.SpendFilteredCredits(50, Currency.GBP, null, null, null);

        redemptionIDs.Count().Should().Be(1);
        redemptionIDs.ElementAt(0).Should().BeEquivalentTo(new CreditSpend
        {
            Amount = 50M,
            RedemptionIds = "r_ID",
            VouchersIds = "test_v",
            ReasonCode = "refund"
        });
    }
    private static Redemption BuildRedemption(VoucherWithCustomer voucherWithCustomer)
    {
        var redemption = new Redemption();
        redemption.SetProperty(x => x.Id, "r_ID");
        redemption.SetProperty(x => x.Voucher, voucherWithCustomer);
        redemption.SetProperty(x => x.Amount, 5000);
        return redemption;
    }

    private static ValidationWithMeta BuildValidation()
    {
        var validation = new ValidationWithMeta();
        validation.SetProperty(x => x.Valid, true);
        return validation;
    }

    private static Gift BuildGift()
    {
        Gift gift = new();
        gift.SetProperty(x => x.Amount, 10000);
        gift.SetProperty(x => x.Balance, 10000);
        return gift;
    }

    private static VoucherWithCustomer BuildVoucher(Gift gift, string reason, string currency, string code, string bookingref = null)
    {
        var voucherWithCustomer = new VoucherWithCustomer();
        voucherWithCustomer.SetProperty(x => x.Active, true);
        voucherWithCustomer.SetProperty(x => x.Metadata, CreateMetadata(reason: reason, currency: currency, bookingRef: bookingref));
        voucherWithCustomer.SetProperty(x => x.Code, code);
        voucherWithCustomer.SetProperty(x => x.Gift, gift);
        return voucherWithCustomer;
    }

    private static ApiSettings BuildSettings(VoucherReasonSettings vouchers)
    {
        return new ApiSettings
        {
            Vouchers = new VoucherSettings
            {
                BookingMemos = new BookingMemoSettings
                {
                    Cred = new MemoSettings
                    {
                        Code = "CRED",
                        Description = "Voucher created"
                    },
                    MovedToCredit = new MemoSettings
                    {
                        Code = "REF3",
                    }
                },
                Metadata = new Dictionary<string, object> {
                        {"reason", "refund" },
                        { "currency",  "GBP"}
                    },
                PromoVouchers = vouchers,
                Types = new VoucherTypeSettings
                {
                    Goodwill = "goodwill",
                    Incentive = "incentive",
                    Refund = "refund",
                    GiftCard = "giftcard",
                    OneTimeUse = "onetimeuse"
                },
                GiftCards = new VoucherReasonSettings()
                {
                    Types = new List<string>() { "Vouchers - Commercial" }
                },
                Source = new VoucherifySource
                {
                    BulkTool = "Bulk Tool",
                    CallCentre = "Call Centre",
                    Web = "Web"
                },
                DefaultDepositPerPerson = 60,
            }
        };
    }

    public static IEnumerable<object[]> GetPromotionTypesTestData()
    {
        yield return new object[] {
                new VoucherReasonSettings
                {
                    Types = ["Promotion"]
                }
            };

        yield return new object[] {
            new VoucherReasonSettings
            {
                Types = []
            }
        };

        yield return new object[] {
            new VoucherReasonSettings()
         };

        yield return new object[] {
            null
         };
    }
}