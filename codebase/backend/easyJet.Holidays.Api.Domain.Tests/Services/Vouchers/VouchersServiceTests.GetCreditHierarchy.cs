using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Data.Vouchers.Helpers;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Moq;
using Voucherify.DataModel;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Vouchers;

public partial class VouchersServiceTests
{
    #region GetCreditHierarchy

    [Fact]
    public async Task GetCreditHierarchy_VouchersInactive_ThrowsException()
    {
        // Arrange
        var sut = MockHappyPath(out _, out _, out _, out _, out _, out _, out _);
        var currency = new Currency { Code = "GBP" };
        var customerId = "customerId";
        var marketCode = "marketCode";
        
        
        Func<Task<List<CreditItem>>> f = async () =>
            await sut.GetCreditHierarchy(currency, customerId, marketCode);

        // Assert
        await f.Should().ThrowAsync<Exception>();
    }

    [Theory]
    [InlineData(100, 1000, 900, 800, 700, 10)]
    [InlineData(100, 1000, 900, 800, 10, 600)]
    [InlineData(100, 1000, 900, 10, 700, 600)]
    [InlineData(100, 1000, 10, 800, 700, 600)]
    [InlineData(100, 10, 900, 800, 700, 600)]
    public async Task GetCreditHierarchy_WhenCreditsWithTheSameExpiryDates_ShouldReturnHierarchySortedByLowestValue(
        int otucAmount, int tescoAmount, int goodwillAmount, int refundAmount, int giftCardAmount, int staffAmount)
    {
        // Arrange
        var sut = MockHappyPath(out _, out _, out _, out var customersRepository, out _, out _, out _);
        DateTime expiryDate = DateTime.Now.AddDays(7);

        var otuc = CreateVoucherFunc(otucAmount, "otuc", "onetimeuse", "marketCode", expiryDate);
        var tesco = CreateVoucherFunc(tescoAmount, "tesco", "tesco", "marketCode", expiryDate);
        var goodwill = CreateVoucherFunc(goodwillAmount, "goodwill", "goodwill", "marketCode", expiryDate);
        var refund = CreateVoucherFunc(refundAmount, "refund", "refund", "marketCode", expiryDate);
        var giftcard = CreateVoucherFunc(giftCardAmount, "giftcard", "giftcard", "marketCode", expiryDate);
        var staff = CreateVoucherFunc(staffAmount, "staff", "staff", "marketCode", expiryDate);

        customersRepository.Setup(x => x.GetCustomerVouchers(It.IsAny<string>()))
            .ReturnsAsync([
                staff,
                giftcard,
                refund,
                goodwill,
                tesco,
                otuc
            ]);


        // Act
        var result = await sut.GetCreditHierarchy(new Currency { Code = "GBP" }, "marketCode", "customerId");

        // Assert
        var expectedCount = 0;
        var expectedList = new List<CreditItemTestDto>();
        if (tescoAmount > 0)
        {
            expectedList.Add(new CreditItemTestDto
            {
                Balance = tescoAmount, Reason = "tesco", MarketCode = "marketCode"
            });
            expectedCount++;
        }

        if (goodwillAmount > 0)
        {
            expectedList.Add(new CreditItemTestDto
            {
                Balance = goodwillAmount, Reason = "goodwill", MarketCode = "marketCode"
            });
            expectedCount++;
        }

        if (refundAmount > 0)
        {
            expectedList.Add(new CreditItemTestDto
            {
                Balance = refundAmount, Reason = "refund", MarketCode = "marketCode"
            });
            expectedCount++;
        }

        if (giftCardAmount > 0)
        {
            expectedList.Add(new CreditItemTestDto
            {
                Balance = giftCardAmount, Reason = "giftcard", MarketCode = "marketCode"
            });
            expectedCount++;
        }

        if (staffAmount > 0)
        {
            expectedList.Add(new CreditItemTestDto
            {
                Balance = staffAmount, Reason = "staff", MarketCode = "marketCode"
            });
            expectedCount++;
        }

        expectedList = expectedList.OrderBy(x => x.Balance).ToList();
        if (otucAmount > 0)
        {
            expectedList.Insert(0,
                new CreditItemTestDto { Balance = otucAmount, Reason = "onetimeuse", MarketCode = "marketCode" });
            expectedCount++;
        }

        result.Count.Should().Be(expectedCount);
        var resultAsTestDto = result.Select(x => new CreditItemTestDto()
        {
            Balance = x.Amount, Reason = x.GetReasonFromMeta(), MarketCode = x.GetMarketFromMeta()
        });
        resultAsTestDto.Should().BeEquivalentTo(expectedList, options => options.WithStrictOrdering());
    }

