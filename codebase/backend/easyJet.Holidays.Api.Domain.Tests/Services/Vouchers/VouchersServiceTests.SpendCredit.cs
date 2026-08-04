using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Moq;
using Voucherify.DataModel;
using Xunit;
using Redemption = easyJet.Holidays.Api.Domain.Data.Vouchers.Redemption;
using Voucher = Voucherify.DataModel.Voucher;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Vouchers;

public partial class VouchersServiceTests
{
    #region SpendCredit

    [Fact]
    public async Task SpendCredit_Single()
    {
        // Arrange
        var sut = MockHappyPath(out var authService, out var bookingRepository, out var bookingPaymentsRepository,
            out var customersRepository, out var vouchersRepository, out var booking, out var cacheService);
        var gift = new Gift();
        gift.SetProperty(x => x.Amount, 10000);
        gift.SetProperty(x => x.Balance, 10000);
        var v1 = new VoucherWithCustomer();
        v1.SetProperty(x => x.Active, true);
        v1.SetProperty(x => x.Metadata, CreateMetadata(reason: "refund", currency: "GBP"));
        v1.SetProperty(x => x.Code, "test_v");
        v1.SetProperty(x => x.Gift, gift);

        customersRepository.Setup(x => x.GetCustomerVouchers(It.IsAny<string>()))
            .ReturnsAsync(new List<VoucherWithCustomer>(new VoucherWithCustomer[1] { v1 }));
        var validation = new ValidationWithMeta();
        validation.SetProperty(x => x.Valid, true);
        vouchersRepository.Setup(x => x.ValidateRedemption(It.IsAny<string>(), It.IsAny<decimal>(), It.IsAny<string>(),
            It.IsAny<Dictionary<string, object>>())).ReturnsAsync(validation);

        var redemption = new Redemption();
        redemption.SetProperty(x => x.Id, "r_ID");
        redemption.SetProperty(x => x.Voucher, v1);
        redemption.SetProperty(x => x.Amount, 5000);
        vouchersRepository.Setup(x => x.ProcessRedemption(It.IsAny<string>(), It.IsAny<decimal>(), It.IsAny<string>(),
            It.IsAny<Dictionary<string, object>>())).ReturnsAsync(redemption);

        // Act
        var redemptionIDs = await sut.SpendCredits(50, Currency.GBP, null, null, null);

        redemptionIDs.Count().Should().Be(1);
        redemptionIDs.ElementAt(0).Should().BeEquivalentTo(new CreditSpend
        {
            Amount = 50M, RedemptionIds = "r_ID", VouchersIds = "test_v", ReasonCode = "refund"
        });
    }

