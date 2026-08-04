#nullable enable
using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Constants;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.SingleUseVoucher;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Settings;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Newtonsoft.Json;
using System.Collections.ObjectModel;
using System.Net;
using System.Reflection;
using Voucherify.Core.DataModel;
using Voucherify.DataModel;
using Xunit;
using AuthCustomerDetails = easyJet.Holidays.Api.Domain.Data.Authentication.CustomerDetails;
using Redemption = easyJet.Holidays.Api.Domain.Data.Vouchers.Redemption;
using Voucher = easyJet.Holidays.Api.Domain.Data.Vouchers.Voucher;
using VoucherType = Voucherify.DataModel.VoucherType;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Vouchers
{
    public partial class VouchersServiceTests
    {
        protected readonly IFixture _fixture;
        protected static readonly string _customCampaignVouchersMetaData = "customCampaign";
        protected static readonly string _singleUsePromoVouchersMetaData = "MetadataKey";

        private readonly VouchersService _sut;
        private readonly Mock<IVouchersRepository> _mockVoucherRepo;
        private readonly Mock<IBookingRepository> _mockBookingRepo;
        private readonly Mock<IBookingPaymentsRepository> _mockBookingPaymentsRepo;
        private readonly Mock<IVouchersCustomerRepository> _mockVoucherCustomerRepo;
        private readonly Mock<IAwsUserCreditsService> _mockAwsUserCreditsService;
        private readonly Mock<IAuthenticationService> _mockAuthService;

        public VouchersServiceTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();
            _fixture.Inject(Options.Create(new ApiSettings
            {
                Vouchers = new VoucherSettings
                {
                    Types = new VoucherTypeSettings
                    {
                        Goodwill = "goodwill",
                        Incentive = "incentive",
                        Refund = "refund",
                        GiftCard = "giftcard",
                        OneTimeUse = "onetimeuse"
                    },
                    PromoVouchers = new()
                    {
                        Types = [
                            "somePromotion",
                            "Promotion - Marketing"
                        ]
                    },
                    ExpirationMonths = 3,
                    CustomCampaignVouchersMetaData = _customCampaignVouchersMetaData,
                    Discounts = new VoucherDiscountSettings
                    {
                        MetadataKey = _singleUsePromoVouchersMetaData
                    },
                    BookingMemos = new BookingMemoSettings
                    {
                        Cred = new MemoSettings
                        {
                            Code = "testBookingMemoCode"
                        },
                    }
                }
            }));

            var atcomSettings = Options.Create(new AtcomSettings
            {
                PaymentCodes = new Dictionary<string, PaymentCodesSettings>{
                {
                    "refund",
                    new PaymentCodesSettings
                    {
                        Reason = "refund",
                        Issued =  new PaymentTypeSettings {Code = "CI", Group = "CA"},
                        Redeemed =  new PaymentTypeSettings {Code = "CR", Group = "CA"}
                    }
                }, {
                    "goodwill",
                    new PaymentCodesSettings
                    {
                        Reason = "goodwill",
                        Issued =  new PaymentTypeSettings {Code = "GI", Group = "CA"},
                        Redeemed =  new PaymentTypeSettings {Code = "GR", Group = "CA"}
                    }
                }, {
                    "incentive",
                    new PaymentCodesSettings
                    {
                        Reason = "incentive",
                        Issued =  new PaymentTypeSettings {Code = "II", Group = "CA"},
                        Redeemed =  new PaymentTypeSettings {Code = "IR", Group = "CA"}
                    }
                }, {
                    "giftcard",
                    new PaymentCodesSettings
                    {
                        Reason = "giftcard",
                        Issued =  new PaymentTypeSettings {Code = "GI", Group = "CA"},
                        Redeemed =  new PaymentTypeSettings {Code = "GR", Group = "CA"}
                    }
                },
                    {
                        "PromotionStaffCredit2324Expired",
                        new PaymentCodesSettings
                        {
                            Reason = "Promotion - Staff credit 23-24 Expired",
                            Issued = new PaymentTypeSettings { Code = "PSTJE", Group = "CA" },
                            Redeemed = new PaymentTypeSettings { Code = "PSTKE", Group = "CA" },
                            ExpirationDate = DateTime.UtcNow.AddMonths(-2),
                        }
                    },
                    {
                        "PromotionStaffCredit2324",
                        new PaymentCodesSettings
                        {
                            Reason = "Promotion - Staff credit 23-24",
                            Issued = new PaymentTypeSettings { Code = "PSTJ", Group = "CA" },
                            Redeemed = new PaymentTypeSettings { Code = "PSTK", Group = "CA" },
                            ExpirationDate = DateTime.UtcNow.AddMonths(2),
                        }
                    },
                    {
                        "PromotionStaffCredit2526",
                        new PaymentCodesSettings
                        {
                            Reason = "Promotion - Staff credit 25-26",
                            Issued = new PaymentTypeSettings { Code = "PSTO", Group = "CA" },
                            Redeemed = new PaymentTypeSettings { Code = "PSTN", Group = "CA" },
                            ExpirationDate = DateTime.UtcNow.AddDays(100),
                        }
                    },
                    {
                        "PromotionMarketing",
                        new PaymentCodesSettings
                        {
                            Reason = "Promotion - Marketing",
                            Issued = new PaymentTypeSettings { Code = "PMKI", Group = "CA" },
                            Redeemed = new PaymentTypeSettings { Code = "PMKR", Group = "CA" },
                            ExpirationDate = DateTime.UtcNow.AddDays(100),
                        }
                    }
                }
            });

            _fixture.Inject(atcomSettings);
            var apiSettingsService = new ApiSettingsService(atcomSettings, _fixture.Create<ILogger<ApiSettingsService>>());

            _fixture.Inject(Options.Create(new VoucherifySettings
            {
                ReasonExceeded = "exceeded",
                ReasonNotFound = "notFound"
            }));

            _mockVoucherRepo = new Mock<IVouchersRepository>();
            _mockBookingRepo = new Mock<IBookingRepository>();
            _mockBookingPaymentsRepo = new Mock<IBookingPaymentsRepository>();
            _mockVoucherCustomerRepo = new Mock<IVouchersCustomerRepository>();
            _mockAwsUserCreditsService = _fixture.Create<Mock<IAwsUserCreditsService>>();
            var _vouch = new Mock<ISingleUseVoucherService>();
            _mockAuthService = _fixture.Create<Mock<IAuthenticationService>>();

            _sut = new VouchersService(
                _mockVoucherCustomerRepo.Object,
                _mockAuthService.Object,
                _mockVoucherRepo.Object,
                _mockBookingRepo.Object,
                _mockBookingPaymentsRepo.Object,
                _fixture.Create<ILogger<VouchersService>>(),
                _fixture.Create<IOptions<ApiSettings>>(),
                _fixture.Create<IOptions<VoucherifySettings>>(),
                _mockAwsUserCreditsService.Object,
                _fixture.Create<IHotelsService>(),
                _fixture.Create<ISingleUseVoucherService>(),
                apiSettingsService
            );
        }

        [Fact]
        public async Task GetSingleUsePromoCode_ReturnsExistingCode_WhenAssignedCodeHasNotBeenRedeemed()
        {
            var authService = new Mock<IAuthenticationService>();
            var singleUseVoucherService = new Mock<ISingleUseVoucherService>();
            var vouchersRepository = new Mock<IVouchersRepository>();
            authService.Setup(service => service.MappedCustomerId(null)).ReturnsAsync("customer-1");
            singleUseVoucherService
                .Setup(service => service.GetCustomerSingleUserPromoCode("customer-1", "campaign-1"))
                .ReturnsAsync("PROMO-1");
            vouchersRepository.Setup(repository => repository.Get("PROMO-1"))
                .ReturnsAsync(BuildSingleUseVoucherWithRedemptionEntries());

            var sut = BuildSingleUseVoucherSut(authService, singleUseVoucherService, vouchersRepository);

            var result = await sut.GetSingleUsePromoCode("campaign-1");

            result.Should().Be("PROMO-1");
            singleUseVoucherService.Verify(service =>
                service.AssignSingleUsePromoCodeToCustomer(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task GetSingleUsePromoCode_ReturnsEmpty_WhenAssignedCodeHasBeenRedeemed()
        {
            var authService = new Mock<IAuthenticationService>();
            var singleUseVoucherService = new Mock<ISingleUseVoucherService>();
            var vouchersRepository = new Mock<IVouchersRepository>();
            authService.Setup(service => service.MappedCustomerId(null)).ReturnsAsync("customer-1");
            singleUseVoucherService
                .Setup(service => service.GetCustomerSingleUserPromoCode("customer-1", "campaign-1"))
                .ReturnsAsync("PROMO-1");
            vouchersRepository.Setup(repository => repository.Get("PROMO-1"))
                .ReturnsAsync(BuildSingleUseVoucherWithRedemptionEntries(new Voucherify.DataModel.VoucherRedemption()));

            var sut = BuildSingleUseVoucherSut(authService, singleUseVoucherService, vouchersRepository);

            var result = await sut.GetSingleUsePromoCode("campaign-1");

            result.Should().BeEmpty();
            singleUseVoucherService.Verify(service =>
                service.AssignSingleUsePromoCodeToCustomer(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task GetSingleUsePromoCode_AssignsCode_WhenCustomerHasNoAssignedCode()
        {
            var authService = new Mock<IAuthenticationService>();
            var singleUseVoucherService = new Mock<ISingleUseVoucherService>();
            var vouchersRepository = new Mock<IVouchersRepository>();
            authService.Setup(service => service.MappedCustomerId(null)).ReturnsAsync("customer-1");
            singleUseVoucherService
                .Setup(service => service.GetCustomerSingleUserPromoCode("customer-1", "campaign-1"))
                .ReturnsAsync(string.Empty);
            singleUseVoucherService
                .Setup(service => service.AssignSingleUsePromoCodeToCustomer("customer-1", "campaign-1"))
                .ReturnsAsync("PROMO-2");

            var sut = BuildSingleUseVoucherSut(authService, singleUseVoucherService, vouchersRepository);

            var result = await sut.GetSingleUsePromoCode("campaign-1");

            result.Should().Be("PROMO-2");
            vouchersRepository.Verify(repository => repository.Get(It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task GetSingleUsePromoCode_ReturnsEmpty_WhenSingleUseLookupThrows()
        {
            var authService = new Mock<IAuthenticationService>();
            var singleUseVoucherService = new Mock<ISingleUseVoucherService>();
            var vouchersRepository = new Mock<IVouchersRepository>();
            authService.Setup(service => service.MappedCustomerId(null)).ReturnsAsync("customer-1");
            singleUseVoucherService
                .Setup(service => service.GetCustomerSingleUserPromoCode("customer-1", "campaign-1"))
                .ThrowsAsync(new Exception("single use lookup failed"));

            var sut = BuildSingleUseVoucherSut(authService, singleUseVoucherService, vouchersRepository);

            var result = await sut.GetSingleUsePromoCode("campaign-1");

            result.Should().BeEmpty();
        }

        private VouchersService BuildSingleUseVoucherSut(
            Mock<IAuthenticationService> authService,
            Mock<ISingleUseVoucherService> singleUseVoucherService,
            Mock<IVouchersRepository> vouchersRepository)
        {
            return new VouchersService(
                _fixture.Create<IVouchersCustomerRepository>(),
                authService.Object,
                vouchersRepository.Object,
                _fixture.Create<IBookingRepository>(),
                _fixture.Create<IBookingPaymentsRepository>(),
                _fixture.Create<ILogger<VouchersService>>(),
                _fixture.Create<IOptions<ApiSettings>>(),
                _fixture.Create<IOptions<VoucherifySettings>>(),
                _fixture.Create<IAwsUserCreditsService>(),
                _fixture.Create<IHotelsService>(),
                singleUseVoucherService.Object,
                _fixture.Create<IApiSettingsService>());
        }

        private static Voucher BuildSingleUseVoucherWithRedemptionEntries(
            params Voucherify.DataModel.VoucherRedemption[] redemptionEntries)
        {
            var voucher = new Voucher();
            var redemption = new Voucherify.DataModel.VoucherRedemptionList() ;
            redemption.SetProperty(x => x.RedemptionEntries, redemptionEntries.ToList());
            redemption.SetProperty(x => x.RedeemedQuantity, redemptionEntries.Length);
            voucher.SetProperty(x => x.Redemption, redemption);
            
            return voucher;
        }

        #region MyCreditItems
        [Fact]
        public async Task MyCreditItems_ReturnOnlyActiveVouchers()
        {
            // Arrange
            var sut = MockHappyPath(out Mock<IAuthenticationService> _, out Mock<IBookingRepository> _, out Mock<IBookingPaymentsRepository> _, out var customersRepository, out Mock<IVouchersRepository> _, out BookingResponse _, out Mock<ICacheService> _);
            var gift = new Gift();
            gift.SetProperty(x => x.Amount, 10000);
            gift.SetProperty(x => x.Balance, 1000);
            var v1 = new VoucherWithCustomer();
            v1.SetProperty(x => x.Active, true);
            v1.SetProperty(x => x.Metadata, CreateMetadata(currency: "GBP"));
            v1.SetProperty(x => x.Code, "test_v");
            v1.SetProperty(x => x.Gift, gift);

            var v2 = new VoucherWithCustomer();
            v2.SetProperty(x => x.Active, false);
            v2.SetProperty(x => x.Metadata, CreateMetadata(currency: "GBP"));

            customersRepository.Setup(x => x.GetCustomerVouchers(It.IsAny<string>())).ReturnsAsync(new List<VoucherWithCustomer>{
                v1, v2
            });

            // Act
            var credits = await sut.MyCreditItems("test");
            var gbpCredits = credits.GetValueOrDefault(Currency.GBP)?.ToList();

            gbpCredits.Should().NotBeNull();
            gbpCredits!.Count.Should().Be(1);
            gbpCredits.ElementAt(0).Id.Should().Be("test_v");
            gbpCredits.ElementAt(0).Amount.Should().Be(100);
            gbpCredits.ElementAt(0).Balance.Should().Be(10);
        }

        [Fact]
        public async Task MyCreditItems_ReturnOnlyVouchersInGivenCurrency()
        {
            // Arrange
            var sut = MockHappyPath(out Mock<IAuthenticationService> _, out Mock<IBookingRepository> _, out Mock<IBookingPaymentsRepository> _, out var customersRepository, out Mock<IVouchersRepository> _, out BookingResponse _, out Mock<ICacheService> _);
            var gift = new Gift();
            gift.SetProperty(x => x.Amount, 10000);
            gift.SetProperty(x => x.Balance, 1000);
            var v1 = new VoucherWithCustomer();
            v1.SetProperty(x => x.Active, true);
            v1.SetProperty(x => x.Metadata, CreateMetadata(currency: "GBP"));
            v1.SetProperty(x => x.Code, "test_v");
            v1.SetProperty(x => x.Gift, gift);

            var v2 = new VoucherWithCustomer();
            v2.SetProperty(x => x.Active, true);
            v2.SetProperty(x => x.Metadata, CreateMetadata(currency: "USD"));

            customersRepository.Setup(x => x.GetCustomerVouchers(It.IsAny<string>())).ReturnsAsync(new List<VoucherWithCustomer>{
                v1, v2
            });

            // Act
            var credits = await sut.MyCreditItems("test");
            var gbpCredits = credits.GetValueOrDefault(Currency.GBP)?.ToList();

            gbpCredits.Should().NotBeNull();
            gbpCredits!.Count.Should().Be(1);
            gbpCredits.ElementAt(0).Id.Should().Be("test_v");
            gbpCredits.ElementAt(0).Amount.Should().Be(100);
            gbpCredits.ElementAt(0).Balance.Should().Be(10);
        }
        #endregion
        #region MyCreditHistory
        [Fact]
        public async Task MyCreditHistory_ReturnHistoryWithRedemptions()
        {
            // Arrange
            var gift = new Gift();
            gift.SetProperty(x => x.Amount, 100);
            gift.SetProperty(x => x.Balance, 100);
            var sut = MockHappyPath(out Mock<IAuthenticationService> _, out Mock<IBookingRepository> _, out Mock<IBookingPaymentsRepository> _, out var customersRepository, out Mock<IVouchersRepository> _, out BookingResponse _, out Mock<ICacheService> _);
            var v1 = new VoucherWithCustomer();
            v1.SetProperty(x => x.Active, true);
            v1.SetProperty(x => x.Metadata, CreateMetadata(currency: "GBP"));
            v1.SetProperty(x => x.Code, "test_v");
            v1.SetProperty(x => x.Gift, gift);

            var v2 = new VoucherWithCustomer();
            v2.SetProperty(x => x.Active, false);

            var redeem1 = new Redemption();
            redeem1.SetProperty(x => x.Id, "redeem_id1");
            redeem1.SetProperty(x => x.Voucher, v1);
            redeem1.SetProperty(x => x.Date, DateTime.UtcNow);

            var redeem2 = new Redemption();
            redeem2.SetProperty(x => x.Id, "redeem_id2");
            redeem2.SetProperty(x => x.Voucher, v1);
            redeem2.SetProperty(x => x.Date, DateTime.UtcNow);

            RedemptionList redeem = (RedemptionList)System.Runtime.CompilerServices.RuntimeHelpers.GetUninitializedObject(typeof(RedemptionList));
            redeem.SetProperty(x => x.Redemptions, new List<Voucherify.DataModel.Redemption>
            {
                redeem1,
                redeem2,
            });

            customersRepository.Setup(x => x.GetCustomerVouchers(It.IsAny<string>())).ReturnsAsync(new List<VoucherWithCustomer>{
                v1, v2
            });

            customersRepository.Setup(x => x.GetCustomerHistory(It.IsAny<string>())).ReturnsAsync(redeem);

            // Act
            var credits = await sut.MyCreditHistory();
            var gbpCredits = credits.GetValueOrDefault(Currency.GBP)?.ToList();

            gbpCredits.Should().NotBeNull();
            gbpCredits!.Count.Should().Be(1);
            gbpCredits.ElementAt(0).Id.Should().Be("test_v");
            gbpCredits.ElementAt(0).Redemptions.Count().Should().Be(2);
            gbpCredits.ElementAt(0).Redemptions.ElementAt(0).Id.Should().Be("redeem_id1");
            gbpCredits.ElementAt(0).Redemptions.ElementAt(1).Id.Should().Be("redeem_id2");
        }
        [Fact]
        public async Task MyCreditHistory_ReturnHistoryWithoutExpiredCreditMoreThenTwoYears()
        {
            // Arrange
            var gift = new Gift();
            gift.SetProperty(x => x.Amount, 100);
            gift.SetProperty(x => x.Balance, 100);
            var sut = MockHappyPath(out Mock<IAuthenticationService> _, out Mock<IBookingRepository> _, out Mock<IBookingPaymentsRepository> _, out var customersRepository, out Mock<IVouchersRepository> _, out BookingResponse _, out Mock<ICacheService> _);
            var v1 = new VoucherWithCustomer();
            v1.SetProperty(x => x.Active, true);
            v1.SetProperty(x => x.Metadata, CreateMetadata(currency: "GBP"));
            v1.SetProperty(x => x.Code, "test_v");
            v1.SetProperty(x => x.Gift, gift);

            var v2 = new VoucherWithCustomer();
            v2.SetProperty(x => x.Active, false);

            var expiredCredit = new VoucherWithCustomer();
            expiredCredit.SetProperty(x => x.Active, true);
            expiredCredit.SetProperty(x => x.Metadata, CreateMetadata(currency: "GBP"));
            expiredCredit.SetProperty(x => x.Code, "test_v");
            expiredCredit.SetProperty(x => x.ExpirationDate, DateTime.UtcNow.AddYears(-2).AddDays(-1));
            expiredCredit.SetProperty(x => x.Gift, gift);

            var redeem1 = new Redemption();
            redeem1.SetProperty(x => x.Id, "redeem_id1");
            redeem1.SetProperty(x => x.Voucher, v1);
            redeem1.SetProperty(x => x.Date, DateTime.UtcNow);

            var redeem2 = new Redemption();
            redeem2.SetProperty(x => x.Id, "redeem_id2");
            redeem2.SetProperty(x => x.Voucher, v1);
            redeem2.SetProperty(x => x.Date, DateTime.UtcNow);

            RedemptionList redeem = (RedemptionList)System.Runtime.CompilerServices.RuntimeHelpers.GetUninitializedObject(typeof(RedemptionList));
            redeem.SetProperty(x => x.Redemptions, new List<Voucherify.DataModel.Redemption>
            {
                redeem1,
                redeem2,
            });

            customersRepository.Setup(x => x.GetCustomerVouchers(It.IsAny<string>())).ReturnsAsync(new List<VoucherWithCustomer>{
                v1, v2, expiredCredit
            });

            customersRepository.Setup(x => x.GetCustomerHistory(It.IsAny<string>())).ReturnsAsync(redeem);

            // Act
            var credits = await sut.MyCreditHistory();
            var gbpCredits = credits.GetValueOrDefault(Currency.GBP)?.ToList();

            gbpCredits.Should().NotBeNull();
            gbpCredits!.Count.Should().Be(1);
            gbpCredits.ElementAt(0).Id.Should().Be("test_v");
            gbpCredits.ElementAt(0).Redemptions.Count().Should().Be(2);
            gbpCredits.ElementAt(0).Redemptions.ElementAt(0).Id.Should().Be("redeem_id1");
            gbpCredits.ElementAt(0).Redemptions.ElementAt(1).Id.Should().Be("redeem_id2");
        }
        [Fact]
        public async Task MyCreditHistory_ReturnHistoryWithoutUsedCreditMoreThenTwoYears()
        {
            // Arrange
            var gift = new Gift();
            gift.SetProperty(x => x.Amount, 100);
            gift.SetProperty(x => x.Balance, 100);
            var sut = MockHappyPath(out Mock<IAuthenticationService> _, out Mock<IBookingRepository> _, out Mock<IBookingPaymentsRepository> _, out var customersRepository, out Mock<IVouchersRepository> _, out BookingResponse _, out Mock<ICacheService> _);
            var v1 = new VoucherWithCustomer();
            v1.SetProperty(x => x.Active, true);
            v1.SetProperty(x => x.Metadata, CreateMetadata(currency: "GBP"));
            v1.SetProperty(x => x.Code, "test_v");
            v1.SetProperty(x => x.Gift, gift);

            var v2 = new VoucherWithCustomer();
            v2.SetProperty(x => x.Active, false);

            var giftUsed = new Gift();
            giftUsed.SetProperty(x => x.Amount, 100);
            giftUsed.SetProperty(x => x.Balance, 0);
            var usedCredit = new VoucherWithCustomer();
            usedCredit.SetProperty(x => x.Active, true);
            usedCredit.SetProperty(x => x.Metadata, CreateMetadata(currency: "GBP"));
            usedCredit.SetProperty(x => x.Code, "test_used");
            usedCredit.SetProperty(x => x.Gift, giftUsed);
            usedCredit.SetProperty(x => x.CreatedAt, DateTime.UtcNow.AddYears(-2).AddDays(-1));

            var redeem1 = new Redemption();
            redeem1.SetProperty(x => x.Id, "redeem_id1");
            redeem1.SetProperty(x => x.Voucher, v1);
            redeem1.SetProperty(x => x.Date, DateTime.UtcNow);

            var redeem2 = new Redemption();
            redeem2.SetProperty(x => x.Id, "redeem_id2");
            redeem2.SetProperty(x => x.Voucher, v1);
            redeem2.SetProperty(x => x.Date, DateTime.UtcNow);

            var orderUsedCredit = new Order();
            orderUsedCredit.SetProperty(x => x.Amount, 100);
            var redemptionGiftUsed = new RedemptionGift();
            redemptionGiftUsed.SetProperty(x => x.Amount, 100);
            var redeemUsedCredit = new Redemption();
            redeemUsedCredit.SetProperty(x => x.Id, "redeem_id3");
            redeemUsedCredit.SetProperty(x => x.Voucher, usedCredit);
            redeemUsedCredit.SetProperty(x => x.Date, DateTime.UtcNow.AddYears(-2).AddDays(-1));
            redeemUsedCredit.SetProperty(x => x.Order, orderUsedCredit);
            redeemUsedCredit.SetProperty(x => x.Gift, redemptionGiftUsed);

            RedemptionList redeem = (RedemptionList)System.Runtime.CompilerServices.RuntimeHelpers.GetUninitializedObject(typeof(RedemptionList));
            redeem.SetProperty(x => x.Redemptions, new List<Voucherify.DataModel.Redemption>
            {
                redeem1,
                redeem2,
                redeemUsedCredit
            });

            customersRepository.Setup(x => x.GetCustomerVouchers(It.IsAny<string>())).ReturnsAsync(new List<VoucherWithCustomer>{
                v1, v2, usedCredit
            });

            customersRepository.Setup(x => x.GetCustomerHistory(It.IsAny<string>())).ReturnsAsync(redeem);

            // Act
            var credits = await sut.MyCreditHistory();
            var gbpCredits = credits.GetValueOrDefault(Currency.GBP)?.ToList();

            gbpCredits.Should().NotBeNull();
            gbpCredits!.Count.Should().Be(1);
            gbpCredits.ElementAt(0).Id.Should().Be("test_v");
            gbpCredits.ElementAt(0).Redemptions.Count().Should().Be(2);
            gbpCredits.ElementAt(0).Redemptions.ElementAt(0).Id.Should().Be("redeem_id1");
            gbpCredits.ElementAt(0).Redemptions.ElementAt(1).Id.Should().Be("redeem_id2");
        }
        #endregion
        #region RollBackRedemption
        [Fact]
        public async Task RollBackRedemption_Success()
        {
            // Arrange
            var sut = MockHappyPath(out Mock<IAuthenticationService> _, out Mock<IBookingRepository> _, out Mock<IBookingPaymentsRepository> _, out Mock<IVouchersCustomerRepository> _, out var vouchersRepository, out BookingResponse _, out Mock<ICacheService> _);

            vouchersRepository.Setup(x => x.RollbackRedemption(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(new RedemptionRollback());

            // Act
            await sut.RollBackCreditRedemptions(new[] { "test", "test1" }.AsEnumerable(), "test_ref");

        }

        [Fact]
        public async Task RollBackRedemption_Fail()
        {
            // Arrange
            var sut = MockHappyPath(out Mock<IAuthenticationService> _, out Mock<IBookingRepository> _, out Mock<IBookingPaymentsRepository> _, out Mock<IVouchersCustomerRepository> _, out var vouchersRepository, out BookingResponse _, out Mock<ICacheService> _);

            vouchersRepository.Setup(x => x.RollbackRedemption(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>())).Throws(new Exception());

            // Act
            try
            {
                await sut.RollBackCreditRedemptions(new[] { "test", "test1" }.AsEnumerable(), "test_ref");
            }
            catch (Exception e)
            {
                (e is ApiException).Should().BeTrue();
                ((ApiException)e).Code.Should().Be(ApiExceptionCodes.CreditsFailedToRollBackRedemption);
            }
        }
        #endregion
        #region ExchangeDiscount
        [Fact]
        public async Task ExchangeDiscount_InvalidRedemption_ThrowsNotFound()
        {
            // Arrange
            var settings = _fixture.Create<IOptions<VoucherifySettings>>().Value;
            var reason = settings.ReasonNotFound;
            ValidationWithMeta mockValidation = BuildValidationMock(reason);

            _mockVoucherRepo.Setup(
                repo =>
                repo.ValidateRedemption(It.IsAny<string>(), null, null, null)
            ).ReturnsAsync(mockValidation);

            // Act
            Func<Task> action = () => _sut.ExchangeDiscountToAtcomCode(It.IsAny<string>());

            // Assert
            var exc = await Assert.ThrowsAsync<ApiException>(action);
            exc.Should().NotBeNull("because the voucher could not be found and is therefore invalid.");
            exc.Code.Should().Be(ApiExceptionCodes.VoucherNotFound, "because the voucher wasn't found inside ValidateRedemption.");
            exc.InnerErrors.Should().HaveCount(1);
            exc.InnerErrors.Should().ContainEquivalentOf(
                new ApiError
                {
                    Code = ApiExceptionCodes.VoucherNotFound.Code,
                    Message = ApiExceptionCodes.VoucherInvalid.Description
                }
            );
        }

        [Fact]
        public async Task ExchangeDiscount_InvalidRedemption_ThrowsExceeded()
        {
            // Arrange
            var settings = _fixture.Create<IOptions<VoucherifySettings>>().Value;
            var reason = settings.ReasonExceeded;
            ValidationWithMeta mockValidation = BuildValidationMock(reason);

            _mockVoucherRepo.Setup(
                repo =>
                repo.ValidateRedemption(It.IsAny<string>(), null, null, null)
            ).ReturnsAsync(mockValidation);

            // Act
            Func<Task> action = () => _sut.ExchangeDiscountToAtcomCode(It.IsAny<string>());

            // Assert
            var exc = await Assert.ThrowsAsync<ApiException>(action);
            exc.Should().NotBeNull("because the voucher was exceeded and is therefore invalid.");
            exc.Code.Should().Be(ApiExceptionCodes.VoucherExceeded, "because ValidateRedemption returned an exceeded voucher.");
            exc.InnerErrors.Should().HaveCount(1);
            exc.InnerErrors.Should().ContainEquivalentOf(
                new ApiError
                {
                    Code = ApiExceptionCodes.VoucherExceeded.Code,
                    Message = ApiExceptionCodes.VoucherInvalid.Description
                }
            );
        }
        #endregion ExchangeDiscounts
        #region UseDiscountVoucher
        [Fact]
        public async Task UseDiscountVoucher_FailedRedemption_ThrowsApiException()
        {
            // Arrange
            var mockRedemptionString = @"{
                ""result"": ""FAILURE""
            }";
            var mockRedemption = JsonConvert.DeserializeObject<Redemption>(mockRedemptionString);

            _mockVoucherRepo.Setup(repo => repo.ProcessRedemption(null, null, null, It.IsAny<Dictionary<string, object>>()))
                            .ReturnsAsync(mockRedemption);

            // Act
            Func<Task> action = () => _sut.UseDiscountVoucher(It.IsAny<string>(), It.IsAny<string>());

            // Assert
            var exc = await Assert.ThrowsAsync<ApiException>(action);
            exc.Should().NotBeNull("because an exception is expected if redemption fails.");
            exc.Code.Should().Be(ApiExceptionCodes.FailedRedeemVoucher, "because voucher redemption failed.");
        }

        [Fact]
        public async Task UseDiscountVoucher_SuccessfulRedemption()
        {
            // Arrange
            var testCode = "testFreeStuff";
            var mockRedemptionString = @"{
                ""id"": 1000,
                ""result"": ""SUCCESS""
            }";
            var mockRedemption = JsonConvert.DeserializeObject<Redemption>(mockRedemptionString);
            _mockVoucherRepo.Setup(repo => repo.ProcessRedemption(testCode, null, null, It.IsAny<Dictionary<string, object>>()))
                            .ReturnsAsync(mockRedemption);
            _mockVoucherRepo.Setup(repo => repo.UpdateDetails(testCode, It.IsAny<Dictionary<string, object>>(), null))
                            .ReturnsAsync(new Voucher());

            // Act
            var id = await _sut.UseDiscountVoucher(testCode, It.IsAny<string>());

            // Assert
            id.Should().NotBeNull("because the whole flow passed.");
            id.Should().Be("1000", "because this is the ID recieved in the redemption returned from the voucher repo.");
            _mockVoucherRepo.Verify(repo => repo.ProcessRedemption(testCode, null, null, It.IsAny<Dictionary<string, object>>()), Times.Once);
            _mockVoucherRepo.Verify(repo => repo.UpdateDetails(testCode, It.IsAny<Dictionary<string, object>>(), null), Times.Once);
        }
        #endregion UseDiscountVoucher
        #region AddCreditToBooking
        [Fact]
        public async Task AddCreditToBooking_BookingNull_ThrowsArgumentNull()
        {
            // Arrange
            BookingResponse booking = null;

            // Act
            Func<Task> action = () => _sut.AddCreditToBooking(
                It.IsAny<string>(),
                It.IsAny<CreditBreakdown>(),
                It.IsAny<string>(),
                booking,
                It.IsAny<Dictionary<string, object>>()
            );

            // Assert
            var exc = await Assert.ThrowsAsync<ArgumentNullException>(action);
            exc.Should().NotBeNull("because the provided BookingResponse is null");
        }

        [Fact]
        public async Task AddCreditToBooking_AddsGoodWillRefundGiftCodes_ReturnsNewCodes()
        {
            // Arrange
            var settings = _fixture.Create<IOptions<ApiSettings>>().Value;
            var customerId = "testCustomer1";
            var goodwillAmt = 100m;
            var giftAmt = 200m;
            var refundAmt = 300m;
            var breakDown = new CreditBreakdown { Goodwill = goodwillAmt, GiftCard = giftAmt, Refund = refundAmt, };
            var voucherId = "testVoucher1234";
            var expectedGoodWillCode = VouchersService.BuildCode(settings.Vouchers.Types.Goodwill, voucherId);
            var expectedGiftCode = VouchersService.BuildCode(settings.Vouchers.Types.GiftCard, voucherId);
            var expectedRefundCode = VouchersService.BuildCode(settings.Vouchers.Types.Refund, voucherId);
            var booking = new BookingResponse
            {
                PaymentInfo = new PriceInfo
                {
                    PaymentHistory = new PaymentHistoryItem[0]
                },
            };

            SetupCreateOrGet(expectedGoodWillCode);
            SetupCreateOrGet(expectedGiftCode);
            SetupCreateOrGet(expectedRefundCode);

            SetupAddVoucherGiftBalance(goodwillAmt, expectedGoodWillCode);
            SetupAddVoucherGiftBalance(giftAmt, expectedGiftCode);
            SetupAddVoucherGiftBalance(refundAmt, expectedRefundCode);

            SetupPublish(expectedGoodWillCode, customerId);
            SetupPublish(expectedGiftCode, customerId);
            SetupPublish(expectedRefundCode, customerId);

            _mockBookingRepo.Setup(
                mock =>
                mock.ModifyMemo(It.IsAny<string>(), It.IsAny<BookingMemo>())
            ).Returns(Task.CompletedTask);

            _mockBookingPaymentsRepo.Setup(
                mock =>
                mock.AddCreditPaymentInfo(
                    It.IsAny<string>(), It.IsAny<decimal>(),
                    It.IsAny<LeadPassenger>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                    It.IsAny<string>(),
                    null, null, null
                )
            ).ReturnsAsync(new BookingResponse());

            // Act
            var vouchers = await _sut.AddCreditToBooking(customerId, breakDown, voucherId, booking, new Dictionary<string, object>());

            // Assert
            var voucherCodes = vouchers.Select(x => x.Code).ToList();

            _mockVoucherRepo.Verify(mock => mock.Create(expectedGoodWillCode, It.IsAny<Dictionary<string, object>>(), null, It.IsAny<DateTimeOffset?>()), Times.Once);
            _mockVoucherRepo.Verify(mock => mock.AddVoucherGiftBalance(expectedGoodWillCode, ((int)goodwillAmt * 100)), Times.Once);
            _mockVoucherRepo.Verify(mock => mock.Publish(expectedGoodWillCode, customerId), Times.Once);
            voucherCodes.Should().Contain(expectedGoodWillCode);

            _mockVoucherRepo.Verify(mock => mock.Create(expectedGiftCode, It.IsAny<Dictionary<string, object>>(), null, It.IsAny<DateTimeOffset?>()), Times.Once);
            _mockVoucherRepo.Verify(mock => mock.AddVoucherGiftBalance(expectedGiftCode, ((int)giftAmt * 100)), Times.Once);
            _mockVoucherRepo.Verify(mock => mock.Publish(expectedGiftCode, customerId), Times.Once);
            voucherCodes.Should().Contain(expectedGiftCode);

            _mockVoucherRepo.Verify(mock => mock.Create(expectedRefundCode, It.IsAny<Dictionary<string, object>>(), null, It.IsAny<DateTimeOffset?>()), Times.Once);
            _mockVoucherRepo.Verify(mock => mock.AddVoucherGiftBalance(expectedRefundCode, ((int)refundAmt * 100)), Times.Once);
            _mockVoucherRepo.Verify(mock => mock.Publish(expectedRefundCode, customerId), Times.Once);
            voucherCodes.Should().Contain(expectedRefundCode);

            _mockBookingRepo.Verify(mock => mock.ModifyMemo(It.IsAny<string>(), It.IsAny<BookingMemo>()), Times.Once);
            _mockBookingPaymentsRepo.Verify(
                mock =>
                mock.AddCreditPaymentInfo(
                    It.IsAny<string>(), It.IsAny<decimal>(),
                    It.IsAny<LeadPassenger>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                    It.IsAny<string>(),
                    null, null, null
                ), Times.Exactly(3)
            );

            void SetupCreateOrGet(string code)
            {
                _mockVoucherRepo.Setup(
                    mock =>
                    mock.Create(code, It.IsAny<Dictionary<string, object>>(), null, null)
                ).ReturnsAsync(new Voucher());
            }

            void SetupAddVoucherGiftBalance(decimal amount, string code)
            {
                _mockVoucherRepo.Setup(
                    mock =>
                    mock.AddVoucherGiftBalance(code, (int)amount * 100)
                ).ReturnsAsync(new Balance());
            }

            void SetupPublish(string code, string id)
            {
                _mockVoucherRepo.Setup(
                    mock =>
                    mock.Publish(code, id)
                ).ReturnsAsync(new PublicationSingle());
            }
        }

        [Fact]
        public async Task AddCreditToBooking_AddsPromoCodes_ReturnsNewCodes()
        {
            // Arrange
            _ = _fixture.Create<IOptions<ApiSettings>>().Value;
            _ = _fixture.Create<IOptions<AtcomSettings>>().Value;
            var customerId = "testCustomer1";
            var promoAmt = 100m;
            var breakDown = new CreditBreakdown { Promo = promoAmt };
            var voucherId = "testVoucher1234";
            var booking = new BookingResponse
            {
                PaymentInfo = new PriceInfo
                {
                    PaymentHistory = new[]
                    {
                        new PaymentHistoryItem { IsPromoCredit = true, Amount = 50, PayMethodCode = "IR", PayId = "1" },
                        new PaymentHistoryItem { IsPromoCredit = true, Amount = 50, PayMethodCode = "GR", PayId = "2" },
                    },
                },
            };

            _mockBookingPaymentsRepo.Setup(
                mock =>
                mock.AddCreditPaymentInfo(
                    It.IsAny<string>(), It.IsAny<decimal>(),
                    It.IsAny<LeadPassenger>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                    It.IsAny<string>(),
                    null, null, null)
            ).ReturnsAsync(booking);

            var count = booking.PaymentInfo?.PaymentHistory?.Length ?? -1;

            // Act
            var codes = await _sut.AddCreditToBooking(customerId, breakDown, voucherId, booking, new Dictionary<string, object>());

            // Assert
            count.Should().BeGreaterThan(-1);
            codes.Count.Should().Be(count);
            _mockBookingPaymentsRepo.Verify(
                mock =>
                mock.AddCreditPaymentInfo(
                    It.IsAny<string>(), It.IsAny<decimal>(),
                    It.IsAny<LeadPassenger>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                    It.IsAny<string>(),
                    null, null, null),
                Times.Exactly(count)
            );
        }

        [Fact]
        public async Task AddCreditToBooking_PromoCodesWithPastExpiredDate_NewExpiredVoucherIsIssuedAndRecordedInPaymentHistory()
        {
            // Arrange
            _ = _fixture.Create<IOptions<ApiSettings>>().Value;
            var atcomSettings = _fixture.Create<IOptions<AtcomSettings>>().Value;
            var customerId = "testCustomer1";
            var promoAmt = 50m;
            var breakDown = new CreditBreakdown { Promo = promoAmt };
            var voucherId = "testVoucher1234";
            var booking = new BookingResponse
            {
                PaymentInfo = new PriceInfo
                {
                    PaymentHistory = new[]
                    {
                        new PaymentHistoryItem { IsPromoCredit = true, Amount = 50, PayMethodCode = "PSTJE", PayId = "1" },
                    },
                },
            };

            _mockBookingPaymentsRepo.Setup(
                mock =>
                mock.AddCreditPaymentInfo(
                    It.IsAny<string>(), It.IsAny<decimal>(),
                    It.IsAny<LeadPassenger>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                    It.IsAny<string>(),
                    null, null, null)
            ).ReturnsAsync(booking);

            // Act
            var codes = await _sut.AddCreditToBooking(customerId, breakDown, voucherId, booking, new Dictionary<string, object>());

            // Assert
            codes.Count.Should().Be(1);

            _mockVoucherRepo.Verify(
                 mock =>
                 mock.Create(
                 It.IsAny<string>(),
                 It.IsAny<Dictionary<string, object>>(),
                 It.IsAny<decimal?>(),
                 atcomSettings.PaymentCodes["PromotionStaffCredit2324Expired"].ExpirationDate),
                 Times.Once);

            _mockBookingPaymentsRepo.Verify(
                mock =>
                mock.AddCreditPaymentInfo(
                    It.IsAny<string>(), It.IsAny<decimal>(),
                    It.IsAny<LeadPassenger>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                    It.IsAny<string>(),
                    null, null, null),
                Times.Once
            );
        }

        [Fact]
        public async Task AddCreditToBooking_PromoCodesWithFutureExpiredDate_ReturnsNewCodes()
        {
            // Arrange
            _ = _fixture.Create<IOptions<ApiSettings>>().Value;
            var atcomSettings = _fixture.Create<IOptions<AtcomSettings>>().Value;
            var customerId = "testCustomer1";
            var promoAmt = 50m;
            var breakDown = new CreditBreakdown { Promo = promoAmt };
            var voucherId = "testVoucher1234";
            var booking = new BookingResponse
            {
                PaymentInfo = new PriceInfo
                {
                    PaymentHistory = new[]
                    {
                        new PaymentHistoryItem { IsPromoCredit = true, Amount = 50, PayMethodCode = "PSTJ", PayId = "1" },
                    },
                },
            };

            _mockBookingPaymentsRepo.Setup(
                mock =>
                mock.AddCreditPaymentInfo(
                    It.IsAny<string>(), It.IsAny<decimal>(),
                    It.IsAny<LeadPassenger>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                    It.IsAny<string>(),
                    null, null, null)
            ).ReturnsAsync(booking);

            // Act
            var codes = await _sut.AddCreditToBooking(customerId, breakDown, voucherId, booking, new Dictionary<string, object>());

            // Assert
            codes.Count.Should().Be(1);

            _mockVoucherRepo.Verify(
                mock =>
                mock.Create(
                It.IsAny<string>(),
                It.IsAny<Dictionary<string, object>>(),
                It.IsAny<decimal?>(),
                atcomSettings.PaymentCodes["PromotionStaffCredit2324"].ExpirationDate),
                Times.Once);

            _mockBookingPaymentsRepo.Verify(
                mock =>
                mock.AddCreditPaymentInfo(
                    It.IsAny<string>(), It.IsAny<decimal>(),
                    It.IsAny<LeadPassenger>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                    It.IsAny<string>(),
                    null, null, null),
                Times.Exactly(1)
            );
        }

        [Fact]
        public async Task AddCreditToBooking_PromoCodes_MissingReason_Throws()
        {
            // Arrange
            _ = _fixture.Create<IOptions<ApiSettings>>().Value;
            _ = _fixture.Create<IOptions<AtcomSettings>>().Value;
            var customerId = "testCustomer1";
            var promoAmt = 100m;
            var breakDown = new CreditBreakdown { Promo = promoAmt };
            var voucherId = "testVoucher1234";
            var booking = new BookingResponse
            {
                PaymentInfo = new PriceInfo
                {
                    PaymentHistory = new[]
                    {
                        new PaymentHistoryItem { IsPromoCredit = true, Amount = 50, PayMethodCode = "IR", PayId = "1" },
                        new PaymentHistoryItem { IsPromoCredit = true, Amount = 50, PayMethodCode = "ThisIsNotAKnownCode", PayId = "2" },
                    },
                },
            };

            // Act
            Func<Task<List<CreatedVoucher>>> action = () => _sut.AddCreditToBooking(customerId, breakDown, voucherId, booking, new Dictionary<string, object>());


            // Assert
            var exc = await Assert.ThrowsAsync<ApiException>(action);
            exc.Should().NotBeNull();
            exc.Code.Should().Be(ApiExceptionCodes.BookingCreditInconsistentError);
        }

        [Fact]
        public async Task AddCreditToBooking_UnCancelledBooking_GetsCancelled()
        {
            // Arrange
            var breakdown = new CreditBreakdown();
            var booking = new BookingResponse
            {
                BookingStatus = "AnyOtherStatusThanCancelled",
                BookingReference = "testReference",
                PaymentInfo = new PriceInfo
                {
                    PaymentHistory = new PaymentHistoryItem[0]
                },
            };

            _mockBookingRepo.Setup(
                mock =>
                mock.ModifyMemo(It.IsAny<string>(), It.IsAny<BookingMemo>())
            ).Returns(Task.CompletedTask);

            _mockBookingRepo.Setup(
                mock =>
                mock.CancelBooking(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<IList<string>>())
            ).ReturnsAsync(booking);

            // Act
            var codes = await _sut.AddCreditToBooking(null, breakdown, null, booking, null);

            // Assert
            codes.Should().BeEmpty();
            _mockBookingRepo.Verify(mock => mock.CancelBooking(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<IList<string>>()), Times.Once());
        }

        [Fact]
        public async Task AddCreditToBooking_MarkBookingAsCancelledSetToFalse_BookingIsNotCanceled()
        {
            // Arrange
            var breakdown = new CreditBreakdown();
            var cancelBooking = false;
            var booking = new BookingResponse
            {
                BookingStatus = "AnyOtherStatusThanCancelled",
                BookingReference = "testReference",
                PaymentInfo = new PriceInfo
                {
                    PaymentHistory = new PaymentHistoryItem[0]
                },
            };

            _mockBookingRepo.Setup(
                mock =>
                mock.ModifyMemo(It.IsAny<string>(), It.IsAny<BookingMemo>())
            ).Returns(Task.CompletedTask);

            _mockBookingRepo.Setup(
                mock =>
                mock.CancelBooking(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<IList<string>>())
            ).ReturnsAsync(booking);

            // Act
            var codes = await _sut.AddCreditToBooking(null, breakdown, null, booking, null, cancelBooking);

            // Assert
            codes.Should().BeEmpty();
            _mockBookingRepo.Verify(mock => mock.CancelBooking(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<IList<string>>()), Times.Never);
        }

        [Fact]
        public async Task AddCreditToBooking_FailsToCancel_Rollback()
        {
            // Arrange
            _ = _fixture.Create<IOptions<ApiSettings>>().Value;
            _ = _fixture.Create<IOptions<AtcomSettings>>().Value;
            var customerId = "testCustomer1";
            var promoAmt = 10m;
            var breakDown = new CreditBreakdown { Promo = promoAmt };
            var voucherId = "testVoucher1234";
            var booking = new BookingResponse
            {
                BookingStatus = "AnythingButCanceled",
                PaymentInfo = new PriceInfo
                {
                    PaymentHistory = new[]
                    {
                        new PaymentHistoryItem { IsPromoCredit = true, Amount = 10, PayMethodCode = "IR", PayId = "1" },
                    },
                },
            };

            _mockVoucherRepo.Setup(
                    mock =>
                    mock.Create(It.IsAny<string>(), It.IsAny<Dictionary<string, object>>(), null, null)
                ).ReturnsAsync(new Voucher());

            _mockBookingPaymentsRepo.Setup(
                mock =>
                mock.AddCreditPaymentInfo(
                    It.IsAny<string>(), It.IsAny<decimal>(),
                    It.IsAny<LeadPassenger>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                    It.IsAny<string>(),
                    null, null, null)
            ).ReturnsAsync(booking);

            _mockBookingRepo.Setup(
                mock =>
                mock.CancelBooking(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<IList<string>>())
            ).Throws(new Exception());

            _mockVoucherRepo.Setup(
                mock =>
                mock.Delete(It.IsAny<string>())
            ).Returns(Task.CompletedTask);

            // Act
            Func<Task<List<CreatedVoucher>>> action = () => _sut.AddCreditToBooking(customerId, breakDown, voucherId, booking, new Dictionary<string, object>());


            // Assert
            var exc = await Assert.ThrowsAsync<Exception>(action);
            exc.Should().NotBeNull();
            _mockVoucherRepo.Verify(mock => mock.Delete(It.IsAny<string>()), Times.Once);
        }
        #endregion AddCreditToBooking
        #region CreateVouchersAndUpdateBooking

        [Fact]
        public async Task CreateVouchersAndUpdateBooking_BookingNull_ThrowsArgumentNull()
        {
            // Arrange
            BookingResponse booking = null;

            // Act
            Func<Task> action = () => _sut.CreateVouchersAndUpdateBooking(
                It.IsAny<string>(),
                It.IsAny<BookingCancellationCreditRefundBreakdown>(),
                It.IsAny<string>(),
                booking,
                It.IsAny<Dictionary<string, object>>()
            );

            // Assert
            var exc = await Assert.ThrowsAsync<ArgumentNullException>(action);
            exc.Should().NotBeNull("because the provided BookingResponse is null");
        }

        [Fact]
        public async Task RollbackVouchers_FilledListWithVoucherCodes_ResultTrue()
        {
            // Arrange
            var voucherCodes = new List<CreatedVoucher>()
            {
                new CreatedVoucher()
                {
                    Code = "Voucher1",
                    Amount = 100,
                    Reason = "Reason1",
                } ,
                new CreatedVoucher()
                {
                    Code = "Voucher2",
                    Amount = 200,
                    Reason = "Reason2",
                }
            };
            var bookingResponse = new BookingResponse();
            _mockVoucherRepo.Setup(m => m.Delete(It.IsAny<string>()));

            // Act
            var result = await _sut.RollbackVouchers(bookingResponse, voucherCodes);

            // Assert
            result.Should().Be(true);
        }

        [Fact]
        public async Task RollbackVouchers_FilledListWithVoucherCodesButExceptionWhileDelete_ResultFalse()
        {
            // Arrange
            var voucherCodes = new List<CreatedVoucher>()
            {
                new CreatedVoucher()
                {
                    Code = "Voucher1",
                    Amount = 100,
                    Reason = "Reason1",
                } ,
                new CreatedVoucher()
                {
                    Code = "Voucher2",
                    Amount = 200,
                    Reason = "Reason2",
                }
            };
            var bookingResponse = new BookingResponse();
            _mockVoucherRepo.Setup(m => m.Delete(It.IsAny<string>())).ThrowsAsync(new ApiException(new ExceptionCode(), HttpStatusCode.BadRequest));

            // Act
            var result = await _sut.RollbackVouchers(bookingResponse, voucherCodes);

            // Assert
            result.Should().Be(false);
        }

        [Fact]
        public async Task CreateVouchersAndUpdateBooking_AddsOTUCMadeOfTwoTheSamePromosAndCashCodes_ReturnsNewCodes()
        {
            // Arrange
            var settings = _fixture.Create<IOptions<ApiSettings>>().Value;
            var atcomSettings = _fixture.Create<IOptions<AtcomSettings>>().Value;
            var customerId = "testCustomer1";
            var otuc1Amt = 15;
            var otuc2Amt = 25;
            var otucCashAmt = 20;
            var breakDown = new BookingCancellationCreditRefundBreakdown
            {
                OneTimeUse = otuc1Amt + otuc2Amt + otucCashAmt,
                OneTimeUseCreditStructure = new OneTimeUseCreditStructure
                {
                    PromoCreditMadeOf =
                        new ReadOnlyCollection<MadeOfWithReason>([
                            new MadeOfWithReason("promo transaction id 1", otuc1Amt,
                                atcomSettings.PaymentCodes["PromotionStaffCredit2324"].Reason),
                            new MadeOfWithReason("promo transaction id 2", otuc2Amt,
                                atcomSettings.PaymentCodes["PromotionStaffCredit2324"].Reason)
                        ]),
                }
            };
            var voucherId = "testVoucher1234";
            var expectedOTUC1 = VouchersService.BuildCode(settings.Vouchers.Types.OneTimeUse, $"{voucherId}-promo-1");
            var expectedOTUC2 = VouchersService.BuildCode(settings.Vouchers.Types.OneTimeUse, $"{voucherId}-promo-2");
            var expectedOTUCCash = VouchersService.BuildCode(settings.Vouchers.Types.OneTimeUse, $"{voucherId}");
            var booking = new BookingResponse
            {
                PaymentInfo = new PriceInfo
                {
                    PaymentHistory = new PaymentHistoryItem[0]
                },
            };

            SetupCreateOrGet(expectedOTUC1);
            SetupCreateOrGet(expectedOTUC2);
            SetupCreateOrGet(expectedOTUCCash);

            SetupAddVoucherGiftBalance(otuc1Amt, expectedOTUC1);
            SetupAddVoucherGiftBalance(otuc2Amt, expectedOTUC2);
            SetupAddVoucherGiftBalance(20, expectedOTUCCash);

            SetupPublish(expectedOTUC1, customerId);
            SetupPublish(expectedOTUC2, customerId);
            SetupPublish(expectedOTUCCash, customerId);

            _mockBookingRepo.Setup(
                mock =>
                mock.ModifyMemo(It.IsAny<string>(), It.IsAny<BookingMemo>())
            ).Returns(Task.CompletedTask);

            _mockBookingPaymentsRepo.Setup(
                mock =>
                mock.AddCreditPaymentInfo(
                    It.IsAny<string>(), It.IsAny<decimal>(),
                    It.IsAny<LeadPassenger>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                    It.IsAny<string>(),
                    null, null, null
                )
            ).ReturnsAsync(new BookingResponse());

            // Act
            var vouchers = await _sut.CreateVouchersAndUpdateBooking(customerId, breakDown, voucherId, booking, new Dictionary<string, object>());

            // Assert
            var voucherCodes = vouchers.Select(x => x.Code).ToList();

            _mockVoucherRepo.Verify(mock => mock.Create(expectedOTUC1, It.Is<Dictionary<string, object>>(dict => dict.ContainsKey(VoucherifyMetaKeys.PreviousCreditTypes) && dict[VoucherifyMetaKeys.PreviousCreditTypes].ToString() == "Promotion - Staff credit 23-24[promo transaction id 1]"), null, It.IsAny<DateTimeOffset?>()), Times.Once);
            _mockVoucherRepo.Verify(mock => mock.AddVoucherGiftBalance(expectedOTUC1, (otuc1Amt * 100)), Times.Once);
            _mockVoucherRepo.Verify(mock => mock.Publish(expectedOTUC1, customerId), Times.Once);
            voucherCodes.Should().Contain(expectedOTUC1);

            _mockVoucherRepo.Verify(mock => mock.Create(expectedOTUC2, It.Is<Dictionary<string, object>>(dict => dict.ContainsKey(VoucherifyMetaKeys.PreviousCreditTypes) && dict[VoucherifyMetaKeys.PreviousCreditTypes].ToString() == "Promotion - Staff credit 23-24[promo transaction id 2]"), null, It.IsAny<DateTimeOffset?>()), Times.Once);
            _mockVoucherRepo.Verify(mock => mock.AddVoucherGiftBalance(expectedOTUC2, (otuc2Amt * 100)), Times.Once);
            _mockVoucherRepo.Verify(mock => mock.Publish(expectedOTUC2, customerId), Times.Once);
            voucherCodes.Should().Contain(expectedOTUC2);

            _mockVoucherRepo.Verify(mock => mock.Create(expectedOTUCCash, It.Is<Dictionary<string, object>>(dict => dict.ContainsKey(VoucherifyMetaKeys.PreviousCreditTypes) && dict[VoucherifyMetaKeys.PreviousCreditTypes].ToString() == "cash"), null, It.IsAny<DateTimeOffset?>()), Times.Once);
            _mockVoucherRepo.Verify(mock => mock.AddVoucherGiftBalance(expectedOTUCCash, (otucCashAmt * 100)), Times.Once);
            _mockVoucherRepo.Verify(mock => mock.Publish(expectedOTUCCash, customerId), Times.Once);
            voucherCodes.Should().Contain(expectedOTUCCash);

            _mockBookingRepo.Verify(mock => mock.ModifyMemo(It.IsAny<string>(), It.IsAny<BookingMemo>()), Times.Once);
            _mockBookingPaymentsRepo.Verify(
                mock =>
                mock.AddCreditPaymentInfo(
                    It.IsAny<string>(), It.IsAny<decimal>(),
                    It.IsAny<LeadPassenger>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                    It.IsAny<string>(),
                    null, null, null
                ), Times.Exactly(3)
            );

            void SetupCreateOrGet(string code)
            {
                _mockVoucherRepo.Setup(
                    mock =>
                    mock.Create(code, It.IsAny<Dictionary<string, object>>(), null, null)
                ).ReturnsAsync(new Voucher());
            }

            void SetupAddVoucherGiftBalance(decimal amount, string code)
            {
                _mockVoucherRepo.Setup(
                    mock =>
                    mock.AddVoucherGiftBalance(code, (int)amount * 100)
                ).ReturnsAsync(new Balance());
            }

            void SetupPublish(string code, string id)
            {
                _mockVoucherRepo.Setup(
                    mock =>
                    mock.Publish(code, id)
                ).ReturnsAsync(new PublicationSingle());
            }
        }

        [Fact]
        public async Task CreateVouchersAndUpdateBooking_AddsOTUCMadeOfTwoPromosAndCashCodesWhenOneTimeUseWasKept_ReturnsNewCodes()
        {
            // Arrange
            var settings = _fixture.Create<IOptions<ApiSettings>>().Value;
            var atcomSettings = _fixture.Create<IOptions<AtcomSettings>>().Value;
            var customerId = "testCustomer1";
            var otuc1Amt = 30;
            var otuc2Amt = 23.98m;
            var otucCashAmt = 36.02m;
            var refundAmt = 188.08m;
            var breakDown = new BookingCancellationCreditRefundBreakdown
            {
                Refund = refundAmt,
                OneTimeUse = otuc1Amt + otuc2Amt + otucCashAmt,
                OneTimeUseCreditStructure = new OneTimeUseCreditStructure
                {
                    PromoCreditMadeOf =
                        new ReadOnlyCollection<MadeOfWithReason>([
                            new MadeOfWithReason("promo transaction id 1", otuc1Amt,
                                atcomSettings.PaymentCodes["PromotionMarketing"].Reason),
                            new MadeOfWithReason("promo transaction id 2", otuc2Amt,
                                atcomSettings.PaymentCodes["PromotionMarketing"].Reason)
                        ]),
                }
            };
            var voucherId = "testVoucher1234";
            var expectedOTUC1 = VouchersService.BuildCode(settings.Vouchers.Types.OneTimeUse, $"{voucherId}-promo-1");
            var expectedOTUC2 = VouchersService.BuildCode(settings.Vouchers.Types.OneTimeUse, $"{voucherId}-promo-2");
            var expectedOTUCCash = VouchersService.BuildCode(settings.Vouchers.Types.OneTimeUse, $"{voucherId}");
            var expectedRefundCode = VouchersService.BuildCode(settings.Vouchers.Types.Refund, $"{voucherId}");
            var booking = new BookingResponse
            {
                PaymentInfo = new PriceInfo
                {
                    PaymentHistory = new PaymentHistoryItem[0]
                },
            };

            SetupCreateOrGet(expectedOTUC1);
            SetupCreateOrGet(expectedOTUC2);
            SetupCreateOrGet(expectedOTUCCash);
            SetupCreateOrGet(expectedRefundCode);

            SetupAddVoucherGiftBalance(otuc1Amt, expectedOTUC1);
            SetupAddVoucherGiftBalance(otuc2Amt, expectedOTUC2);
            SetupAddVoucherGiftBalance(otucCashAmt, expectedOTUCCash);
            SetupAddVoucherGiftBalance(refundAmt, expectedRefundCode);

            SetupPublish(expectedOTUC1, customerId);
            SetupPublish(expectedOTUC2, customerId);
            SetupPublish(expectedOTUCCash, customerId);
            SetupPublish(expectedRefundCode, customerId);

            _mockBookingRepo.Setup(
                mock =>
                mock.ModifyMemo(It.IsAny<string>(), It.IsAny<BookingMemo>())
            ).Returns(Task.CompletedTask);

            _mockBookingPaymentsRepo.Setup(
                mock =>
                mock.AddCreditPaymentInfo(
                    It.IsAny<string>(), It.IsAny<decimal>(),
                    It.IsAny<LeadPassenger>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                    It.IsAny<string>(),
                    null, null, null
                )
            ).ReturnsAsync(new BookingResponse());

            // Act
            var vouchers = await _sut.CreateVouchersAndUpdateBooking(customerId, breakDown, voucherId, booking, new Dictionary<string, object>());

            // Assert
            var voucherCodes = vouchers.Select(x => x.Code).ToList();

            _mockVoucherRepo.Verify(mock => mock.Create(expectedOTUC1, It.Is<Dictionary<string, object>>(dict => dict.ContainsKey(VoucherifyMetaKeys.PreviousCreditTypes) && dict[VoucherifyMetaKeys.PreviousCreditTypes].ToString() == "Promotion - Marketing[promo transaction id 1]"), null, It.IsAny<DateTimeOffset?>()), Times.Once);
            _mockVoucherRepo.Verify(mock => mock.AddVoucherGiftBalance(expectedOTUC1, otuc1Amt * 100), Times.Once);
            _mockVoucherRepo.Verify(mock => mock.Publish(expectedOTUC1, customerId), Times.Once);
            voucherCodes.Should().Contain(expectedOTUC1);

            _mockVoucherRepo.Verify(mock => mock.Create(expectedOTUC2, It.Is<Dictionary<string, object>>(dict => dict.ContainsKey(VoucherifyMetaKeys.PreviousCreditTypes) && dict[VoucherifyMetaKeys.PreviousCreditTypes].ToString() == "Promotion - Marketing[promo transaction id 2]"), null, It.IsAny<DateTimeOffset?>()), Times.Once);
            _mockVoucherRepo.Verify(mock => mock.AddVoucherGiftBalance(expectedOTUC2, (int)(otuc2Amt * 100)), Times.Once);
            _mockVoucherRepo.Verify(mock => mock.Publish(expectedOTUC2, customerId), Times.Once);
            voucherCodes.Should().Contain(expectedOTUC2);

            _mockVoucherRepo.Verify(mock => mock.Create(expectedOTUCCash, It.Is<Dictionary<string, object>>(dict => dict.ContainsKey(VoucherifyMetaKeys.PreviousCreditTypes) && dict[VoucherifyMetaKeys.PreviousCreditTypes].ToString() == "cash"), null, It.IsAny<DateTimeOffset?>()), Times.Once);
            _mockVoucherRepo.Verify(mock => mock.AddVoucherGiftBalance(expectedOTUCCash, (int)(otucCashAmt * 100)), Times.Once);
            _mockVoucherRepo.Verify(mock => mock.Publish(expectedOTUCCash, customerId), Times.Once);
            voucherCodes.Should().Contain(expectedOTUCCash);

            _mockVoucherRepo.Verify(mock => mock.Create(expectedRefundCode, It.Is<Dictionary<string, object>>(dict => dict.ContainsKey(VoucherifyMetaKeys.PreviousCreditTypes) && dict[VoucherifyMetaKeys.PreviousCreditTypes].ToString() == "cash"), null, It.IsAny<DateTimeOffset?>()), Times.Once);
            _mockVoucherRepo.Verify(mock => mock.AddVoucherGiftBalance(expectedRefundCode, (int)(refundAmt * 100)), Times.Once);
            _mockVoucherRepo.Verify(mock => mock.Publish(expectedRefundCode, customerId), Times.Once);
            voucherCodes.Should().Contain(expectedRefundCode);

            _mockBookingRepo.Verify(mock => mock.ModifyMemo(It.IsAny<string>(), It.IsAny<BookingMemo>()), Times.Once);
            _mockBookingPaymentsRepo.Verify(
                mock =>
                mock.AddCreditPaymentInfo(
                    It.IsAny<string>(), It.IsAny<decimal>(),
                    It.IsAny<LeadPassenger>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                    It.IsAny<string>(),
                    null, null, null
                ), Times.Exactly(4)
            );

            void SetupCreateOrGet(string code)
            {
                _mockVoucherRepo.Setup(
                    mock =>
                    mock.Create(code, It.IsAny<Dictionary<string, object>>(), null, null)
                ).ReturnsAsync(new Voucher());
            }

            void SetupAddVoucherGiftBalance(decimal amount, string code)
            {
                _mockVoucherRepo.Setup(
                    mock =>
                    mock.AddVoucherGiftBalance(code, (int)amount * 100)
                ).ReturnsAsync(new Balance());
            }

            void SetupPublish(string code, string id)
            {
                _mockVoucherRepo.Setup(
                    mock =>
                    mock.Publish(code, id)
                ).ReturnsAsync(new PublicationSingle());
            }
        }

        [Fact]
        public async Task CreateVouchersAndUpdateBooking_AddsGoodWillRefundGiftCodes_ReturnsNewCodes()
        {
            // Arrange
            var settings = _fixture.Create<IOptions<ApiSettings>>().Value;
            var customerId = "testCustomer1";
            var goodwillAmt = 100m;
            var giftAmt = 200m;
            var refundAmt1 = 100m;
            var refundAmt2 = 200m;
            var refundAmt = refundAmt1 + refundAmt2;
            var breakDown = new BookingCancellationCreditRefundBreakdown
            {
                Goodwill = goodwillAmt,
                GoodwillCreditMadeOf = new([new MadeOf("goodwill transaction id", goodwillAmt)]),
                GiftCard = giftAmt,
                GiftCardCreditMadeOf = new([new MadeOf("gift card transaction id", giftAmt)]),
                Refund = refundAmt,
                RefundCreditMadeOf = new([new MadeOf("refund transaction id 1", refundAmt1), new MadeOf("refund transaction id 2", refundAmt2)]),
            };
            var voucherId = "testVoucher1234";
            var expectedVoucherId = $"{voucherId}-1";
            var expectedGoodWillCode = VouchersService.BuildCode(settings.Vouchers.Types.Goodwill, expectedVoucherId);
            var expectedGiftCode = VouchersService.BuildCode(settings.Vouchers.Types.GiftCard, expectedVoucherId);
            var expectedRefundCode1 = VouchersService.BuildCode(settings.Vouchers.Types.Refund, $"{voucherId}-1");
            var expectedRefundCode2 = VouchersService.BuildCode(settings.Vouchers.Types.Refund, $"{voucherId}-2");
            var booking = new BookingResponse
            {
                PaymentInfo = new PriceInfo
                {
                    PaymentHistory = new PaymentHistoryItem[0]
                },
            };

            SetupCreateOrGet(expectedGoodWillCode);
            SetupCreateOrGet(expectedGiftCode);
            SetupCreateOrGet(expectedRefundCode1);
            SetupCreateOrGet(expectedRefundCode2);

            SetupAddVoucherGiftBalance(goodwillAmt, expectedGoodWillCode);
            SetupAddVoucherGiftBalance(giftAmt, expectedGiftCode);
            SetupAddVoucherGiftBalance(refundAmt1, expectedRefundCode1);
            SetupAddVoucherGiftBalance(refundAmt2, expectedRefundCode2);

            SetupPublish(expectedGoodWillCode, customerId);
            SetupPublish(expectedGiftCode, customerId);
            SetupPublish(expectedRefundCode1, customerId);
            SetupPublish(expectedRefundCode2, customerId);

            _mockBookingRepo.Setup(
                mock =>
                mock.ModifyMemo(It.IsAny<string>(), It.IsAny<BookingMemo>())
            ).Returns(Task.CompletedTask);

            _mockBookingPaymentsRepo.Setup(
                mock =>
                mock.AddCreditPaymentInfo(
                    It.IsAny<string>(), It.IsAny<decimal>(),
                    It.IsAny<LeadPassenger>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                    It.IsAny<string>(),
                    null, null, null
                )
            ).ReturnsAsync(new BookingResponse());

            // Act
            var vouchers = await _sut.CreateVouchersAndUpdateBooking(customerId, breakDown, voucherId, booking, new Dictionary<string, object>());

            // Assert
            var voucherCodes = vouchers.Select(x => x.Code).ToList();

            _mockVoucherRepo.Verify(mock => mock.Create(expectedGoodWillCode, It.Is<Dictionary<string, object>>(dict => dict.ContainsKey(VoucherifyMetaKeys.PreviousCreditTypes) && dict[VoucherifyMetaKeys.PreviousCreditTypes].ToString() == $"{settings.Vouchers.Types.Goodwill}[goodwill transaction id]"), null, It.IsAny<DateTimeOffset?>()), Times.Once);
            _mockVoucherRepo.Verify(mock => mock.AddVoucherGiftBalance(expectedGoodWillCode, ((int)goodwillAmt * 100)), Times.Once);
            _mockVoucherRepo.Verify(mock => mock.Publish(expectedGoodWillCode, customerId), Times.Once);
            voucherCodes.Should().Contain(expectedGoodWillCode);

            _mockVoucherRepo.Verify(mock => mock.Create(expectedGiftCode, It.Is<Dictionary<string, object>>(dict => dict.ContainsKey(VoucherifyMetaKeys.PreviousCreditTypes) && dict[VoucherifyMetaKeys.PreviousCreditTypes].ToString() == $"{settings.Vouchers.Types.GiftCard}[gift card transaction id]"), null, It.IsAny<DateTimeOffset?>()), Times.Once);
            _mockVoucherRepo.Verify(mock => mock.AddVoucherGiftBalance(expectedGiftCode, ((int)giftAmt * 100)), Times.Once);
            _mockVoucherRepo.Verify(mock => mock.Publish(expectedGiftCode, customerId), Times.Once);
            voucherCodes.Should().Contain(expectedGiftCode);

            _mockVoucherRepo.Verify(mock => mock.Create(expectedRefundCode1, It.Is<Dictionary<string, object>>(dict => dict.ContainsKey(VoucherifyMetaKeys.PreviousCreditTypes) && dict[VoucherifyMetaKeys.PreviousCreditTypes].ToString() == $"{settings.Vouchers.Types.Refund}[refund transaction id 1]"), null, It.IsAny<DateTimeOffset?>()), Times.Once);
            _mockVoucherRepo.Verify(mock => mock.AddVoucherGiftBalance(expectedRefundCode1, ((int)refundAmt1 * 100)), Times.Once);
            _mockVoucherRepo.Verify(mock => mock.Publish(expectedRefundCode1, customerId), Times.Once);
            voucherCodes.Should().Contain(expectedRefundCode1);

            _mockVoucherRepo.Verify(mock => mock.Create(expectedRefundCode2, It.Is<Dictionary<string, object>>(dict => dict.ContainsKey(VoucherifyMetaKeys.PreviousCreditTypes) && dict[VoucherifyMetaKeys.PreviousCreditTypes].ToString() == $"{settings.Vouchers.Types.Refund}[refund transaction id 2]"), null, It.IsAny<DateTimeOffset?>()), Times.Once);
            _mockVoucherRepo.Verify(mock => mock.AddVoucherGiftBalance(expectedRefundCode2, ((int)refundAmt2 * 100)), Times.Once);
            _mockVoucherRepo.Verify(mock => mock.Publish(expectedRefundCode2, customerId), Times.Once);
            voucherCodes.Should().Contain(expectedRefundCode2);

            _mockBookingRepo.Verify(mock => mock.ModifyMemo(It.IsAny<string>(), It.IsAny<BookingMemo>()), Times.Once);
            _mockBookingPaymentsRepo.Verify(
                mock =>
                mock.AddCreditPaymentInfo(
                    It.IsAny<string>(), It.IsAny<decimal>(),
                    It.IsAny<LeadPassenger>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                    It.IsAny<string>(),
                    null, null, null
                ), Times.Exactly(4)
            );

            void SetupCreateOrGet(string code)
            {
                _mockVoucherRepo.Setup(
                    mock =>
                    mock.Create(code, It.IsAny<Dictionary<string, object>>(), null, null)
                ).ReturnsAsync(new Voucher());
            }

            void SetupAddVoucherGiftBalance(decimal amount, string code)
            {
                _mockVoucherRepo.Setup(
                    mock =>
                    mock.AddVoucherGiftBalance(code, (int)amount * 100)
                ).ReturnsAsync(new Balance());
            }

            void SetupPublish(string code, string id)
            {
                _mockVoucherRepo.Setup(
                    mock =>
                    mock.Publish(code, id)
                ).ReturnsAsync(new PublicationSingle());
            }
        }

        [Fact]
        public async Task CreateVouchersAndUpdateBooking_AddsGRefundFromCash_ReturnsNewCodes()
        {
            // Arrange
            var settings = _fixture.Create<IOptions<ApiSettings>>().Value;
            var customerId = "testCustomer1";
            var refundAmt = 300;
            var breakDown = new BookingCancellationCreditRefundBreakdown
            {
                Refund = refundAmt,
            };
            var voucherId = "testVoucher1234";
            var expectedRefundCode = VouchersService.BuildCode(settings.Vouchers.Types.Refund, $"{voucherId}");
            var booking = new BookingResponse
            {
                PaymentInfo = new PriceInfo
                {
                    PaymentHistory = new PaymentHistoryItem[0]
                },
            };

            SetupCreateOrGet(expectedRefundCode);

            SetupAddVoucherGiftBalance(refundAmt, expectedRefundCode);

            SetupPublish(expectedRefundCode, customerId);

            _mockBookingRepo.Setup(
                mock =>
                mock.ModifyMemo(It.IsAny<string>(), It.IsAny<BookingMemo>())
            ).Returns(Task.CompletedTask);

            _mockBookingPaymentsRepo.Setup(
                mock =>
                mock.AddCreditPaymentInfo(
                    It.IsAny<string>(), It.IsAny<decimal>(),
                    It.IsAny<LeadPassenger>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                    It.IsAny<string>(),
                    null, null, null
                )
            ).ReturnsAsync(new BookingResponse());

            // Act
            var vouchers = await _sut.CreateVouchersAndUpdateBooking(customerId, breakDown, voucherId, booking, new Dictionary<string, object>());

            // Assert
            var voucherCodes = vouchers.Select(x => x.Code).ToList();


            _mockVoucherRepo.Verify(mock => mock.Create(expectedRefundCode, It.Is<Dictionary<string, object>>(dict => dict.ContainsKey(VoucherifyMetaKeys.PreviousCreditTypes) && dict[VoucherifyMetaKeys.PreviousCreditTypes].ToString() == "cash"), null, It.IsAny<DateTimeOffset?>()), Times.Once);
            _mockVoucherRepo.Verify(mock => mock.AddVoucherGiftBalance(expectedRefundCode, (refundAmt * 100)), Times.Once);
            _mockVoucherRepo.Verify(mock => mock.Publish(expectedRefundCode, customerId), Times.Once);
            voucherCodes.Should().Contain(expectedRefundCode);

            _mockBookingRepo.Verify(mock => mock.ModifyMemo(It.IsAny<string>(), It.IsAny<BookingMemo>()), Times.Once);
            _mockBookingPaymentsRepo.Verify(
                mock =>
                mock.AddCreditPaymentInfo(
                    It.IsAny<string>(), It.IsAny<decimal>(),
                    It.IsAny<LeadPassenger>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                    It.IsAny<string>(),
                    null, null, null
                ), Times.Exactly(1)
            );

            void SetupCreateOrGet(string code)
            {
                _mockVoucherRepo.Setup(
                    mock =>
                    mock.Create(code, It.IsAny<Dictionary<string, object>>(), null, null)
                ).ReturnsAsync(new Voucher());
            }

            void SetupAddVoucherGiftBalance(decimal amount, string code)
            {
                _mockVoucherRepo.Setup(
                    mock =>
                    mock.AddVoucherGiftBalance(code, (int)amount * 100)
                ).ReturnsAsync(new Balance());
            }

            void SetupPublish(string code, string id)
            {
                _mockVoucherRepo.Setup(
                    mock =>
                    mock.Publish(code, id)
                ).ReturnsAsync(new PublicationSingle());
            }
        }

        [Fact]
        public async Task CreateVouchersAndUpdateBooking_AddsPromoCodes_ReturnsNewCodes()
        {
            // Arrange
            var customerId = "testCustomer1";
            var promoOneAmount = 50;
            var promoTwoAmount = 50;


            var breakDown = new BookingCancellationCreditRefundBreakdown
            {
                PromoBreakdownItems =
                [
                    new BookingCancellationPromoRefundBreakdownItem { Amount = promoOneAmount, MadeOf = [new MadeOfWithReason("promo transaction id 1", promoOneAmount, "Promo")], },

                    new BookingCancellationPromoRefundBreakdownItem { Amount = promoTwoAmount, MadeOf = [new MadeOfWithReason("tesco transaction id 2", promoTwoAmount, "Tesco")], }
                ]
            };
            var voucherId = "testVoucher1234";
            var booking = new BookingResponse
            {
                PaymentInfo = new PriceInfo
                {
                    PaymentHistory = new[]
                    {
                        new PaymentHistoryItem { IsPromoCredit = true, Amount = 50, PayMethodCode = "IR", PayId = "1" },
                        new PaymentHistoryItem { IsPromoCredit = true, Amount = 50, PayMethodCode = "GR", PayId = "2" },
                    },
                },
            };

            _mockBookingPaymentsRepo.Setup(
                mock =>
                mock.AddCreditPaymentInfo(
                    It.IsAny<string>(), It.IsAny<decimal>(),
                    It.IsAny<LeadPassenger>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                    It.IsAny<string>(),
                    null, null, null)
            ).ReturnsAsync(booking);

            var count = booking.PaymentInfo?.PaymentHistory?.Length ?? -1;

            // Act
            var codes = await _sut.CreateVouchersAndUpdateBooking(customerId, breakDown, voucherId, booking, new Dictionary<string, object>());

            // Assert
            count.Should().BeGreaterThan(-1);
            codes.Count.Should().Be(count);
            _mockBookingPaymentsRepo.Verify(
                mock =>
                mock.AddCreditPaymentInfo(
                    It.IsAny<string>(), It.IsAny<decimal>(),
                    It.IsAny<LeadPassenger>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                    It.IsAny<string>(),
                    null, null, null),
                Times.Exactly(count)
            );
            _mockVoucherRepo.Verify(mock => mock.Create(It.IsAny<string>(), It.Is<Dictionary<string, object>>(dict => dict.ContainsKey(VoucherifyMetaKeys.PreviousCreditTypes) && dict[VoucherifyMetaKeys.PreviousCreditTypes].ToString() == "Promo[promo transaction id 1]"), null, null), Times.Once);
            _mockVoucherRepo.Verify(mock => mock.Create(It.IsAny<string>(), It.Is<Dictionary<string, object>>(dict => dict.ContainsKey(VoucherifyMetaKeys.PreviousCreditTypes) && dict[VoucherifyMetaKeys.PreviousCreditTypes].ToString() == "Tesco[tesco transaction id 2]"), null, null), Times.Once);
        }

        [Fact]
        public async Task CreateVouchersAndUpdateBooking_PromoCodesWithPastExpiredDate_NewExpiredVoucherIsIssuedAndRecordedInPaymentHistory()
        {
            // Arrange
            var atcomSettings = _fixture.Create<IOptions<AtcomSettings>>().Value;
            var customerId = "testCustomer1";
            var promoAmt = 50m;
            var breakDown = new BookingCancellationCreditRefundBreakdown
            {
                PromoBreakdownItems =
                [
                    new BookingCancellationPromoRefundBreakdownItem
                    {
                        Amount = promoAmt,
                        ExpirationDate = atcomSettings.PaymentCodes["PromotionStaffCredit2324Expired"].ExpirationDate,
                        MadeOf = [new MadeOfWithReason("promo transaction id 1", promoAmt, "Promo")],
                    }
                ]
            };
            var voucherId = "testVoucher1234";
            var booking = new BookingResponse
            {
                PaymentInfo = new PriceInfo
                {
                    PaymentHistory = new[]
                    {
                        new PaymentHistoryItem { IsPromoCredit = true, Amount = 50, PayMethodCode = "PSTJE", PayId = "1" },
                    },
                },
            };

            _mockBookingPaymentsRepo.Setup(
                mock =>
                mock.AddCreditPaymentInfo(
                    It.IsAny<string>(), It.IsAny<decimal>(),
                    It.IsAny<LeadPassenger>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                    It.IsAny<string>(),
                    null, null, null)
            ).ReturnsAsync(booking);

            // Act
            var codes = await _sut.CreateVouchersAndUpdateBooking(customerId, breakDown, voucherId, booking, new Dictionary<string, object>());

            // Assert
            codes.Count.Should().Be(1);

            _mockVoucherRepo.Verify(
                 mock =>
                 mock.Create(
                 It.IsAny<string>(),
                 It.IsAny<Dictionary<string, object>>(),
                 It.IsAny<decimal?>(),
                 atcomSettings.PaymentCodes["PromotionStaffCredit2324Expired"].ExpirationDate),
                 Times.Once);

            _mockBookingPaymentsRepo.Verify(
                mock =>
                mock.AddCreditPaymentInfo(
                    It.IsAny<string>(), It.IsAny<decimal>(),
                    It.IsAny<LeadPassenger>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                    It.IsAny<string>(),
                    null, null, null),
                Times.Once
            );
        }

        [Fact]
        public async Task CreateVouchersAndUpdateBooking_PromoCodesWithFutureExpiredDate_ReturnsNewCodes()
        {
            // Arrange
            var atcomSettings = _fixture.Create<IOptions<AtcomSettings>>().Value;
            var customerId = "testCustomer1";
            var promoAmt = 50m;
            var breakDown = new BookingCancellationCreditRefundBreakdown
            {
                PromoBreakdownItems =
                [
                    new BookingCancellationPromoRefundBreakdownItem
                    {
                        Amount = promoAmt,
                        ExpirationDate = atcomSettings.PaymentCodes["PromotionStaffCredit2324"].ExpirationDate,
                        MadeOf = [new MadeOfWithReason("promo transaction id 1", promoAmt, "Promo")]
                    }
                ]
            };
            var voucherId = "testVoucher1234";
            var booking = new BookingResponse
            {
                PaymentInfo = new PriceInfo
                {
                    PaymentHistory = new[]
                    {
                        new PaymentHistoryItem { IsPromoCredit = true, Amount = 50, PayMethodCode = "PSTJ", PayId = "1" },
                    },
                },
            };

            _mockBookingPaymentsRepo.Setup(
                mock =>
                mock.AddCreditPaymentInfo(
                    It.IsAny<string>(), It.IsAny<decimal>(),
                    It.IsAny<LeadPassenger>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                    It.IsAny<string>(),
                    null, null, null)
            ).ReturnsAsync(booking);

            // Act
            var codes = await _sut.CreateVouchersAndUpdateBooking(customerId, breakDown, voucherId, booking, new Dictionary<string, object>());

            // Assert
            codes.Count.Should().Be(1);

            _mockVoucherRepo.Verify(
                mock =>
                mock.Create(
                It.IsAny<string>(),
                It.IsAny<Dictionary<string, object>>(),
                It.IsAny<decimal?>(),
                atcomSettings.PaymentCodes["PromotionStaffCredit2324"].ExpirationDate),
                Times.Once);

            _mockBookingPaymentsRepo.Verify(
                mock =>
                mock.AddCreditPaymentInfo(
                    It.IsAny<string>(), It.IsAny<decimal>(),
                    It.IsAny<LeadPassenger>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                    It.IsAny<string>(),
                    null, null, null),
                Times.Exactly(1)
            );
        }

        [Fact]
        public async Task CreateVouchersAndUpdateBooking_Ser684_ReturnsNewCodes()
        {
            // Arrange
            var atcomSettings = _fixture.Create<IOptions<AtcomSettings>>().Value;
            var customerId = "testCustomer1";
            var breakDown = new BookingCancellationCreditRefundBreakdown()
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
                        ExpirationDate = new DateTimeOffset(),
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
            };

            var voucherId = "testVoucher1234";
            var booking = new BookingResponse()
            {
                PaymentInfo = new PriceInfo()
                {
                    PaymentHistory = new PaymentHistoryItem[]
                    {
                        new PaymentHistoryItem(){ IsPromoCredit = true, IsCredit = true,Amount = 100, PayMethodCode = "Tesco1", PayId = "1" },
                        new PaymentHistoryItem(){ IsPromoCredit = true, IsCredit = true, Amount = 180, PayMethodCode = "Tesco2", PayId = "2" },
                        new PaymentHistoryItem(){ IsPromoCredit = false, IsGoodWill = true, IsCredit = true, Amount = 180, PayMethodCode = "Goodwill", PayId = "3" },
                        new PaymentHistoryItem(){ IsPromoCredit = false, IsGoodWill = true, IsCredit = true, Amount = 180, PayMethodCode = "Goodwill2", PayId = "4" },
                        new PaymentHistoryItem(){ IsPromoCredit = false, IsGoodWill = false, IsGiftCardCredit = false, IsOneTimeUseCredit = false, IsCredit = true, Amount = 1761.76m, PayMethodCode = "Refund1", PayId = "5" },
                        new PaymentHistoryItem(){ IsPromoCredit = false, IsGoodWill = false, IsGiftCardCredit = false, IsOneTimeUseCredit = false, IsCredit = true, Amount = 1937.24m, PayMethodCode = "Refund2", PayId = "6" },
                    },
                },
            };

            _mockBookingPaymentsRepo.Setup(
                mock =>
                mock.AddCreditPaymentInfo(
                    It.IsAny<string>(), It.IsAny<decimal>(),
                    It.IsAny<LeadPassenger>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                    It.IsAny<string>(),
                    null, null, null)
            ).ReturnsAsync(booking);

            // Act
            var codes = await _sut.CreateVouchersAndUpdateBooking(customerId, breakDown, voucherId, booking, new Dictionary<string, object>());

            // Assert
            codes[0].Code.Should().Be("testVoucher1234-goodwill-1-onetimeuse");
            codes[0].Amount.Should().Be(180);

            codes[1].Code.Should().Be("testVoucher1234-goodwill-2-onetimeuse");
            codes[1].Amount.Should().Be(180);

            codes[2].Code.Should().Be("testVoucher1234-1-refund");
            codes[2].Amount.Should().Be(1761.76M);

            codes[3].Code.Should().Be("testVoucher1234-2-refund");
            codes[3].Amount.Should().Be(1937.24M);

            codes[4].Code.Should().Be("testVoucher1234-6-promo-0");
            codes[4].Amount.Should().Be(100);

            codes[5].Code.Should().Be("testVoucher1234-6-promo-1");
            codes[5].Amount.Should().Be(180);
        }
        #endregion CreateVouchersAndUpdateBooking
        #region CreateAndPublishVoucher

        [Theory]
        [InlineData("refund")]
        [InlineData("somePromotion")]
        public async Task CreateAndPublishVoucher_WithExpirationParameter_DoesNotAttemptToDetermine(string validReason)
        {
            // Arrange
            var voucherId = _fixture.Create<string>();
            var amount = Math.Abs(_fixture.Create<decimal>());
            const string currency = "GBP";
            var customerId = _fixture.Create<string>();
            var metaData = new Dictionary<string, object>
            {
                {"someKey", "someValue"}
            };

            var expiration = DateTimeOffset.UtcNow.AddYears(3);

            var expectedVoucher = _fixture.Create<Voucher>();

            _mockVoucherRepo
                .Setup(mock => mock.Create(voucherId, It.IsAny<Dictionary<string, object>>(), null, expiration))
                .ReturnsAsync(expectedVoucher);

            // Act
            var result = await _sut.CreateAndPublishVoucher(voucherId, amount, currency, customerId, metaData,
                validReason, expiration);

            // Assert
            result.Should().Be(voucherId);

            _mockVoucherRepo.Verify(mock => mock.Create(
                voucherId,
                It.Is<Dictionary<string, object>>(arg => arg.ContainsKey(VoucherifyMetaKeys.Reason) && (string)arg[VoucherifyMetaKeys.Reason] == validReason),
                null,
                expiration
            ));

            _mockVoucherRepo.Verify(mock => mock.AddVoucherGiftBalance(voucherId, It.IsAny<int>()));

            _mockVoucherRepo.Verify(mock => mock.Publish(voucherId, customerId));

            _mockVoucherRepo.Verify(mock => mock.Delete(It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task CreateAndPublishVoucher_WithoutExpirationParameter_HandlesNonPromoCorrectly()
        {
            // Arrange
            var now = DateTimeOffset.UtcNow;
            const string reason = "refund";
            var voucherId = _fixture.Create<string>();
            var amount = Math.Abs(_fixture.Create<decimal>());
            const string currency = "GBP";
            var customerId = _fixture.Create<string>();
            var metaData = new Dictionary<string, object>
            {
                {"someKey", "someValue"}
            };

            var expectedVoucher = _fixture.Create<Voucher>();

            _mockVoucherRepo
                .Setup(mock => mock.Create(voucherId, It.IsAny<Dictionary<string, object>>(), null, It.IsAny<DateTimeOffset?>()))
                .ReturnsAsync(expectedVoucher);

            // Act
            var result = await _sut.CreateAndPublishVoucher(voucherId, amount, currency, customerId, metaData,
                reason);

            // Assert
            result.Should().Be(voucherId);

            _mockVoucherRepo.Verify(mock => mock.Create(
                voucherId,
                It.Is<Dictionary<string, object>>(arg => arg.ContainsKey(VoucherifyMetaKeys.Reason) && (string)arg[VoucherifyMetaKeys.Reason] == reason),
                null,
                It.Is<DateTimeOffset>(dt => dt > now.AddMonths(3))
            ));

            _mockVoucherRepo.Verify(mock => mock.AddVoucherGiftBalance(voucherId, It.IsAny<int>()));

            _mockVoucherRepo.Verify(mock => mock.Publish(voucherId, customerId));

            _mockVoucherRepo.Verify(mock => mock.Delete(It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task CreateAndPublishVoucher_WithoutExpirationParameter_HandlesPromoWithExpiryCorrectly()
        {
            // Arrange
            const string reason = "Promotion - Marketing"; // from settings in ctor
            var voucherId = _fixture.Create<string>();
            var amount = Math.Abs(_fixture.Create<decimal>());
            const string currency = "GBP";
            var customerId = _fixture.Create<string>();
            var metaData = new Dictionary<string, object>
            {
                {"someKey", "someValue"}
            };

            var expectedVoucher = _fixture.Create<Voucher>();

            _mockVoucherRepo
                .Setup(mock => mock.Create(voucherId, It.IsAny<Dictionary<string, object>>(), null, It.IsAny<DateTimeOffset?>()))
                .ReturnsAsync(expectedVoucher);

            var settings = _fixture.Create<IOptions<AtcomSettings>>().Value;
            var expiry = settings.PaymentCodes["PromotionMarketing"].ExpirationDate;

            // Act
            var result = await _sut.CreateAndPublishVoucher(voucherId, amount, currency, customerId, metaData,
                reason);

            // Assert
            result.Should().Be(voucherId);

            _mockVoucherRepo.Verify(mock => mock.Create(
                voucherId,
                It.Is<Dictionary<string, object>>(arg => arg.ContainsKey(VoucherifyMetaKeys.Reason) && (string)arg[VoucherifyMetaKeys.Reason] == reason),
                null,
                It.Is<DateTimeOffset>(dt => dt == expiry)
            ));

            _mockVoucherRepo.Verify(mock => mock.AddVoucherGiftBalance(voucherId, It.IsAny<int>()));

            _mockVoucherRepo.Verify(mock => mock.Publish(voucherId, customerId));

            _mockVoucherRepo.Verify(mock => mock.Delete(It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task CreateAndPublishVoucher_WithoutExpirationParameter_HandlesPromoWithoutExpiryCorrectly()
        {
            // Arrange
            var now = DateTimeOffset.UtcNow;
            const string reason = "somePromotion";
            var voucherId = _fixture.Create<string>();
            var amount = Math.Abs(_fixture.Create<decimal>());
            const string currency = "GBP";
            var customerId = _fixture.Create<string>();
            var metaData = new Dictionary<string, object>
            {
                {"someKey", "someValue"}
            };

            var expectedVoucher = _fixture.Create<Voucher>();

            _mockVoucherRepo
                .Setup(mock => mock.Create(voucherId, It.IsAny<Dictionary<string, object>>(), null, It.IsAny<DateTimeOffset?>()))
                .ReturnsAsync(expectedVoucher);

            // Act
            var result = await _sut.CreateAndPublishVoucher(voucherId, amount, currency, customerId, metaData,
                reason);

            // Assert
            result.Should().Be(voucherId);

            _mockVoucherRepo.Verify(mock => mock.Create(
                voucherId,
                It.Is<Dictionary<string, object>>(arg => arg.ContainsKey(VoucherifyMetaKeys.Reason) && (string)arg[VoucherifyMetaKeys.Reason] == reason),
                null,
                It.Is<DateTimeOffset>(dt => dt > now.AddMonths(3)))
            );

            _mockVoucherRepo.Verify(mock => mock.AddVoucherGiftBalance(voucherId, It.IsAny<int>()));

            _mockVoucherRepo.Verify(mock => mock.Publish(voucherId, customerId));

            _mockVoucherRepo.Verify(mock => mock.Delete(It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task CreateAndPublishVoucher_WithoutExpirationParameter_HandlesUnknownCorrectly()
        {
            // Arrange
            var reason = _fixture.Create<string>();
            var voucherId = _fixture.Create<string>();
            var amount = Math.Abs(_fixture.Create<decimal>());
            const string currency = "GBP";
            var customerId = _fixture.Create<string>();
            var metaData = new Dictionary<string, object>
            {
                {"someKey", "someValue"}
            };

            var expectedVoucher = _fixture.Create<Voucher>();

            _mockVoucherRepo
                .Setup(mock => mock.Create(voucherId, It.IsAny<Dictionary<string, object>>(), null, It.IsAny<DateTimeOffset?>()))
                .ReturnsAsync(expectedVoucher);

            // Act
            var result = await _sut.CreateAndPublishVoucher(voucherId, amount, currency, customerId, metaData, reason);

            // Assert
            result.Should().Be(voucherId);

            _mockVoucherRepo.Verify(mock => mock.Create(
                voucherId,
                It.Is<Dictionary<string, object>>(arg => arg.ContainsKey(VoucherifyMetaKeys.Reason) && (string)arg[VoucherifyMetaKeys.Reason] == reason),
                null,
                null
            ));

            _mockVoucherRepo.Verify(mock => mock.AddVoucherGiftBalance(voucherId, It.IsAny<int>()));

            _mockVoucherRepo.Verify(mock => mock.Publish(voucherId, customerId));

            _mockVoucherRepo.Verify(mock => mock.Delete(It.IsAny<string>()), Times.Never);
        }

        public static TheoryData<Exception> TestExceptions = [
            new ApiException(ApiExceptionCodes.VoucherAddBalance),
            new InvalidOperationException()
        ];

        [Theory]
        [MemberData(nameof(TestExceptions))]
        public async Task CreateAndPublishVoucher_HandlesAndRethrows(Exception exc)
        {
            // Arrange
            var reason = _fixture.Create<string>();
            var voucherId = _fixture.Create<string>();
            var amount = Math.Abs(_fixture.Create<decimal>());
            const string currency = "GBP";
            var customerId = _fixture.Create<string>();
            var metaData = new Dictionary<string, object>
            {
                {"someKey", "someValue"}
            };

            _mockVoucherRepo
                .Setup(mock => mock.Create(voucherId, It.IsAny<Dictionary<string, object>>(), null, It.IsAny<DateTimeOffset?>()))
                .ReturnsAsync(_fixture.Create<Voucher>());

            _mockVoucherRepo.Setup(mock => mock.AddVoucherGiftBalance(It.IsAny<string>(), It.IsAny<int>())).Throws(exc);

            // Act
            var action = async () => await _sut.CreateAndPublishVoucher(voucherId, amount, currency, customerId, metaData, reason);

            // Assert
            (await action.Should().ThrowAsync<Exception>()).Which.Should().Be(exc);
            _mockVoucherRepo.Verify(mock => mock.Delete(It.IsAny<string>()));

        }

        #endregion
        #region UpdateCustomerSourceID
        [Fact]
        public async Task UpdateCustomerSourceId_DetailsNull_ReturnsFalse()
        {
            //Arrange 
            AuthCustomerDetails details = null; // to be excplicit

            // Act
            var updateResult = await _sut.UpdateCustomerSourceId(details);

            // Assert
            updateResult.Should().BeFalse("because the provided details are null.");
        }

        [Fact]
        public async Task UpdateCustomerSourceId_NoCustomerFound_ReturnsFalse()
        {
            //Arrange 
            var details = new AuthCustomerDetails { Email = "test@test.test" };
            var retList = JsonConvert.DeserializeObject<CustomerList>(@"{
                ""customers"": []" +
            "}");
            _mockVoucherCustomerRepo.Setup(
                mock =>
                mock.GetCustomersByEmail(It.IsAny<string>(), It.IsAny<int>())
            ).ReturnsAsync(retList);

            // Act
            var updateResult = await _sut.UpdateCustomerSourceId(details);

            // Assert
            updateResult.Should().BeFalse($"because there are no customers returned from the {nameof(IVouchersCustomerRepository)} implementation.");
        }

        [Fact]
        public async Task UpdateCustomerSourceId_CustomerAlreadyHasSourceID_ReturnsFalse()
        {
            //Arrange 
            var details = new AuthCustomerDetails { Email = "test@test.test", };
            var retList = JsonConvert.DeserializeObject<CustomerList>(@"{
                ""customers"": [{""source_id"": ""testId123""}]" +
            "}");
            _mockVoucherCustomerRepo.Setup(
                mock =>
                mock.GetCustomersByEmail(It.IsAny<string>(), It.IsAny<int>())
            ).ReturnsAsync(retList);

            // Act
            var updateResult = await _sut.UpdateCustomerSourceId(details);

            // Assert
            updateResult.Should().BeFalse($"because there are no customers returned from the {nameof(IVouchersCustomerRepository)} implementation.");
        }

        [Fact]
        public async Task UpdateCustomerSourceId_SourceIDGetsSet_ReturnsTrue()
        {
            //Arrange 
            var details = new AuthCustomerDetails { Email = "test@test.test", Id = "testId123" };
            var retList = JsonConvert.DeserializeObject<CustomerList>(@"{
                ""customers"": [{}]" +
            "}");
            _mockVoucherCustomerRepo.Setup(
                mock =>
                mock.GetCustomersByEmail(It.IsAny<string>(), It.IsAny<int>())
            ).ReturnsAsync(retList);

            // Act
            var updateResult = await _sut.UpdateCustomerSourceId(details);

            // Assert
            updateResult.Should().BeTrue();
        }

        [Fact]
        public async Task UpdateCustomerSourceId_ThrowsException_ReturnsFalse()
        {
            //Arrange 
            var details = new AuthCustomerDetails { Email = "test@test.test", Id = "testId123" };
            _mockVoucherCustomerRepo.Setup(
                mock =>
                mock.GetCustomersByEmail(It.IsAny<string>(), It.IsAny<int>())
            ).ThrowsAsync(new Exception());

            // Act
            var updateResult = await _sut.UpdateCustomerSourceId(details);

            // Assert
            updateResult.Should().BeFalse($"because the {nameof(IVouchersCustomerRepository.GetCustomersByEmail)} implementation throws an exception.");
        }
        #endregion
        #region Transfer Credit
        [Fact]
        public async Task TransferCreditSuccess_MatchingVouchersByCurrency_Return_Message()
        {
            //Arrange 
            string emailFrom = "from@email.com";
            var emailTo = "to@email.com";
            var currency = "CHF";
            var successResult = new TransferResult { Successfull = new List<string> { "V-1,CHF" } };
            var amount = 10000;
            var vouchers = new List<VoucherWithCustomer>
            {
                CreateTransferCreditVoucher("V-1", Currency.CHF.Code, emailFrom),
                CreateTransferCreditVoucher("V-2", Currency.GBP.Code, emailFrom)
            };

            _mockVoucherCustomerRepo.Setup(x => x.GetCustomerVouchers(It.IsAny<string>()).Result).Returns(vouchers);

            // Act
            var updateResult = await _sut.TransferVouchers(emailFrom, emailTo, currency, vouchersToMove =>
            {
                var options = MathUtils.SubsetSum(vouchersToMove.ToList(), v => v.Gift.Balance, amount).ToList();
                options.Sort((a, b) => a.Count() - b.Count());
                return options.FirstOrDefault() ?? new List<VoucherWithCustomer>();
            });

            // Assert
            updateResult.Successfull.Should().BeEquivalentTo(successResult.Successfull);
        }

        #endregion
        #region Helpers
        private static ValidationWithMeta BuildValidationMock(string reason)
        {
            var validationAsString = @"{
                ""valid"": false,
                ""reason"":" + $"\"{reason}\"" +
            "}";
            var mockValidation = JsonConvert.DeserializeObject<ValidationWithMeta>(validationAsString);
            return mockValidation;
        }

        protected static Voucher CreateCorrectGiftVoucher(string voucherCode, bool active = true, string customerId = null, int balance = 10000, string currency = "GBP")
        {
            var voucher = new Voucher();
            voucher.SetPrivateField("<Code>k__BackingField", voucherCode);
            voucher.SetPrivateField("<Type>k__BackingField", VoucherType.GiftVoucher);
            voucher.SetPrivateField("<Campaign>k__BackingField", "Test");
            voucher.SetPrivateField("<Active>k__BackingField", active);
            voucher.SetPrivateField("<ExpirationDate>k__BackingField", DateTime.UtcNow.AddDays(+1));
            voucher.SetPrivateField("<Metadata>k__BackingField", new Metadata
            {
                {_customCampaignVouchersMetaData, "Test"},
                { VoucherifyMetaKeys.Expiration, "365"},
                { VoucherifyMetaKeys.RedeemedBy, customerId},
                { VoucherifyMetaKeys.Currency, currency }
            });

            var gift = new Gift();
            gift.SetPrivateProperty("Balance", balance);
            voucher.SetPrivateField("<Gift>k__BackingField", gift);

            return voucher;
        }

        protected static Voucher CreateCorrectDiscountVoucher(string voucherCode, bool active = true, string customerId = null, int amountOff = 10000)
        {
            var voucher = new Voucher();
            voucher.SetPrivateField("<Code>k__BackingField", voucherCode);
            voucher.SetPrivateField("<Type>k__BackingField", VoucherType.DiscountVoucher);
            voucher.SetPrivateField("<Campaign>k__BackingField", "Test");
            voucher.SetPrivateField("<Active>k__BackingField", active);
            voucher.SetPrivateField("<ExpirationDate>k__BackingField", DateTime.UtcNow.AddDays(+1));
            voucher.SetPrivateField("<Metadata>k__BackingField", new Metadata
            {
                {_singleUsePromoVouchersMetaData, "Test"},
                { "expiration", "365"},
            });

            var discount = new Discount().WithAmountOff(amountOff);
            voucher.SetPrivateField("<Discount>k__BackingField", discount);

            return voucher;
        }
        protected static VoucherWithCustomer CreateTransferCreditVoucher(string voucherCode, string currency, string customerId, int balance = 10000)
        {
            var gift = new Gift();
            gift.SetPrivateProperty("Balance", balance);
            gift.SetPrivateProperty("Amount", balance);

            var voucher = new VoucherWithCustomer();
            var redemption = new VoucherRedemptionList();

            voucher.SetPrivateField("<Active>k__BackingField", true);
            voucher.SetPrivateField("<Gift>k__BackingField", gift);
            voucher.SetPrivateField("<Code>k__BackingField", voucherCode);
            voucher.SetPrivateField("<Redemption>k__BackingField", redemption);
            voucher.SetPrivateField("<ExpirationDate>k__BackingField", DateTime.Now.AddMonths(1));
            voucher.SetPrivateField("<Metadata>k__BackingField", new Metadata(new Dictionary<string, object>
            {
                 { VoucherifyMetaKeys.Currency, currency },
                 { _customCampaignVouchersMetaData, "Test" },
                 { VoucherifyMetaKeys.Expiration, "365" },
                 { VoucherifyMetaKeys.RedeemedBy, customerId}
                }));
            voucher.SetPrivateField("<Campaign>k__BackingField", "test campaign");
            voucher.SetPrivateField("<Category>k__BackingField", "test category");
            voucher.SetPrivateProperty("HolderId", customerId);

            return voucher;
        }

        protected static Metadata CreateMetadata(string currency = null, string reason = null, string marketCode = null, string bookingRef = null)
        {
            var meta = new Dictionary<string, object>();
            if (currency != null) meta.Add(VoucherifyMetaKeys.Currency, currency);
            if (reason != null) meta.Add(VoucherifyMetaKeys.Reason, reason);
            if (marketCode != null) meta.Add(VoucherifyMetaKeys.Market, marketCode);
            if (bookingRef != null) meta.Add(VoucherifyMetaKeys.BookingRef, bookingRef);
            return new Metadata(meta);
        }

        #endregion Helpers

        [Fact]
        public async Task GetUserCreditBalance_WhenCurrencyIsNull_ReturnsZeroAndLogsWarning()
        {
            // Arrange
            var currency = (Currency)null;
            var customerId = "customerId";

            // Act
            var result = await InvokeGetUserCreditBalance(currency, customerId);

            // Assert
            result.Should().Be(0);
        }

        [Fact]
        public async Task GetUserCreditBalance_WhenCreditsExist_ReturnsCorrectBalance()
        {
            // Arrange
            var currency = new Currency { Code = "GBP" };
            var customerId = "customerId";

            // Act
            var result = await InvokeGetUserCreditBalance(currency, customerId, customersRepository =>
            {
                customersRepository
                    .Setup(x => x.GetCustomerVouchers(customerId))
                    .ReturnsAsync([
                        CreateGiftVoucherWithCustomer(50),
                        CreateGiftVoucherWithCustomer(30)
                    ]);
            });

            // Assert
            result.Should().Be(80); // 50 + 30
        }

        [Fact]
        public void GetRefundAmountFromCreditRefundMemo_RegexMatch_Return120Pounds()
        {
            // Arrange
            var bookingResponse = new BookingResponse
            {
                Memo =
                [
                    new Memo { Code = "testBookingMemoCode", Text = "Voucher created with ids: 2295368499-goodwill, 12312321-goodwill, 12321321321321-refund, 120.00 GBP", }
                ]
            };

            // Act
            var result = _sut.GetRefundAmountFromCreditRefundMemo(bookingResponse);

            // Assert
            result.Should().Be(120);
        }

        [Fact]
        public void GetRefundAmountFromCreditRefundMemo_RegexDoesNotMatch_ReturnNull()
        {
            // Arrange
            var bookingResponse = new BookingResponse
            {
                Memo =
                [
                    new Memo { Code = "testBookingMemoCode", Text = "Voucher created with ids: 2295368499-goodwill, 12312321-goodwill, 12321321321321-refund; GBP", }
                ]
            };

            // Act
            var result = _sut.GetRefundAmountFromCreditRefundMemo(bookingResponse);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task MyCredits_DoesNotMakeRedundantCalls()
        {
            // Arrange
            const string customerId = "abcde12345";

            _mockAuthService
                .Setup(auth => auth.GetCustomerIdWithErrorsHandling(It.IsAny<AuthCustomerDetails>()))
                .ReturnsAsync(customerId);

            _mockAwsUserCreditsService.Setup(mock => mock.GetOrUpdateUserCredits(
                    It.Is<string>(s => string.Equals(s, customerId, StringComparison.Ordinal)),
                    It.IsAny<Func<Task<Dictionary<Currency, MyCreditInfo>>>>(),
                    It.IsAny<bool>()))
                .Returns((string _, Func<Task<Dictionary<Currency, MyCreditInfo>>> func, bool _) => func());

            _mockVoucherCustomerRepo
                .Setup(repo => repo.GetCustomerVouchers(customerId))
                .ReturnsAsync(new List<VoucherWithCustomer>());

            // Act
            var result = await _sut.MyCredits();

            // Assert
            result.Should().NotBeNull();
            _mockAuthService.Verify(auth => auth.GetCustomerIdWithErrorsHandling(It.IsAny<AuthCustomerDetails>()), Times.Once);
            _mockVoucherCustomerRepo.Verify(repo => repo.GetCustomerVouchers(customerId), Times.Once);
            _mockVoucherCustomerRepo.Verify(repo => repo.GetCustomerHistory(customerId), Times.Once);
        }

        private async Task<decimal?> InvokeGetUserCreditBalance(Currency currency, string customerId, Action<Mock<IVouchersCustomerRepository>> vouchersCustomerRepositoryAction = null)
        {
            var vouchersService = MockHappyPath(out Mock<IAuthenticationService> _,
                out Mock<IBookingRepository> _,
                out Mock<IBookingPaymentsRepository> _,
                out var customersRepository,
                out Mock<IVouchersRepository> _,
                out BookingResponse _,
                out Mock<ICacheService> _);

            vouchersCustomerRepositoryAction?.Invoke(customersRepository);

            var methodInfo = typeof(VouchersService).GetMethod("GetUserCreditBalance", BindingFlags.NonPublic | BindingFlags.Instance);

            if (methodInfo?.Invoke(vouchersService, parameters: [currency, customerId]) is not Task<decimal?> value)
                return null;

            return await value;
        }

        private static VoucherWithCustomer CreateGiftVoucherWithCustomer(int amount, string currency = "GBP")
        {
            var gift = new Gift();
            gift.SetProperty(x => x.Amount, amount * 100);
            gift.SetProperty(x => x.Balance, amount * 100);
            var voucherWithCustomer = new VoucherWithCustomer();
            voucherWithCustomer.SetProperty(x => x.Active, true);
            voucherWithCustomer.SetProperty(x => x.Metadata, CreateMetadata(currency: currency));
            voucherWithCustomer.SetProperty(x => x.Code, "test_v");
            voucherWithCustomer.SetProperty(x => x.Gift, gift);

            return voucherWithCustomer;
        }
    }
}