    [Theory]
    [InlineData(100, 1000, 900, 800, 700, 10)]
    [InlineData(100, 1000, 900, 800, 10, 600)]
    [InlineData(100, 1000, 900, 10, 700, 600)]
    [InlineData(100, 1000, 10, 800, 700, 600)]
    [InlineData(100, 10, 900, 800, 700, 600)]
    public async Task GetCreditHierarchy_WhenSomeVouchersWithoutMarketCode_ShouldReturnHierarchySortedByLowestValue(
        int otucAmount, int tescoAmount, int goodwillAmount, int refundAmount, int giftCardAmount, int staffAmount)
    {
        // Arrange
        var sut = MockHappyPath(out _, out _, out _, out var customersRepository, out _, out _, out _);
        DateTime expiryDate = DateTime.Now.AddDays(7);

        var otuc = CreateVoucherFunc(otucAmount, "otuc", "onetimeuse", "marketCode", expiryDate);
        var tesco = CreateVoucherFunc(tescoAmount, "tesco", "tesco", null, expiryDate);
        var goodwill = CreateVoucherFunc(goodwillAmount, "goodwill", "goodwill", "marketCode", expiryDate);
        var refund = CreateVoucherFunc(refundAmount, "refund", "refund", null, expiryDate);
        var giftcard = CreateVoucherFunc(giftCardAmount, "giftcard", "giftcard", "marketCode", expiryDate);
        var staff = CreateVoucherFunc(staffAmount, "staff", "staff", null, expiryDate);

        customersRepository.Setup(x => x.GetCustomerVouchers(It.IsAny<string>()))
            .ReturnsAsync([
                staff,
                giftcard,
                refund,
                goodwill,
                tesco,
                otuc
            ]);

        // Act
        var result = await sut.GetCreditHierarchy(new Currency { Code = "GBP" }, null, "customerId");

        // Assert
        var expectedCount = 0;
        var expectedList = new List<CreditItemTestDto>();
        if (tescoAmount > 0)
        {
            expectedList.Add(new CreditItemTestDto { Balance = tescoAmount, Reason = "tesco", MarketCode = null });
            expectedCount++;
        }

        if (goodwillAmount > 0)
        {
            expectedList.Add(new CreditItemTestDto
            {
                Balance = goodwillAmount, Reason = "goodwill", MarketCode = "marketCode"
            });
            expectedCount++;
        }

        if (refundAmount > 0)
        {
            expectedList.Add(new CreditItemTestDto { Balance = refundAmount, Reason = "refund", MarketCode = null });
            expectedCount++;
        }

        if (giftCardAmount > 0)
        {
            expectedList.Add(new CreditItemTestDto
            {
                Balance = giftCardAmount, Reason = "giftcard", MarketCode = "marketCode"
            });
            expectedCount++;
        }

        if (staffAmount > 0)
        {
            expectedList.Add(new CreditItemTestDto { Balance = staffAmount, Reason = "staff", MarketCode = null });
            expectedCount++;
        }

        expectedList = expectedList.OrderBy(x => x.Balance).ToList();
        if (otucAmount > 0)
        {
            expectedList.Insert(0,
                new CreditItemTestDto { Balance = otucAmount, Reason = "onetimeuse", MarketCode = "marketCode" });
            expectedCount++;
        }

        result.Count.Should().Be(expectedCount);
        var resultAsTestDto = result.Select(x => new CreditItemTestDto()
        {
            Balance = x.Amount, Reason = x.GetReasonFromMeta(), MarketCode = x.GetMarketFromMeta()
        });
        resultAsTestDto.Should().BeEquivalentTo(expectedList, options => options.WithStrictOrdering());
    }