    [Fact]
    public async Task SpendCredit_Multiple_UseMultipleVouchersAndCombineByType()
    {
        // Arrange
        var sut = MockHappyPath(out var authService, out var bookingRepository, out var bookingPaymentsRepository,
            out var customersRepository, out var vouchersRepository, out var booking, out var cacheService);

        Func<decimal, string, string, VoucherWithCustomer> createVoucherFunc = (amount, code, reason) =>
        {
            var gift = new Gift();
            gift.SetProperty(x => x.Amount, (int)(amount * 100));
            gift.SetProperty(x => x.Balance, (int)(amount * 100));
            var v = new VoucherWithCustomer();
            v.SetProperty(x => x.Active, true);
            v.SetProperty(x => x.Metadata, CreateMetadata(reason: reason, currency: "GBP"));
            v.SetProperty(x => x.Code, code);
            v.SetProperty(x => x.Gift, gift);
            v.SetProperty(x => x.ExpirationDate, DateTime.Now.AddDays(4));

            return v;
        };

        var v1 = createVoucherFunc(10, "voucher_1", "refund");
        var v2 = createVoucherFunc(9, "voucher_2", "refund");
        var v3 = createVoucherFunc(8, "voucher_3", "incentive");
        var v4 = createVoucherFunc(7, "voucher_5", "goodwill");

        customersRepository.Setup(x => x.GetCustomerVouchers(It.IsAny<string>()))
            .ReturnsAsync(new List<VoucherWithCustomer> { v4, v3, v2, v1 });
        var validation = new ValidationWithMeta();
        validation.SetProperty(x => x.Valid, true);
        vouchersRepository.Setup(x => x.ValidateRedemption(It.IsAny<string>(), It.IsAny<decimal>(), It.IsAny<string>(),
            It.IsAny<Dictionary<string, object>>())).ReturnsAsync(validation);

        var redemption1 = new Redemption();
        var voucher1 = new Voucher();
        voucher1.SetProperty(x => x.Code, "v_1");
        redemption1.SetProperty(x => x.Id, "r_1");
        redemption1.SetProperty(x => x.Voucher, voucher1);
        redemption1.SetProperty(x => x.Amount, 1000);
        vouchersRepository
            .Setup(x => x.ProcessRedemption(It.IsAny<string>(), (decimal)10, It.IsAny<string>(),
                It.IsAny<Dictionary<string, object>>())).ReturnsAsync(redemption1);

        var redemption2 = new Redemption();
        var voucher2 = new Voucher();
        voucher2.SetProperty(x => x.Code, "v_2");
        redemption2.SetProperty(x => x.Id, "r_2");
        redemption2.SetProperty(x => x.Voucher, voucher2);
        redemption2.SetProperty(x => x.Amount, 900);
        vouchersRepository
            .Setup(x => x.ProcessRedemption(It.IsAny<string>(), (decimal)9, It.IsAny<string>(),
                It.IsAny<Dictionary<string, object>>())).ReturnsAsync(redemption2);

        var redemption3 = new Redemption();
        var voucher3 = new Voucher();
        voucher3.SetProperty(x => x.Code, "v_3");
        redemption3.SetProperty(x => x.Id, "r_3");
        redemption3.SetProperty(x => x.Voucher, voucher3);
        redemption3.SetProperty(x => x.Amount, 800);
        vouchersRepository
            .Setup(x => x.ProcessRedemption(It.IsAny<string>(), (decimal)8, It.IsAny<string>(),
                It.IsAny<Dictionary<string, object>>())).ReturnsAsync(redemption3);

        var redemption4 = new Redemption();
        var voucher4 = new Voucher();
        voucher4.SetProperty(x => x.Code, "v_4");
        redemption4.SetProperty(x => x.Id, "r_4");
        redemption4.SetProperty(x => x.Voucher, voucher4);
        redemption4.SetProperty(x => x.Amount, 500);
        vouchersRepository
            .Setup(x => x.ProcessRedemption(It.IsAny<string>(), (decimal)5, It.IsAny<string>(),
                It.IsAny<Dictionary<string, object>>())).ReturnsAsync(redemption4);

        // Act
        var spendResults = await sut.SpendCredits((10 + 9 + 8 + 5), Currency.GBP, null, null, null);

        spendResults.Count.Should().Be(4);
        spendResults.Should().BeEquivalentTo(new List<CreditSpend>
        {
            new CreditSpend
            {
                ReasonCode = "refund", Amount = 10, RedemptionIds = "r_1", VouchersIds = "v_1",
            },
            new CreditSpend
            {
                ReasonCode = "refund", Amount = 9, RedemptionIds = "r_2", VouchersIds = "v_2",
            },
            new CreditSpend
            {
                ReasonCode = "incentive", Amount = 8, RedemptionIds = "r_3", VouchersIds = "v_3",
            },
            new CreditSpend
            {
                ReasonCode = "goodwill", Amount = 5, RedemptionIds = "r_4", VouchersIds = "v_4",
            }
        });
    }

    [Fact]
    public async Task SpendCredit_CreditsInsufficientFunds()
    {
        // Arrange
        var sut = MockHappyPath(out var authService, out var bookingRepository, out var bookingPaymentsRepository,
            out var customersRepository, out var vouchersRepository, out var booking, out var cacheService);
        var gift = new Gift();
        gift.SetProperty(x => x.Amount, 1000);
        gift.SetProperty(x => x.Balance, 1000);
        var v1 = new VoucherWithCustomer();
        v1.SetProperty(x => x.Active, true);
        v1.SetProperty(x => x.Metadata, CreateMetadata(currency: "GBP", marketCode: "UK"));
        v1.SetProperty(x => x.Code, "test_v");
        v1.SetProperty(x => x.Gift, gift);
        v1.SetProperty(x => x.ExpirationDate, DateTime.Now.AddDays(4));


        customersRepository.Setup(x => x.GetCustomerVouchers(It.IsAny<string>()))
            .ReturnsAsync(new List<VoucherWithCustomer> { v1 });

        var redemption = new Redemption();
        redemption.SetProperty(x => x.Id, "r_ID");
        redemption.SetProperty(x => x.Amount, 1000);
        vouchersRepository.Setup(x => x.ProcessRedemption(It.IsAny<string>(), It.IsAny<decimal>(), It.IsAny<string>(),
            It.IsAny<Dictionary<string, object>>())).ReturnsAsync(redemption);

        // Act
        try
        {
            var redemptionIDs = await sut.SpendCredits(50, Currency.GBP, null, null, "UK");
        }
        catch (Exception e)
        {
            (e is VoucherRedeemExeption).Should().BeTrue();
            ((VoucherRedeemExeption)e).Code.Should().Be(ApiExceptionCodes.CreditsInsufficientFunds);
        }
    }

