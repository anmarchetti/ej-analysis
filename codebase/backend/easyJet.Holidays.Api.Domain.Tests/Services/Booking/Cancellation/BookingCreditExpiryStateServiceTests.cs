using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Services.Booking;
using easyJet.Holidays.Api.Domain.Services.Time;
using easyJet.Holidays.Api.Domain.Settings;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using Xunit;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Tests.Domain;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking.Cancellation;

public class BookingCreditExpiryStateServiceTests
{
    private readonly Mock<ITimeProvider> _timeProvider = new();

    [Fact]
    public async Task GetCreditExpiryState_WhenNoCreditHistory_ReturnsNone()
    {
        var sut = CreateSut();

        var result = await sut.GetCreditExpiryStateAsync(new BookingResponse
        {
            PaymentInfo = new PriceInfo { PaymentHistory = [] }
        });

        result.Should().Be(BookingCreditExpiryState.None);
    }

    [Fact]
    public async Task GetCreditExpiryState_WhenOnlyExpiredCreditsExist_ReturnsExpiredOnly()
    {
        var now = DateTime.UtcNow.AddDays(1);
        var vouchersRepoMock = new Mock<IVouchersRepository>();
        var voucherCode = "V-EXPIRED";
        var voucher = new Voucher();
        voucher.SetPrivateField("<ExpirationDate>k__BackingField", now.AddMinutes(-1));
        voucher.SetPrivateField("<Code>k__BackingField", voucherCode);
        vouchersRepoMock.Setup(x => x.Get(It.IsAny<IEnumerable<string>>())).ReturnsAsync(new[] { voucher });

        var sut = CreateSutWithVoucherRepo(vouchersRepoMock, now);
        var payment = CreateCreditPayment("EXPIRED");
        payment.TransNo = voucherCode;

        var result = await sut.GetCreditExpiryStateAsync(CreateBooking(payment));

        result.Should().Be(BookingCreditExpiryState.ExpiredOnly);
    }

    [Fact]
    public async Task GetCreditExpiryState_WhenOnlyExpiringCreditsExist_ReturnsExpiringOnly()
    {
        var now = DateTime.UtcNow.AddDays(1);
        var vouchersRepoMock = new Mock<IVouchersRepository>();
        var voucherCode = "V-EXPIRING";
        var voucher = new Voucher();
        voucher.SetPrivateField("<ExpirationDate>k__BackingField", now.AddDays(7));
        voucher.SetPrivateField("<Code>k__BackingField", voucherCode);
        vouchersRepoMock.Setup(x => x.Get(It.IsAny<IEnumerable<string>>())).ReturnsAsync(new[] { voucher });

        var sut = CreateSutWithVoucherRepo(vouchersRepoMock, now);
        var payment = CreateCreditPayment("EXPIRING");
        payment.TransNo = voucherCode;

        var result = await sut.GetCreditExpiryStateAsync(CreateBooking(payment));

        result.Should().Be(BookingCreditExpiryState.ExpiringOnly);
    }

    [Fact]
    public async Task GetCreditExpiryState_WhenExpiredAndExpiringCreditsExist_ReturnsBoth()
    {
        var now = DateTime.UtcNow;
        var vouchersRepoMock = new Mock<IVouchersRepository>();
        var code1 = "V-EXPIRED";
        var code2 = "V-EXPIRING";
        var v1 = new Voucher();
        v1.SetPrivateField("<ExpirationDate>k__BackingField", now.AddDays(-1));
        v1.SetPrivateField("<Code>k__BackingField", code1);
        var v2 = new Voucher();
        v2.SetPrivateField("<ExpirationDate>k__BackingField", now.AddDays(7));
        v2.SetPrivateField("<Code>k__BackingField", code2);
        vouchersRepoMock.Setup(x => x.Get(It.IsAny<IEnumerable<string>>())).ReturnsAsync(new[] { v1, v2 });

        var sut = CreateSutWithVoucherRepo(vouchersRepoMock, now);
        var p1 = CreateCreditPayment("EXPIRED"); p1.TransNo = code1;
        var p2 = CreateCreditPayment("EXPIRING"); p2.TransNo = code2;

        var result = await sut.GetCreditExpiryStateAsync(CreateBooking(p1, p2));

        result.Should().Be(BookingCreditExpiryState.Both);
    }

    [Fact]
    public async Task GetCreditExpiryState_WhenNonCreditPaymentsArePresent_TheyAreIgnored()
    {
        var now = DateTime.UtcNow;
        var vouchersRepoMock = new Mock<IVouchersRepository>();
        var voucherCode = "V-CREDIT";
        var voucher = new Voucher();
        voucher.SetPrivateField("<ExpirationDate>k__BackingField", now.AddDays(15));
        voucher.SetPrivateField("<Code>k__BackingField", voucherCode);
        vouchersRepoMock.Setup(x => x.Get(It.IsAny<IEnumerable<string>>())).ReturnsAsync(new[] { voucher });

        var sut = CreateSutWithVoucherRepo(vouchersRepoMock, now);
        var creditPayment = CreateCreditPayment("CREDIT"); creditPayment.TransNo = voucherCode;

        var result = await sut.GetCreditExpiryStateAsync(CreateBooking(
            new PaymentHistoryItem { IsCredit = false, PayMethodCode = "CASH" },
            creditPayment));

        result.Should().Be(BookingCreditExpiryState.None);
    }

