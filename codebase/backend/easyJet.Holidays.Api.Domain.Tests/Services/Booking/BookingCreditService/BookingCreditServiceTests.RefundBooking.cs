using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using Microsoft.Extensions.Options;
using Moq;
using System.Globalization;
using Xunit;
using BookingRefundResponse = easyJet.Holidays.Api.Domain.Data.Vouchers.BookingRefundResponse;
using CustomerDetails = easyJet.Holidays.Api.Domain.Data.Authentication.CustomerDetails;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking.BookingCreditService
{
    public class BookingCreditServiceTests
    {
        private IFixture _fixture { get; set; }
        private Mock<IBookingRefundEligibleService> _bookingRefundEligibleService { get; set; }
        public BookingCreditServiceTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();
        }

        [Theory]
        [MemberData(nameof(REPData))]
        public async Task RefundBooking_Memos_1420Days_Credit_REP7(string because, double departureDays, ConvertType convertType, EligibleForRefund eligibleForRefund, string memoCode, string memoDescription)
        {
            // Arrange
            var settings = BuildHappySettings();
            var sut = BuildService(settings, out var booking);
            var bookingRepoMock = _fixture.Freeze<Mock<IBookingRepository>>();
            bookingRepoMock.Setup(x => x.GetBooking(It.IsAny<ConvertBookingToCreditRequest>())).ReturnsAsync(booking);

            var voucherServiceMock = _fixture.Freeze<Mock<IVouchersService>>();
            voucherServiceMock.Setup(x => x.ConvertBooking(It.IsAny<BookingResponse>(), It.IsAny<string>(), It.IsAny<CreditBreakdown>(), It.IsAny<string>(), It.IsAny<CustomerDetails>(), It.IsAny<bool>())).ReturnsAsync(new BookingRefundResponse());

            var bookingRefundService = _fixture.Freeze<Mock<IBookingRefundService>>();
            bookingRefundService.Setup(x => x.Refund(It.IsAny<BookingResponse>(), It.IsAny<decimal>())).ReturnsAsync(new List<Domain.Data.Booking.BookingRefundResponse>());

            var outboundRoute = booking?.Package?.Transport?.Routes?.FirstOrDefault(r => r.Direction == Direction.Outbound);
            outboundRoute!.DepDate = DateTime.Now.AddDays(departureDays);

            _bookingRefundEligibleService.Setup(x => x.IsEligibleForFullRefund(It.IsAny<BookingResponse>(), It.IsAny<CustomerDetails>()))
                .ReturnsAsync(eligibleForRefund);
            booking!.PaymentInfo = new PriceInfo
            {
                // PaymentHistory = payments,
                DepositPrice = 120m,
                TotalPrice = 999999999m,
            };

            // Act
            await sut.Object.RefundBooking(new ConvertBookingToCreditRequest { Type = convertType });

            // Assert
            bookingRepoMock.Verify(x => x.ModifyMemo(It.IsAny<string>(), It.IsAny<BookingMemo>()), Times.Once, because);
            bookingRepoMock.Verify(x => x.ModifyMemo(booking.BookingReference, It.Is<BookingMemo>(m => m.Code == memoCode && m.Description == memoDescription)), Times.Once, because);
        }

        public static IEnumerable<object[]> REPData()
        {
            yield return new object[] {
                "18 days. Credit, 25% credit",
                18,
                ConvertType.CREDIT,
                new EligibleForRefund
                {
                    Credit = new EligibleAction
                    {
                        IsEligible = true,
                        Credit = 35
                    },
                    Rules = RefundRules.CreditOnly
                },
                "REP7",
                "Refund \u00a30 cash, \u00a335 credit"
            };

            yield return new object[] {
                "25 days. Credit, 50% credit only",
                25,
                ConvertType.CREDIT,
                new EligibleForRefund
                {
                    Credit = new EligibleAction
                    {
                        IsEligible = true,
                        Credit = 140
                    },
                    Rules = RefundRules.QuarterOfCashOrHalfOfCredit
                },
                "REP8",
                "Refund \u00a30 cash, \u00a3140 credit"
            };

            yield return new object[] {
                "25 days. Refund, 25% cash only",
                25,
                ConvertType.REFUND,
                new EligibleForRefund
                {
                    Refund =new EligibleAction
                    {
                        IsEligible = true,
                        Cash = 70
                    },
                    Rules = RefundRules.QuarterOfCashOrHalfOfCredit
                },
                "REP5",
                "Refund \u00a370 cash, \u00a30 credit"
            };

            yield return new object[] {
                "25 days. Refund, 25% cash and credit(not enough cash)",
                25,
                ConvertType.REFUND,
                new EligibleForRefund
                {
                    Refund =new EligibleAction
                    {
                        IsEligible = true,
                        Cash = 50,
                        Credit = 12.5m
                    },
                    Rules = RefundRules.QuarterOfCashOrHalfOfCredit
                },
                "REP6",
                $"Refund £50 cash, £{12.5.ToString(CultureInfo.InvariantCulture)} credit"
            };
        }

        /// <summary>
        /// Builds settings which pass through all checks (happy path)
        /// </summary>
        /// <returns></returns>
        public VoucherSettings BuildHappySettings()
        {
            return new VoucherSettings
            {
                IsActive = true,
                BookingIsEligibleForBeingCredited = new BookingIsEligibleForBeingCreditedSettings
                {
                    IsActive = true,
                    AllowPartialRefunds = true,
                    AllowDepositOnlyToBeConverted = true,
                    AllowFullyPaidToBeConverted = true,
                    AllowPartiallyPaidToBeConverted = true,
                    BookingStatuses = new List<string> { "BOOKING" },
                    //BookingDepartureDate = new DateRangeSettings
                    //{
                    //    From = DateTimeOffset.MinValue,
                    //    To = DateTimeOffset.MaxValue,
                    //},
                    //BookingDepartureDateIsGreaterThanDays = 0,
                    //DateOfChange = new DateRangeSettings
                    //{
                    //    From = DateTimeOffset.MinValue,
                    //    To = DateTimeOffset.MaxValue,
                    //},
                    RefundDays = new RefundDaysSettings
                    {
                        DisabledIfLessThan = 14,
                        CreditOnlyIfLessThan = 21,
                        SpecialRulesIfLessThan = 28
                    }
                },
                BookingMemos = new BookingMemoSettings
                {
                    MovedToCredit = new MemoSettings { Code = "REP3" },
                    MovedToCreditAndCash = new MemoSettings { Code = "REP4" },
                    CacheRefund25Percents = new MemoSettings { Code = "REP5" },
                    CacheAndCreditRefund25Percents = new MemoSettings { Code = "REP6" },
                    CreditRefund25Percents = new MemoSettings { Code = "REP7" },
                    CreditRefund50Percents = new MemoSettings { Code = "REP8" }
                }
            };
        }

        /// <summary>
        /// Build sut with all configurations to pass tests (happy path).
        /// You can modify settings to specific tests
        /// </summary>
        /// <param name="settings"></param>
        /// <param name="booking"></param>
        /// <param name="customerEmail"></param>
        /// <param name="bookingEmail"></param>
        /// <returns></returns>
        private Mock<Domain.Services.Booking.BookingCreditService> BuildService(VoucherSettings settings, out BookingResponse booking, string customerEmail = "c@ej.com", string bookingEmail = "c@ej.com")
        {
            _fixture = FixtureUtils.AutoMoqFixture();

            var apiSettings = Options.Create(new ApiSettings
            {
                Vouchers = settings
            });

            _fixture.Inject(apiSettings);

            var authServiceMock = _fixture.Freeze<Mock<IAuthenticationService>>();
            authServiceMock.Setup(x => x.CustomerDetails()).ReturnsAsync(new CustomerDetails
            {
                Email = customerEmail
            });

            booking = new BookingResponse
            {
                BookingStatus = "BOOKING",
                BookingReference = "0000",
                Package = new BookingPackage
                {
                    Transport = new Transport
                    {
                        Routes = new List<Route> {
                            new Route {
                                Direction = Direction.Outbound,
                                DepDate =  DateTimeOffset.MaxValue,
                                ArrPt = "BCN"
                            }
                        }
                    }
                },
                CustomerDetails = new Domain.Data.Booking.CustomerDetails
                {
                    Email = bookingEmail
                },
                PaymentInfo = new PriceInfo(),
                AmendmentInfo = new AmendmentsInfo
                {
                    CanBookingCancelled = true
                }
            };

            var settingsServiceMock = _fixture.Freeze<Mock<ISettingsService>>();
            settingsServiceMock.Setup(x => x.GetCancelCreditSettings()).ReturnsAsync(new CreditAndCashRefundSettings());

            // freeze dependency, so it can be used later
            _fixture.Freeze<Mock<IBookingRepository>>();
            _fixture.Freeze<Mock<IVouchersService>>();
            _fixture.Freeze<Mock<IBookingRefundService>>();

            _bookingRefundEligibleService = _fixture.Freeze<Mock<IBookingRefundEligibleService>>();

            var sut = _fixture.Freeze<Mock<Domain.Services.Booking.BookingCreditService>>();

            return sut;
        }
    }
}