    [Fact]
    public async Task SpendCredit_CreditsFailedToWithdrawFullAmmount()
    {
        // Arrange
        var sut = MockHappyPath(out var authService, out var bookingRepository, out var bookingPaymentsRepository,
            out var customersRepository, out var vouchersRepository, out var booking, out var cacheService);
        var gift = new Gift();
        gift.SetProperty(x => x.Amount, 5000);
        gift.SetProperty(x => x.Balance, 5000);
        var v1 = new VoucherWithCustomer();
        v1.SetProperty(x => x.Active, true);
        v1.SetProperty(x => x.Code, "test_v");
        v1.SetProperty(x => x.Gift, gift);
        v1.SetProperty(x => x.ExpirationDate, DateTime.Parse("2020-04-21T12:44"));
        v1.SetProperty(x => x.Metadata, CreateMetadata(currency: "GBP"));


        customersRepository.Setup(x => x.GetCustomerVouchers(It.IsAny<string>()))
            .ReturnsAsync(new List<VoucherWithCustomer> { v1 });

        var validation = new Validation();
        validation.SetProperty(x => x.Valid, true);
        vouchersRepository.Setup(x => x.ValidateRedemption(It.IsAny<string>(), It.IsAny<decimal>(), It.IsAny<string>(),
            It.IsAny<Dictionary<string, object>>())).Throws(new Exception());

        // Act
        try
        {
            var redemptionIDs = await sut.SpendCredits(50, Currency.GBP, null, null, null);
        }
        catch (Exception e)
        {
            (e is VoucherRedeemExeption).Should().BeTrue();
            ((VoucherRedeemExeption)e).Code.Should().Be(ApiExceptionCodes.CreditsFailedToWithdrawFullAmmount);
        }
    }

    [Fact]
    public async Task SpendCredit_CreditsFailedRedeem()
    {
        // Arrange
        var sut = MockHappyPath(out var authService, out var bookingRepository, out var bookingPaymentsRepository,
            out var customersRepository, out var vouchersRepository, out var booking, out var cacheService);

        customersRepository.Setup(x => x.GetCustomerVouchers(It.IsAny<string>())).Throws(new Exception());

        // Act
        try
        {
            var redemptionIDs = await sut.SpendCredits(50, Currency.GBP, null, null, null);
        }
        catch (Exception e)
        {
            (e is VoucherRedeemExeption).Should().BeTrue();
            ((VoucherRedeemExeption)e).Code.Should().Be(ApiExceptionCodes.CreditsFailedRedeem);
        }
    }

    [Fact]
    public async Task SpendCredit_Multiple_UseMarketVoucherWithCloserExpirationDateFirst()
    {
        // Arrange
        var sut = MockHappyPath(out var authService, out var bookingRepository, out var bookingPaymentsRepository,
            out var customersRepository, out var vouchersRepository, out var booking, out var cacheService);

        Func<decimal, string, string, string, DateTime, VoucherWithCustomer> createVoucherFunc =
            (amount, currency, marketCode, code, expirationDate) =>
            {
                var gift = new Gift();
                gift.SetProperty(x => x.Amount, (int)(amount * 100));
                gift.SetProperty(x => x.Balance, (int)(amount * 100));
                var v = new VoucherWithCustomer();
                v.SetProperty(x => x.Active, true);
                v.SetProperty(x => x.Metadata,
                    CreateMetadata(reason: "refund", currency: currency, marketCode: marketCode));
                v.SetProperty(x => x.Code, code);
                v.SetProperty(x => x.Gift, gift);
                v.SetProperty(x => x.ExpirationDate, expirationDate);

                return v;
            };

        var v1 = createVoucherFunc(2, "EUR", "DE", "voucher_1", DateTime.Now.AddDays(1));
        var v2 = createVoucherFunc(2, "EUR", "FR", "voucher_2", DateTime.Now.AddDays(5));
        var v3 = createVoucherFunc(2, "EUR", "FR", "voucher_3", DateTime.Now.AddDays(3));

        customersRepository.Setup(x => x.GetCustomerVouchers(It.IsAny<string>()))
            .ReturnsAsync(new List<VoucherWithCustomer> { v1, v2, v3 });
        var validation = new ValidationWithMeta();
        validation.SetProperty(x => x.Valid, true);
        vouchersRepository.Setup(x => x.ValidateRedemption(It.IsAny<string>(), It.IsAny<decimal>(), It.IsAny<string>(),
            It.IsAny<Dictionary<string, object>>())).ReturnsAsync(validation);

        var redemption = new Redemption();
        var voucher1 = new Voucher();
        voucher1.SetProperty(x => x.Code, "v_3");
        redemption.SetProperty(x => x.Id, "r_3");
        redemption.SetProperty(x => x.Voucher, voucher1);
        redemption.SetProperty(x => x.Amount, 200);
        vouchersRepository
            .Setup(x => x.ProcessRedemption("voucher_3", 2, It.IsAny<string>(), It.IsAny<Dictionary<string, object>>()))
            .ReturnsAsync(redemption);

        // Act
        var spendResults = await sut.SpendCredits(2, Currency.EUR, null, null, "FR");

        spendResults.Count.Should().Be(1);
        spendResults.Should().BeEquivalentTo(new List<CreditSpend>
        {
            new CreditSpend
            {
                ReasonCode = "refund", Amount = 2, RedemptionIds = "r_3", VouchersIds = "v_3",
            }
        });
    }
    
