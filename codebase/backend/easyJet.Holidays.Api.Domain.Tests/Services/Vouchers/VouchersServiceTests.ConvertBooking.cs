using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Constants;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using System.Collections.Generic;
using Xunit;
using CustomerDetails = easyJet.Holidays.Api.Domain.Data.Authentication.CustomerDetails;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Vouchers
{
    public partial class VouchersServiceTests
    {
        [Fact]
        public async Task ConvertBooking_NoMappedCustomerId_ThrowsError()
        {
            // Arrange
            var sut = MockHappyPath(out var authService, out var bookingRepository, out var bookingPaymentsRepository, out var customersRepository, out var vouchersRepository, out var booking, out var cacheService);
            authService.Setup(x => x.MappedCustomerId(It.IsAny<CustomerDetails>())).ReturnsAsync("");

            // Act
            Func<Task> act = () => sut.ConvertBooking(booking, null, new CreditBreakdown());

            // Assert
            await act.Should().ThrowExactlyAsync<ApiException>().Where(ex => ex.Code.Code == ApiExceptionCodes.CustomerNoMappedId.Code);
        }

        [Fact]
        public async Task ConvertBooking_NoCreditBreakdown_ThrowsError()
        {
            // Arrange
            var sut = MockHappyPath(out var authService, out var bookingRepository, out var bookingPaymentsRepository, out var customersRepository, out var vouchersRepository, out var booking, out var cacheService);

            // Act
            Func<Task> act = () => sut.ConvertBooking(booking, null, creditBreakdown: null);

            // Assert
            await act.Should().ThrowExactlyAsync<ArgumentNullException>();
        }

        [Fact]
        public async Task ConvertBooking_PublishFail_DeleteVoucher()
        {
            // Arrange
            var sut = MockHappyPath(out var authService, out var bookingRepository, out var bookingPaymentsRepository, out var customersRepository, out var vouchersRepository, out var booking, out var cacheService);
            vouchersRepository.Setup(x => x.Publish(It.IsAny<string>(), It.IsAny<string>())).Throws(new Exception("mock"));

            // Act
            Func<Task> act = () => sut.ConvertBooking(booking, null, new CreditBreakdown()
            {
                Goodwill = 15
            });

            // Assert
            await act.Should().ThrowExactlyAsync<Exception>().Where(ex => ex.Message == "mock");
            vouchersRepository.Verify(x => x.Delete("first_payment"));
        }

        [Fact]
        public async Task ConvertBooking_CancelBookingFail_DeleteVoucher()
        {
            // Arrange
            var sut = MockHappyPath(out var authService, out var bookingRepository, out var bookingPaymentsRepository, out var customersRepository, out var vouchersRepository, out var booking, out var cacheService);
            bookingRepository.Setup(x => x.CancelBooking(It.IsAny<string>(), It.IsAny<string>(), true, It.IsAny<IList<string>>())).Throws(new Exception("mock"));

            // Act
            Func<Task> act = () => sut.ConvertBooking(booking, null, new CreditBreakdown { Refund = 1 });

            // Assert
            await act.Should().ThrowExactlyAsync<Exception>().Where(ex => ex.Message == "mock");
            vouchersRepository.Verify(x => x.Delete("second_payment-refund"));
        }

        [Fact]
        public async Task ConvertBooking_AddMarketToMetadata()
        {
            // Arrange
            var sut = MockHappyPath(out var authService, out var bookingRepository, out var bookingPaymentsRepository, out var customersRepository, out var vouchersRepository, out var booking, out var cacheService);

            // Act
            await sut.ConvertBooking(booking, null, new CreditBreakdown { Goodwill = 100 });

            //Assert
            object market;
            vouchersRepository.Verify(x => x.Create(
                It.IsAny<string>(),
                It.Is<Dictionary<string, object>>(meta => meta.TryGetValue(VoucherifyMetaKeys.Market, out market) && (string)market == "UK"),
                It.IsAny<decimal?>(),
                It.IsAny<DateTimeOffset?>()
                ), "Voucher metadata contains invalid market");
        }

        [Fact]
        public async Task ConvertBooking_TwoVouchers_OneExisting_CancelBookingFail_DeleteOneVoucher()
        {
            // Arrange
            var sut = MockHappyPath(out var authService, out var bookingRepository, out var bookingPaymentsRepository, out var customersRepository, out var vouchersRepository, out var booking, out var cacheService);
            booking.PaymentInfo.DepositPrice = 10;
            bookingRepository.Setup(x => x.CancelBooking(It.IsAny<string>(), It.IsAny<string>(), true, It.IsAny<IList<string>>())).Throws(new Exception("mock"));
            vouchersRepository.Setup(x => x.Create("first_payment-goowill", It.IsAny<Dictionary<string, object>>(), It.IsAny<decimal?>(), null)).ReturnsAsync(new Voucher()); // voucher exists, shouldn't be deleted

            // Act
            Func<Task> act = () => sut.ConvertBooking(booking, null, new CreditBreakdown
            {
                Goodwill = 10,
                Refund = 5
            });

            // Assert
            await act.Should().ThrowExactlyAsync<Exception>().Where(ex => ex.Message == "mock");
            vouchersRepository.Verify(x => x.Delete("first_payment-goowill"), Times.Never);
            vouchersRepository.Verify(x => x.Delete("second_payment-refund"), Times.Once);
        }

        private VouchersService MockHappyPath(
            out Mock<IAuthenticationService> authService,
            out Mock<IBookingRepository> bookingRepository,
            out Mock<IBookingPaymentsRepository> bookingPaymentsRepository,
            out Mock<IVouchersCustomerRepository> customersRepository,
            out Mock<IVouchersRepository> vouchersRepository,
            out BookingResponse booking,
            out Mock<ICacheService> cacheService
            )
        {
            booking = BuildBookingResponse();

            var fixture = FixtureUtils.AutoMoqFixture();
            fixture.Inject(Options.Create(BuildApiSettings()));
            fixture.Inject(Options.Create(BuildAtcomSettings()));
            fixture.Inject(Options.Create(BuildCacheSettings()));

            authService = fixture.Freeze<Mock<IAuthenticationService>>();
            authService.Setup(x => x.MappedCustomerId(It.IsAny<CustomerDetails>())).ReturnsAsync("cust_id");

            customersRepository = fixture.Freeze<Mock<IVouchersCustomerRepository>>();
            customersRepository.Setup(x => x.GetCustomerVouchers("cust_id")).ReturnsAsync(new List<VoucherWithCustomer>());

            vouchersRepository = fixture.Freeze<Mock<IVouchersRepository>>();
            var voucherMock = new Voucher();
            typeof(Voucherify.DataModel.Voucher)?.GetProperty("Code")?.SetValue(voucherMock, "first_payment", null);
            vouchersRepository.Setup(x => x.Create(It.IsAny<string>(), It.IsAny<Dictionary<string, object>>(), It.IsAny<decimal?>(), It.IsAny<DateTimeOffset?>())).ReturnsAsync(voucherMock);

            bookingRepository = fixture.Freeze<Mock<IBookingRepository>>();
            bookingPaymentsRepository = fixture.Freeze<Mock<IBookingPaymentsRepository>>();

            cacheService = fixture.Freeze<Mock<ICacheService>>();

            return fixture.Freeze<VouchersService>();
        }
        private VouchersService MockHappyPathWithSettings(
            out Mock<IAuthenticationService> authService,
            out Mock<IBookingRepository> bookingRepository,
            out Mock<IBookingPaymentsRepository> bookingPaymentsRepository,
            out Mock<IVouchersCustomerRepository> customersRepository,
            out Mock<IVouchersRepository> vouchersRepository,
            out BookingResponse booking,
            out Mock<ICacheService> cacheService,
            ApiSettings apiSettings
    )
        {
            booking = BuildBookingResponse();

            var fixture = FixtureUtils.AutoMoqFixture();
            fixture.Inject(Options.Create(apiSettings));
            fixture.Inject(Options.Create(BuildAtcomSettings()));
            fixture.Inject(Options.Create(BuildCacheSettings()));

            authService = fixture.Freeze<Mock<IAuthenticationService>>();
            authService.Setup(x => x.MappedCustomerId(It.IsAny<CustomerDetails>())).ReturnsAsync("cust_id");

            customersRepository = fixture.Freeze<Mock<IVouchersCustomerRepository>>();
            customersRepository.Setup(x => x.GetCustomerVouchers("cust_id")).ReturnsAsync(new List<VoucherWithCustomer>());

            vouchersRepository = fixture.Freeze<Mock<IVouchersRepository>>();
            var voucherMock = new Voucher();
            typeof(Voucherify.DataModel.Voucher).GetProperty("Code").SetValue(voucherMock, "first_payment", null);
            vouchersRepository.Setup(x => x.Create(It.IsAny<string>(), It.IsAny<Dictionary<string, object>>(), It.IsAny<decimal?>(), null)).ReturnsAsync(voucherMock);

            bookingRepository = fixture.Freeze<Mock<IBookingRepository>>();
            bookingPaymentsRepository = fixture.Freeze<Mock<IBookingPaymentsRepository>>();

            cacheService = fixture.Freeze<Mock<ICacheService>>();

            return fixture.Freeze<VouchersService>();
        }
        private static BookingResponse BuildBookingResponse()
        {
            return new BookingResponse
            {
                BookingReference = "REF",
                PaymentInfo = new PriceInfo
                {
                    PaymentHistory = [
                        new PaymentHistoryItem { PayId = "first_payment", Amount = 10.35m},
                        new PaymentHistoryItem { PayId = "second_payment", Amount = 4.44m},
                    ],
                    TotalPrice = 1000
                },
                MarketCode = "UK"
            };
        }

        private static CacheSettings BuildCacheSettings()
        {
            return new CacheSettings
            {
                Buckets = new Buckets()
                {
                    Voucherify = "Voucherify",
                }
            };
        }

        private static AtcomSettings BuildAtcomSettings()
        {
            return new AtcomSettings
            {
                CustomerAgencyNo = new List<string> { "CustomerAgencyNo" },
                PaymentCodes = new Dictionary<string, PaymentCodesSettings>{
                {
                    "refund",
                    new PaymentCodesSettings
                    {
                        Issued =  new PaymentTypeSettings {Code = "CI", Group = "CA"},
                        Redeemed =  new PaymentTypeSettings {Code = "CR", Group = "CA"}
                    }
                }, {
                    "goodwill",
                    new PaymentCodesSettings
                    {
                        Issued =  new PaymentTypeSettings {Code = "GI", Group = "CA"},
                        Redeemed =  new PaymentTypeSettings {Code = "GR", Group = "CA"}
                    }
                }, {
                    "incentive",
                    new PaymentCodesSettings
                    {
                        Issued =  new PaymentTypeSettings {Code = "II", Group = "CA"},
                        Redeemed =  new PaymentTypeSettings {Code = "IR", Group = "CA"}
                    }
                }, {
                    "giftcard",
                    new PaymentCodesSettings
                    {
                        Issued =  new PaymentTypeSettings {Code = "GI", Group = "CA"},
                        Redeemed =  new PaymentTypeSettings {Code = "GR", Group = "CA"}
                    }
                }}
            };
        }

        private static ApiSettings BuildApiSettings()
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
                    PromoVouchers = new VoucherReasonSettings
                    {
                        Types = new List<string>
                        {
                            "Promotion"
                        }
                    },
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
    }
}