    [Theory]
    [InlineData(100, 1000, 900, 800, 700, 10)]
    [InlineData(100, 1000, 900, 800, 10, 600)]
    [InlineData(100, 1000, 900, 10, 700, 600)]
    [InlineData(100, 1000, 10, 800, 700, 600)]
    [InlineData(100, 10, 900, 800, 700, 600)]
    public async Task
        GetCreditHierarchy_WhenVouchersWithTwoDifferentMarketCodes_ShouldReturnHierarchySortedByLowestValue(
            int otucAmount, int tescoAmount, int goodwillAmount, int refundAmount, int giftCardAmount, int staffAmount)
    {
        // Arrange
        var sut = MockHappyPath(out _, out _, out _, out var customersRepository, out _, out _, out _);
        DateTime expiryDate = DateTime.Now.AddDays(7);

        var otuc = CreateVoucherFunc(otucAmount, "otuc", "onetimeuse", "marketCode1", expiryDate);
        var tesco = CreateVoucherFunc(tescoAmount, "tesco", "tesco", "marketCode2", expiryDate);
        var goodwill = CreateVoucherFunc(goodwillAmount, "goodwill", "goodwill", "marketCode1", expiryDate);
        var refund = CreateVoucherFunc(refundAmount, "refund", "refund", "marketCode2", expiryDate);
        var giftcard = CreateVoucherFunc(giftCardAmount, "giftcard", "giftcard", "marketCode1", expiryDate);
        var staff = CreateVoucherFunc(staffAmount, "staff", "staff", "marketCode2", expiryDate);

        customersRepository.Setup(x => x.GetCustomerVouchers(It.IsAny<string>()))
            .ReturnsAsync([
                staff,
                giftcard,
                refund,
                goodwill,
                tesco,
                otuc
            ]);

        // Act
        var result = await sut.GetCreditHierarchy(new Currency { Code = "GBP" }, null, "customerId");

        // Assert
        var expectedCount = 0;
        var expectedList = new List<CreditItemTestDto>();
        if (tescoAmount > 0)
        {
            expectedList.Add(new CreditItemTestDto
            {
                Balance = tescoAmount, Reason = "tesco", MarketCode = "marketCode2"
            });
            expectedCount++;
        }

        if (goodwillAmount > 0)
        {
            expectedList.Add(new CreditItemTestDto
            {
                Balance = goodwillAmount, Reason = "goodwill", MarketCode = "marketCode1"
            });
            expectedCount++;
        }

        if (refundAmount > 0)
        {
            expectedList.Add(new CreditItemTestDto
            {
                Balance = refundAmount, Reason = "refund", MarketCode = "marketCode2"
            });
            expectedCount++;
        }

        if (giftCardAmount > 0)
        {
            expectedList.Add(new CreditItemTestDto
            {
                Balance = giftCardAmount, Reason = "giftcard", MarketCode = "marketCode1"
            });
            expectedCount++;
        }

        if (staffAmount > 0)
        {
            expectedList.Add(new CreditItemTestDto
            {
                Balance = staffAmount, Reason = "staff", MarketCode = "marketCode2"
            });
            expectedCount++;
        }

        expectedList = expectedList.OrderBy(x => x.Balance).ToList();
        if (otucAmount > 0)
        {
            expectedList.Insert(0,
                new CreditItemTestDto { Balance = otucAmount, Reason = "onetimeuse", MarketCode = "marketCode1" });
            expectedCount++;
        }

        result.Count.Should().Be(expectedCount);
        var resultAsTestDto = result.Select(x => new CreditItemTestDto()
        {
            Balance = x.Amount, Reason = x.GetReasonFromMeta(), MarketCode = x.GetMarketFromMeta()
        });
        resultAsTestDto.Should().BeEquivalentTo(expectedList, options => options.WithStrictOrdering());
    }

    private static VoucherWithCustomer CreateVoucherFunc(decimal amount, string code, string reason, string marketCode,
        DateTime expiryDate)
    {
        var gift = new Gift();
        gift.SetProperty(x => x.Amount, (int)(amount * 100));
        gift.SetProperty(x => x.Balance, (int)(amount * 100));
        var v = new VoucherWithCustomer();
        v.SetProperty(x => x.Active, true);
        v.SetProperty(x => x.Metadata, CreateMetadata(reason: reason, currency: "GBP", marketCode: marketCode));
        v.SetProperty(x => x.Code, code);
        v.SetProperty(x => x.Gift, gift);
        v.SetProperty(x => x.ExpirationDate, expiryDate);

        return v;
    }

    private record struct CreditItemTestDto
    {
        public decimal Balance { get; init; }

        // ReSharper disable once UnusedAutoPropertyAccessor.Local
        public string Reason { get; init; }

        // ReSharper disable once UnusedAutoPropertyAccessor.Local
        public string MarketCode { get; init; }
    }

    #endregion
}