    [Fact]
    public async Task GetCreditExpiryState_WhenOneTimeUseCreditPaymentsArePresent_ReturnsExpiringOnly()
    {
        var now = DateTime.UtcNow;
        var vouchersRepoMock = new Mock<IVouchersRepository>();
        var voucherCode = "V-OTC";
        var voucher = new Voucher();
        voucher.SetPrivateField("<ExpirationDate>k__BackingField", now.AddDays(7));
        voucher.SetPrivateField("<Code>k__BackingField", voucherCode);
        vouchersRepoMock.Setup(x => x.Get(It.IsAny<IEnumerable<string>>())).ReturnsAsync(new[] { voucher });

        var sut = CreateSutWithVoucherRepo(vouchersRepoMock, now);
        
        var payment = new PaymentHistoryItem { IsOneTimeUseCredit = true, IsCredit = true, PayMethodCode = "OTC", TransNo = voucherCode };

        var result = await sut.GetCreditExpiryStateAsync(CreateBooking(payment));

        result.Should().Be(BookingCreditExpiryState.ExpiringOnly);
    }

    [Fact]
    public async Task GetCreditExpiryState_UsesConfiguredThresholdDays()
    {
        var now = DateTime.UtcNow;
        var vouchersRepoMock = new Mock<IVouchersRepository>();
        var voucherCode = "V-CREDIT";
        var voucher = new Voucher();
        voucher.SetPrivateField("<ExpirationDate>k__BackingField", now.AddDays(8));
        voucher.SetPrivateField("<Code>k__BackingField", voucherCode);
        vouchersRepoMock.Setup(x => x.Get(It.IsAny<IEnumerable<string>>())).ReturnsAsync(new[] { voucher });

        var sut = CreateSutWithVoucherRepo(vouchersRepoMock, now, thresholdDays: 7);
        var payment = CreateCreditPayment("CREDIT"); payment.TransNo = voucherCode;

        var result = await sut.GetCreditExpiryStateAsync(CreateBooking(payment));

        result.Should().Be(BookingCreditExpiryState.None);
    }

    private BookingCreditExpiryStateService CreateSut(DateTime? utcNow = null, int thresholdDays = 14)
    {
        _timeProvider.Setup(x => x.UtcNow).Returns(utcNow ?? DateTime.UtcNow);

        var options = Options.Create(new ApiSettings
        {
            Vouchers = new VoucherSettings
            {
                ExpiringCreditsThresholdDays = thresholdDays
            }
        });

        return new BookingCreditExpiryStateService(options, _timeProvider.Object);
    }

    private BookingCreditExpiryStateService CreateSutWithVoucherRepo(Mock<IVouchersRepository> vouchersRepoMock, DateTime? utcNow = null, int thresholdDays = 14)
    {
        _timeProvider.Setup(x => x.UtcNow).Returns(utcNow ?? DateTime.UtcNow);

        var options = Options.Create(new ApiSettings
        {
            Vouchers = new VoucherSettings
            {
                ExpiringCreditsThresholdDays = thresholdDays
            }
        });

        return new BookingCreditExpiryStateService(options, _timeProvider.Object, vouchersRepoMock?.Object);
    }

    private static BookingResponse CreateBooking(params PaymentHistoryItem[] history) => new()
    {
        PaymentInfo = new PriceInfo
        {
            PaymentHistory = history
        }
    };

    private static PaymentHistoryItem CreateCreditPayment(string payMethodCode) => new()
    {
        IsCredit = true,
        PayMethodCode = payMethodCode
    };

    [Fact]
    public async Task GetCreditExpiryState_WhenPaymentCodeHasNoExpiration_UsesVoucherRepository_Expired()
    {
        var now = DateTime.UtcNow;
        var voucherCode = "VOUCHER-EXPIRED";

        var vouchersRepoMock = new Mock<IVouchersRepository>();
        var voucher = new Voucher();
        voucher.SetPrivateField("<ExpirationDate>k__BackingField", now.AddMinutes(-1));
        voucher.SetPrivateField("<Code>k__BackingField", voucherCode);
        vouchersRepoMock.Setup(x => x.Get(It.IsAny<IEnumerable<string>>())).ReturnsAsync(new[] { voucher });

        var sut = CreateSutWithVoucherRepo(vouchersRepoMock, now);

        var payment = new PaymentHistoryItem { IsCredit = true, PayMethodCode = "V1", TransNo = voucherCode };

        var result = await sut.GetCreditExpiryStateAsync(CreateBooking(payment));

        result.Should().Be(BookingCreditExpiryState.ExpiredOnly);
    }