    [Theory]
    [InlineData(1000, 1000, 1000, 1000, 1000, 0, 0)]
    [InlineData(500, 1000, 1000, 1000, 500, 500, 0)]
    [InlineData(500, 200, 1000, 1000, 500, 200, 300)]
    [InlineData(0, 200, 1000, 1000, 0, 200, 800)]
    [InlineData(0, 0, 1000, 1000, 0, 0, 1000)]
    public async Task SpendCredit_TaskSER278Scenario2_OTUCAgainstAccount(int otucAmount, int staffAmount, int goodwillAmount, int creditValueToRedeem, int expectedOTUCuse, int expectedStaffAmount, int expectedGoodwillAmount)
    {
        // Arrange
        var sut = MockHappyPath(out var authService, out var bookingRepository, out var bookingPaymentsRepository,
            out var customersRepository, out var vouchersRepository, out var booking, out var cacheService);

        Func<decimal, string, string, VoucherWithCustomer> createVoucherFunc = (amount, code, reason) =>
        {
            var gift = new Gift();
            gift.SetProperty(x => x.Amount, (int)(amount * 100));
            gift.SetProperty(x => x.Balance, (int)(amount * 100));
            var v = new VoucherWithCustomer();
            v.SetProperty(x => x.Active, true);
            v.SetProperty(x => x.Metadata, CreateMetadata(reason: reason, currency: "GBP"));
            v.SetProperty(x => x.Code, code);
            v.SetProperty(x => x.Gift, gift);
            v.SetProperty(x => x.ExpirationDate, DateTime.Now.AddDays(4));

            return v;
        };

        var otuc = createVoucherFunc(otucAmount, "otuc", "onetimeuse");
        var staff = createVoucherFunc(staffAmount, "staff", "staff");
        var goodwill = createVoucherFunc(goodwillAmount, "goodwill", "goodwill");

        customersRepository.Setup(x => x.GetCustomerVouchers(It.IsAny<string>()))
            .ReturnsAsync([goodwill, staff, otuc]);
        var validation = new ValidationWithMeta();
        validation.SetProperty(x => x.Valid, true);
        vouchersRepository.Setup(x => x.ValidateRedemption(It.IsAny<string>(), It.IsAny<decimal>(), It.IsAny<string>(),
            It.IsAny<Dictionary<string, object>>())).ReturnsAsync(validation);
        
        vouchersRepository
            .Setup(x => x.ProcessRedemption(It.IsAny<string>(), It.IsAny<decimal>(), It.IsAny<string>(),
                It.IsAny<Dictionary<string, object>>()))
            .ReturnsAsync((string voucherCode, decimal amount, string _, Dictionary<string, object> _) =>
            {
                var redemption = new Redemption();
                var voucher = new Voucher();
                voucher.SetProperty(x => x.Code, $"{voucherCode}Code");
                redemption.SetProperty(x => x.Id, $"{voucherCode}Id");
                redemption.SetProperty(x => x.Voucher, voucher);
                redemption.SetProperty(x => x.Amount, (long)(amount*100));
                return redemption;
            });

        // Act
        var spendResults = await sut.SpendCredits((creditValueToRedeem), Currency.GBP, null, null, null);

        var expectedCount = 0;
        var expectedList = new List<CreditSpend>();
        if (expectedOTUCuse > 0)
        {
            expectedCount++;
            expectedList.Add(new CreditSpend
            {
                ReasonCode = "onetimeuse", Amount = expectedOTUCuse, RedemptionIds = "otucId", VouchersIds = "otucCode",
            });
        }
        if (expectedStaffAmount > 0) {
            expectedCount++;
            expectedList.Add(new CreditSpend
            {
                ReasonCode = "staff", Amount = expectedStaffAmount, RedemptionIds = "staffId", VouchersIds = "staffCode",
            });
        }
        if (expectedGoodwillAmount > 0){
            expectedCount++;
            expectedList.Add(new CreditSpend
            {
                ReasonCode = "goodwill", Amount = expectedGoodwillAmount, RedemptionIds = "goodwillId", VouchersIds = "goodwillCode",
            });
        }
        
        spendResults.Count.Should().Be(expectedCount);
        spendResults.Should().BeEquivalentTo(expectedList);
    }
    