    [Fact]
    public async Task GetCreditExpiryState_WhenPaymentCodeHasNoExpiration_UsesVoucherRepository_Expiring()
    {
        var now = DateTime.UtcNow;
        var voucherCode = "VOUCHER-EXPIRING";

        var vouchersRepoMock = new Mock<IVouchersRepository>();
        var voucher = new Voucher();
        voucher.SetPrivateField("<ExpirationDate>k__BackingField", now.AddDays(7));
        voucher.SetPrivateField("<Code>k__BackingField", voucherCode);
        vouchersRepoMock.Setup(x => x.Get(It.IsAny<IEnumerable<string>>())).ReturnsAsync(new[] { voucher });

        var sut = CreateSutWithVoucherRepo(vouchersRepoMock, now);

        var payment = new PaymentHistoryItem { IsCredit = true, PayMethodCode = "V1", TransNo = voucherCode };

        var result = await sut.GetCreditExpiryStateAsync(CreateBooking(payment));

        result.Should().Be(BookingCreditExpiryState.ExpiringOnly);
    }

    [Fact]
    public async Task GetCreditExpiryState_WhenVoucherLookupFails_IgnoresAndReturnsNone()
    {
        var now = DateTime.UtcNow;
        var voucherCode = "VOUCHER-ERR";

        var vouchersRepoMock = new Mock<IVouchersRepository>();
        vouchersRepoMock.Setup(x => x.Get(It.IsAny<IEnumerable<string>>())).ThrowsAsync(new InvalidOperationException("fail"));

        var sut = CreateSutWithVoucherRepo(vouchersRepoMock, now);


        var payment = new PaymentHistoryItem { IsCredit = true, PayMethodCode = "V1", TransNo = voucherCode };

        var result = await sut.GetCreditExpiryStateAsync(CreateBooking(payment));

        result.Should().Be(BookingCreditExpiryState.None);
    }

    [Fact]
    public async Task GetCreditExpiryState_WhenPaymentHasNoVoucherCode_IsSkipped()
    {
        var now = DateTime.UtcNow;
        var vouchersRepoMock = new Mock<IVouchersRepository>();
        // no vouchers returned
        vouchersRepoMock.Setup(x => x.Get(It.IsAny<IEnumerable<string>>())).ReturnsAsync(Array.Empty<Voucher>());

        var sut = CreateSutWithVoucherRepo(vouchersRepoMock, now);

        var payment = CreateCreditPayment("CREDIT"); // no TransNo/PayId

        var result = await sut.GetCreditExpiryStateAsync(CreateBooking(payment));

        result.Should().Be(BookingCreditExpiryState.None);
    }

    [Fact]
    public async Task GetCreditExpiryState_WhenVoucherHasNoExpiration_IsIgnored()
    {
        var now = DateTime.UtcNow;
        var vouchersRepoMock = new Mock<IVouchersRepository>();
        var voucherCode = "V-NOEXP";
        var voucher = new Voucher();
        voucher.SetPrivateField("<Code>k__BackingField", voucherCode);
        // ExpirationDate left null
        vouchersRepoMock.Setup(x => x.Get(It.IsAny<IEnumerable<string>>())).ReturnsAsync(new[] { voucher });

        var sut = CreateSutWithVoucherRepo(vouchersRepoMock, now);
        var payment = CreateCreditPayment("CREDIT"); payment.TransNo = voucherCode;

        var result = await sut.GetCreditExpiryStateAsync(CreateBooking(payment));

        result.Should().Be(BookingCreditExpiryState.None);
    }

    [Fact]
    public async Task GetCreditExpiryState_PartialLookup_FindsSomeVouchers()
    {
        var now = DateTime.UtcNow;
        var vouchersRepoMock = new Mock<IVouchersRepository>();
        var code1 = "V-FOUND"; // expired
        var code2 = "V-MISSING"; // not returned by repo
        var v1 = new Voucher();
        v1.SetPrivateField("<ExpirationDate>k__BackingField", now.AddMinutes(-1));
        v1.SetPrivateField("<Code>k__BackingField", code1);
        // repo returns only v1
        vouchersRepoMock.Setup(x => x.Get(It.IsAny<IEnumerable<string>>())).ReturnsAsync(new[] { v1 });

        var sut = CreateSutWithVoucherRepo(vouchersRepoMock, now);
        var pA = CreateCreditPayment("A"); pA.TransNo = code1;
        var pB = CreateCreditPayment("B"); pB.TransNo = code2;

        var result = await sut.GetCreditExpiryStateAsync(CreateBooking(pA, pB));

        result.Should().Be(BookingCreditExpiryState.ExpiredOnly);
    }
}