    [Theory]
    [InlineData(1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 0, 0,0,0,0)]
    [InlineData(100, 1000, 1000, 1000, 1000, 1000, 1000, 100, 0, 0,0,0,900)]
    [InlineData(100, 1000, 1000, 1000, 1000, 0, 1000, 100, 0, 0,0,900,0)]
    [InlineData(100, 1000, 1000, 1000, 0, 0, 1000, 100, 0, 0,900,0,0)]
    [InlineData(100, 1000, 1000, 0, 0, 0, 1000, 100, 0, 900,0,0,0)]
    [InlineData(100, 1000, 0, 0, 0, 0, 1000, 100, 900, 0,0,0,0)]
    public async Task SpendCredit_TaskSER278Scenario3_CreditsWithDifferingExpiryDates(int otucAmount, int tescoAmount, 
        int goodwillAmount, int refundAmount, int giftCardAmount, int staffAmount, int creditValueToRedeem, 
        int expectedOtucAmount, int expectedTescoAmount, int expectedGoodwillAmount, int expectedRefundAmount, 
        int expectedGiftCardAmount, int expectedStaffAmount)
    {
        // Arrange
        var sut = MockHappyPath(out var authService, out var bookingRepository, out var bookingPaymentsRepository,
            out var customersRepository, out var vouchersRepository, out var booking, out var cacheService);
        int expirationDateAddition = 7;
        Func<decimal, string, string, VoucherWithCustomer> createVoucherFunc = (amount, code, reason) =>
        {
            var gift = new Gift();
            gift.SetProperty(x => x.Amount, (int)(amount * 100));
            gift.SetProperty(x => x.Balance, (int)(amount * 100));
            var v = new VoucherWithCustomer();
            v.SetProperty(x => x.Active, true);
            v.SetProperty(x => x.Metadata, CreateMetadata(reason: reason, currency: "GBP"));
            v.SetProperty(x => x.Code, code);
            v.SetProperty(x => x.Gift, gift);
            v.SetProperty(x => x.ExpirationDate, DateTime.Now.AddDays(expirationDateAddition++));

            return v;
        };

        var staff = createVoucherFunc(staffAmount, "staff", "staff");
        var giftcard = createVoucherFunc(giftCardAmount, "giftcard", "giftcard");
        var refund = createVoucherFunc(refundAmount, "refund", "refund");
        var goodwill = createVoucherFunc(goodwillAmount, "goodwill", "goodwill");
        var tesco = createVoucherFunc(tescoAmount, "tesco", "tesco");
        var otuc = createVoucherFunc(otucAmount, "otuc", "onetimeuse");

        customersRepository.Setup(x => x.GetCustomerVouchers(It.IsAny<string>()))
            .ReturnsAsync([tesco, goodwill, refund, giftcard, staff, otuc]);
        var validation = new ValidationWithMeta();
        validation.SetProperty(x => x.Valid, true);
        vouchersRepository.Setup(x => x.ValidateRedemption(It.IsAny<string>(), It.IsAny<decimal>(), It.IsAny<string>(),
            It.IsAny<Dictionary<string, object>>())).ReturnsAsync(validation);
        
        vouchersRepository
            .Setup(x => x.ProcessRedemption(It.IsAny<string>(), It.IsAny<decimal>(), It.IsAny<string>(),
                It.IsAny<Dictionary<string, object>>()))
            .ReturnsAsync((string voucherCode, decimal amount, string _, Dictionary<string, object> _) =>
            {
                var redemption = new Redemption();
                var voucher = new Voucher();
                voucher.SetProperty(x => x.Code, $"{voucherCode}Code");
                redemption.SetProperty(x => x.Id, $"{voucherCode}Id");
                redemption.SetProperty(x => x.Voucher, voucher);
                redemption.SetProperty(x => x.Amount, (long)(amount*100));
                return redemption;
            });

        // Act
        var spendResults = await sut.SpendCredits((creditValueToRedeem), Currency.GBP, null, null, null);

        var expectedCount = 0;
        var expectedList = new List<CreditSpend>();
        if (expectedOtucAmount > 0)
        {
            expectedCount++;
            expectedList.Add(new CreditSpend
            {
                ReasonCode = "onetimeuse", Amount = expectedOtucAmount, RedemptionIds = "otucId", VouchersIds = "otucCode",
            });
        }
        if (expectedTescoAmount > 0) {
            expectedCount++;
            expectedList.Add(new CreditSpend
            {
                ReasonCode = "tesco", Amount = expectedTescoAmount, RedemptionIds = "tescoId", VouchersIds = "tescoCode",
            });
        }
        if (expectedGoodwillAmount > 0){
            expectedCount++;
            expectedList.Add(new CreditSpend
            {
                ReasonCode = "goodwill", Amount = expectedGoodwillAmount, RedemptionIds = "goodwillId", VouchersIds = "goodwillCode",
            });
        }
        if (expectedRefundAmount > 0){
            expectedCount++;
            expectedList.Add(new CreditSpend
            {
                ReasonCode = "refund", Amount = expectedRefundAmount, RedemptionIds = "refundId", VouchersIds = "refundCode",
            });
        }
        
        if (expectedGiftCardAmount > 0){
            expectedCount++;
            expectedList.Add(new CreditSpend
            {
                ReasonCode = "giftcard", Amount = expectedGiftCardAmount, RedemptionIds = "giftcardId", VouchersIds = "giftcardCode",
            });
        }
        if (expectedStaffAmount > 0) {
            expectedCount++;
            expectedList.Add(new CreditSpend
            {
                ReasonCode = "staff", Amount = expectedStaffAmount, RedemptionIds = "staffId", VouchersIds = "staffCode",
            });
        }
        
        spendResults.Count.Should().Be(expectedCount);
        spendResults.Should().BeEquivalentTo(expectedList);
    }
    
    [Theory]
    [InlineData(1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 0, 0,0,0,0)]
    public async Task SpendCredit_TaskSER278Scenario4_CreditsWithTheSameExpiryDates(int otucAmount, int tescoAmount, 
        int goodwillAmount, int refundAmount, int giftCardAmount, int staffAmount, int creditValueToRedeem, 
        int expectedOtucAmount, int expectedTescoAmount, int expectedGoodwillAmount, int expectedRefundAmount, 
        int expectedGiftCardAmount, int expectedStaffAmount)
    {
        // Arrange
        var sut = MockHappyPath(out var authService, out var bookingRepository, out var bookingPaymentsRepository,
            out var customersRepository, out var vouchersRepository, out var booking, out var cacheService);
        DateTime expiryDate = DateTime.Now.AddDays(7);
        Func<decimal, string, string, VoucherWithCustomer> createVoucherFunc = (amount, code, reason) =>
        {
            var gift = new Gift();
            gift.SetProperty(x => x.Amount, (int)(amount * 100));
            gift.SetProperty(x => x.Balance, (int)(amount * 100));
            var v = new VoucherWithCustomer();
            v.SetProperty(x => x.Active, true);
            v.SetProperty(x => x.Metadata, CreateMetadata(reason: reason, currency: "GBP"));
            v.SetProperty(x => x.Code, code);
            v.SetProperty(x => x.Gift, gift);
            v.SetProperty(x => x.ExpirationDate, expiryDate);

            return v;
        };

        var otuc = createVoucherFunc(otucAmount, "otuc", "onetimeuse");
        var tesco = createVoucherFunc(tescoAmount, "tesco", "tesco");
        var goodwill = createVoucherFunc(goodwillAmount, "goodwill", "goodwill");
        var refund = createVoucherFunc(refundAmount, "refund", "refund");
        var giftcard = createVoucherFunc(giftCardAmount, "giftcard", "giftcard");
        var staff = createVoucherFunc(staffAmount, "staff", "staff");

        customersRepository.Setup(x => x.GetCustomerVouchers(It.IsAny<string>()))
            .ReturnsAsync([staff, giftcard, refund, goodwill, tesco, otuc]);
        var validation = new ValidationWithMeta();
        validation.SetProperty(x => x.Valid, true);
        vouchersRepository.Setup(x => x.ValidateRedemption(It.IsAny<string>(), It.IsAny<decimal>(), It.IsAny<string>(),
            It.IsAny<Dictionary<string, object>>())).ReturnsAsync(validation);
        
        vouchersRepository
            .Setup(x => x.ProcessRedemption(It.IsAny<string>(), It.IsAny<decimal>(), It.IsAny<string>(),
                It.IsAny<Dictionary<string, object>>()))
            .ReturnsAsync((string voucherCode, decimal amount, string _, Dictionary<string, object> _) =>
            {
                var redemption = new Redemption();
                var voucher = new Voucher();
                voucher.SetProperty(x => x.Code, $"{voucherCode}Code");
                redemption.SetProperty(x => x.Id, $"{voucherCode}Id");
                redemption.SetProperty(x => x.Voucher, voucher);
                redemption.SetProperty(x => x.Amount, (long)(amount*100));
                return redemption;
            });

        // Act
        var spendResults = await sut.SpendCredits((creditValueToRedeem), Currency.GBP, null, null, null);

        var expectedCount = 0;
        var expectedList = new List<CreditSpend>();
        if (expectedOtucAmount > 0)
        {
            expectedCount++;
            expectedList.Add(new CreditSpend
            {
                ReasonCode = "onetimeuse", Amount = expectedOtucAmount, RedemptionIds = "otucId", VouchersIds = "otucCode",
            });
        }
        if (expectedTescoAmount > 0) {
            expectedCount++;
            expectedList.Add(new CreditSpend
            {
                ReasonCode = "tesco", Amount = expectedTescoAmount, RedemptionIds = "tescoId", VouchersIds = "tescoCode",
            });
        }
        if (expectedGoodwillAmount > 0){
            expectedCount++;
            expectedList.Add(new CreditSpend
            {
                ReasonCode = "goodwill", Amount = expectedGoodwillAmount, RedemptionIds = "goodwillId", VouchersIds = "goodwillCode",
            });
        }
        if (expectedRefundAmount > 0){
            expectedCount++;
            expectedList.Add(new CreditSpend
            {
                ReasonCode = "refund", Amount = expectedRefundAmount, RedemptionIds = "refundId", VouchersIds = "refundCode",
            });
        }
        
        if (expectedGiftCardAmount > 0){
            expectedCount++;
            expectedList.Add(new CreditSpend
            {
                ReasonCode = "giftcard", Amount = expectedGiftCardAmount, RedemptionIds = "giftcardId", VouchersIds = "giftcardCode",
            });
        }
        if (expectedStaffAmount > 0) {
            expectedCount++;
            expectedList.Add(new CreditSpend
            {
                ReasonCode = "staff", Amount = expectedStaffAmount, RedemptionIds = "staffId", VouchersIds = "staffCode",
            });
        }
        
        spendResults.Count.Should().Be(expectedCount);
        spendResults.Should().BeEquivalentTo(expectedList);
    }
    
    [Theory]
    [InlineData(100, 1000, 1000, 1000, 1000, 10, 400, 100, 0, 0,0,290,10)]
    [InlineData(100, 1000, 1000, 1000, 10, 1000, 400, 100, 0, 0,0,10,290)]
    [InlineData(100, 1000, 1000, 10, 1000, 1000, 400, 100, 0, 0,10,0,290)]
    [InlineData(100, 1000, 10, 1000, 1000, 1000, 400, 100, 0, 10,0,0,290)]
    [InlineData(100, 10, 1000, 1000, 1000, 1000, 400, 100, 10, 0,0,0,290)]
    [InlineData(100, 10, 20, 1000, 1000, 1000, 400, 100, 10, 20,0,0,270)]
    [InlineData(100, 10, 20, 30, 1000, 1000, 400, 100, 10, 20,30,0,240)]
    [InlineData(0, 10, 20, 30, 1000, 1000, 400, 0, 10, 20,30,0,340)]
    public async Task SpendCredit_WhenCreditsWithTheSameExpiryDates_ShouldFirstUseThoseWithLowestValue(int otucAmount, int tescoAmount, 
        int goodwillAmount, int refundAmount, int giftCardAmount, int staffAmount, int creditValueToRedeem, 
        int expectedOtucAmount, int expectedTescoAmount, int expectedGoodwillAmount, int expectedRefundAmount, 
        int expectedGiftCardAmount, int expectedStaffAmount)
    {
        // Arrange
        var sut = MockHappyPath(out var authService, out var bookingRepository, out var bookingPaymentsRepository,
            out var customersRepository, out var vouchersRepository, out var booking, out var cacheService);
        DateTime expiryDate = DateTime.Now.AddDays(7);
        Func<decimal, string, string, VoucherWithCustomer> createVoucherFunc = (amount, code, reason) =>
        {
            var gift = new Gift();
            gift.SetProperty(x => x.Amount, (int)(amount * 100));
            gift.SetProperty(x => x.Balance, (int)(amount * 100));
            var v = new VoucherWithCustomer();
            v.SetProperty(x => x.Active, true);
            v.SetProperty(x => x.Metadata, CreateMetadata(reason: reason, currency: "GBP"));
            v.SetProperty(x => x.Code, code);
            v.SetProperty(x => x.Gift, gift);
            v.SetProperty(x => x.ExpirationDate, expiryDate);

            return v;
        };

        var otuc = createVoucherFunc(otucAmount, "otuc", "onetimeuse");
        var tesco = createVoucherFunc(tescoAmount, "tesco", "tesco");
        var goodwill = createVoucherFunc(goodwillAmount, "goodwill", "goodwill");
        var refund = createVoucherFunc(refundAmount, "refund", "refund");
        var giftcard = createVoucherFunc(giftCardAmount, "giftcard", "giftcard");
        var staff = createVoucherFunc(staffAmount, "staff", "staff");

        customersRepository.Setup(x => x.GetCustomerVouchers(It.IsAny<string>()))
            .ReturnsAsync([staff, giftcard, refund, goodwill, tesco, otuc]);
        var validation = new ValidationWithMeta();
        validation.SetProperty(x => x.Valid, true);
        vouchersRepository.Setup(x => x.ValidateRedemption(It.IsAny<string>(), It.IsAny<decimal>(), It.IsAny<string>(),
            It.IsAny<Dictionary<string, object>>())).ReturnsAsync(validation);
        
        vouchersRepository
            .Setup(x => x.ProcessRedemption(It.IsAny<string>(), It.IsAny<decimal>(), It.IsAny<string>(),
                It.IsAny<Dictionary<string, object>>()))
            .ReturnsAsync((string voucherCode, decimal amount, string _, Dictionary<string, object> _) =>
            {
                var redemption = new Redemption();
                var voucher = new Voucher();
                voucher.SetProperty(x => x.Code, $"{voucherCode}Code");
                redemption.SetProperty(x => x.Id, $"{voucherCode}Id");
                redemption.SetProperty(x => x.Voucher, voucher);
                redemption.SetProperty(x => x.Amount, (long)(amount*100));
                return redemption;
            });

        // Act
        var spendResults = await sut.SpendCredits((creditValueToRedeem), Currency.GBP, null, null, null);

        var expectedCount = 0;
        var expectedList = new List<CreditSpend>();
        if (expectedOtucAmount > 0)
        {
            expectedCount++;
            expectedList.Add(new CreditSpend
            {
                ReasonCode = "onetimeuse", Amount = expectedOtucAmount, RedemptionIds = "otucId", VouchersIds = "otucCode",
            });
        }
        if (expectedTescoAmount > 0) {
            expectedCount++;
            expectedList.Add(new CreditSpend
            {
                ReasonCode = "tesco", Amount = expectedTescoAmount, RedemptionIds = "tescoId", VouchersIds = "tescoCode",
            });
        }
        if (expectedGoodwillAmount > 0){
            expectedCount++;
            expectedList.Add(new CreditSpend
            {
                ReasonCode = "goodwill", Amount = expectedGoodwillAmount, RedemptionIds = "goodwillId", VouchersIds = "goodwillCode",
            });
        }
        if (expectedRefundAmount > 0){
            expectedCount++;
            expectedList.Add(new CreditSpend
            {
                ReasonCode = "refund", Amount = expectedRefundAmount, RedemptionIds = "refundId", VouchersIds = "refundCode",
            });
        }
        
        if (expectedGiftCardAmount > 0){
            expectedCount++;
            expectedList.Add(new CreditSpend
            {
                ReasonCode = "giftcard", Amount = expectedGiftCardAmount, RedemptionIds = "giftcardId", VouchersIds = "giftcardCode",
            });
        }
        if (expectedStaffAmount > 0) {
            expectedCount++;
            expectedList.Add(new CreditSpend
            {
                ReasonCode = "staff", Amount = expectedStaffAmount, RedemptionIds = "staffId", VouchersIds = "staffCode",
            });
        }
        
        spendResults.Count.Should().Be(expectedCount);
        spendResults.Should().BeEquivalentTo(expectedList);
    }


    #endregion    
}