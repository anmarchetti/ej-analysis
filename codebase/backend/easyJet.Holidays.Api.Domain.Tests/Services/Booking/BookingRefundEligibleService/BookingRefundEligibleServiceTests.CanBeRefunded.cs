using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.LivePrice;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.Settings;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Settings;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking.BookingRefundEligibleService
{
    public partial class BookingRefundEligibleServiceTests
    {
        private IFixture _fixture { get; set; }
        private Mock<ISettingsService> _settingsServiceMock { get; set; }

        public BookingRefundEligibleServiceTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();
        }

        #region Data validation

        [Fact]
        public async Task CanBeRefunded_VouchersDisabled_ReturnsFalse()
        {
            // Arrange
            var settings = BuildHappySettings();
            settings.IsActive = false;
            var sut = BuildService(settings, out var booking).Object;

            // Act
            var actual = await sut.CanBeRefunded(booking);

            // Assert
            actual.IsEnabled.Should().BeFalse();
        }

        [Fact]
        public async Task CanBeRefunded_CancellationDisabled_ReturnsFalse()
        {
            // Arrange
            var settings = BuildHappySettings();
            settings.BookingIsEligibleForBeingCredited.IsActive = false;
            var sut = BuildService(settings, out var booking).Object;

            // Act
            var actual = await sut.CanBeRefunded(booking);

            // Assert
            actual.IsEnabled.Should().BeFalse();
        }

        [Fact]
        public async Task CanBeRefunded_NullBooking_ReturnsFalse()
        {
            // Arrange
            var settings = BuildHappySettings();
            var sut = BuildService(settings, out _).Object;

            // Act
            var actual = await sut.CanBeRefunded(null);

            // Assert
            actual.IsEnabled.Should().BeFalse();
        }

        [Fact]
        public async Task CanBeRefunded_NoPaymentInfo_ReturnsFalse()
        {
            // Arrange
            var settings = BuildHappySettings();
            var sut = BuildService(settings, out var booking).Object;
            booking.PaymentInfo = null;

            // Act
            var actual = await sut.CanBeRefunded(null);

            // Assert
            actual.IsEnabled.Should().BeFalse();
        }

        [Fact]
        public async Task CanBeRefunded_NoOutboundRoute_ReturnsFalse()
        {
            // Arrange
            var settings = BuildHappySettings();
            var sut = BuildService(settings, out var booking).Object;
            booking.Package.Transport.Routes = new List<Route>();

            // Act
            var actual = await sut.CanBeRefunded(null);

            // Assert
            actual.IsEnabled.Should().BeFalse();
        }

        [Theory]
        [InlineData("c@ej.com", "b@ej.com", false)]
        [InlineData("c@ej.com", "c@ej.com", true)]
        [InlineData("C@ej.com", "c@EJ.com", true)]
        public async Task CanBeRefunded_Emails_ValidateIgnoringCase(string customerEmail, string bookingEmail, bool expected)
        {
            // Arrange
            var settings = BuildHappySettings();
            var sut = BuildService(settings, out var booking, customerEmail, bookingEmail).Object;

            // Act
            var actual = await sut.CanBeRefunded(booking);

            // Assert
            actual.IsEnabled.Should().Be(expected);
        }

        [Theory]
        [InlineData(1, true)]
        [InlineData(0, false)]
        [InlineData(-1, false)]
        public async Task CanBeRefunded_BookingInFuture_NotValid(int addDays, bool expected)
        {
            // Arrange
            var settings = BuildHappySettings();

            var sut = BuildService(settings, out var booking).Object;
            booking.Package.Transport.Routes[0].DepDate = DateTimeOffset.Now.AddDays(addDays);

            // Act
            var actual = await sut.CanBeRefunded(booking);

            // Assert
            actual.IsEnabled.Should().Be(expected);
        }

        [Fact]
        public async Task CanBeRefunded_NoOutboundRoute_NotValid()
        {
            // Arrange
            var settings = BuildHappySettings();
            var sut = BuildService(settings, out var booking).Object;
            booking.Package.Transport.Routes = null;

            // Act
            var actual = await sut.CanBeRefunded(booking);

            // Assert
            actual.IsEnabled.Should().BeFalse();
        }
        #endregion

        [Fact]
        public async Task CanBeRefunded_DisabledGlobally_ReturnFalse()
        {
            // Arrange
            var settings = BuildHappySettings();
            var sut = BuildService(settings, out var booking).Object;
            booking.BookingReference = "123";
            settings.BookingIsEligibleForBeingCredited.IsActive = false;

            _settingsServiceMock.Setup(x => x.GetCancelCreditSettings()).ReturnsAsync(new CreditAndCashRefundSettings
            {
                CreditOnlyRules = new List<CreditOnlyRefundRule>(),
            });

            // Act
            var actual = await sut.CanBeRefunded(booking);

            // Assert
            actual.IsEnabled.Should().BeFalse();
        }

        [Fact]
        public async Task CanBeRefunded_ExemptionList_IgnoreOtherRules()
        {
            // Arrange
            var settings = BuildHappySettings();
            var sut = BuildService(settings, out var booking).Object;
            booking.BookingReference = "123";

            var rules = new List<CreditOnlyRefundRule>
            {
                new CreditOnlyRefundRule {
                    Active = new DateRange {
                        Start = DateTimeOffset.MinValue,
                        End = DateTimeOffset.MaxValue
                    },
                    DaysBeforeDeparture = int.MaxValue, // This rule disables credit
                    DestinationAirports = new List<string> { "BCN"},
                }
            };

            _settingsServiceMock.Setup(x => x.GetCancelCreditSettings()).ReturnsAsync(new CreditAndCashRefundSettings
            {
                CreditOnlyRules = rules,
                ExemptionList = new List<string> { " 123  ", "456" }
            });

            // Act
            var actual = await sut.CanBeRefunded(booking);

            // Assert
            actual.IsEnabled.Should().BeTrue();
        }

        [Fact]
        public async Task CanBeRefunded_Rules_NoRules_UseDefaultSettings()
        {
            // Arrange
            var settings = BuildHappySettings();
            settings.IsActive = false;
            var sut = BuildService(settings, out var booking).Object;
            _settingsServiceMock.Setup(x => x.GetCancelCreditSettings()).Returns(Task.FromResult<CreditAndCashRefundSettings>(null));

            // Act
            var actual = await sut.CanBeRefunded(booking);

            // Assert
            actual.IsEnabled.Should().BeFalse();
        }

        [Fact]
        public async Task CanBeRefunded_Rules_NoActiveRuleForDestAirport_UseDefaultSettings()
        {
            // Arrange
            var settings = BuildHappySettings();
            var sut = BuildService(settings, out var booking).Object;
            booking.Package.Transport.Routes[0].ArrPt = "BCN";
            var rules = new List<CreditOnlyRefundRule>
            {
                // inappropriate airports
                new CreditOnlyRefundRule {
                    Active = new DateRange {
                        Start = DateTimeOffset.MinValue,
                        End = DateTimeOffset.MaxValue,
                    },
                    DaysBeforeDeparture = int.MaxValue, // all bookings are not eligible for credit
                    DestinationAirports = new List<string> { "LGW", "QQQ"}
                },
                // rule is not active
                new CreditOnlyRefundRule {
                    Active = new DateRange {
                        Start = DateTimeOffset.MinValue,
                        End = DateTimeOffset.MinValue,
                    },
                    DaysBeforeDeparture = int.MaxValue, // all bookings are not eligible for credit                                          
                    DestinationAirports = new List<string> { "BCN"}
                }
            };

            _settingsServiceMock.Setup(x => x.GetCancelCreditSettings()).ReturnsAsync(new CreditAndCashRefundSettings { CreditOnlyRules = rules });

            // Act
            var actual = await sut.CanBeRefunded(booking);

            // Assert
            actual.IsEnabled.Should().BeTrue();
        }

        [Theory]
        [MemberData(nameof(RuleActiveDatesData))]
        public async Task CanBeRefunded_RulesActiveDate_RefundType(string because, DateRange range, bool ruleIsValid)
        {
            // Arrange
            var settings = BuildHappySettings();
            settings.BookingIsEligibleForBeingCredited.AllowPartialRefunds = false; // disable partial refunds, so we can validate only current rule

            var sut = BuildService(settings, out var booking).Object;
            booking.Package.Transport.Routes[0].ArrPt = "BCN";
            var now = DateTimeOffset.Now;
            var depDate = now.AddDays(9);
            // Departure is withing 28 days, only credit may be available if rule is applicable
            booking.Package.Transport.Routes[0].DepDate = depDate;
            var rules = new List<CreditOnlyRefundRule>
            {
                new CreditOnlyRefundRule {
                    Active = range,
                    DaysBeforeDeparture = int.MinValue, // Rule enables everything
                    DestinationAirports = new List<string> { "BCN"},
                }
            };

            _settingsServiceMock.Setup(x => x.GetCancelCreditSettings()).ReturnsAsync(new CreditAndCashRefundSettings { CreditOnlyRules = rules });

            // Act
            var actual = await sut.CanBeRefunded(booking);

            // Assert
            actual.IsEnabled.Should().BeTrue(because); // e.g. if we expect disabled=true, then method should return `false`
            actual.Type.Should().Be(ruleIsValid ? RefundType.CreditOnly : RefundType.CreditAndRefund);
        }

        public static IEnumerable<object[]> RuleActiveDatesData()
        {
            var now = DateTimeOffset.Now;

            // because, range, ruleIsApplicable
            yield return new object[] {
                "now inside range",
                new DateRange {
                    Start = DateTimeOffset.MinValue,
                    End = DateTimeOffset.MaxValue,
                },
                true,
            };

            yield return new object[] {
                "now is after start, no end",
                new DateRange {
                    Start = DateTimeOffset.MinValue,
                    End = null,
                },
                true,
            };

            yield return new object[] {
                "now is before end, no start",
                new DateRange {
                    Start = null,
                    End = DateTimeOffset.MaxValue,
                },
                true,
            };

            yield return new object[] {
                "now on the border of range",
                new DateRange {
                    Start = now.AddMinutes(-5),
                    End = now.AddMinutes(5),
                },
                true,
            };

            yield return new object[] {
                "now outside range",
                new DateRange {
                    Start = now.AddDays(10),
                    End = DateTimeOffset.MaxValue,
                },
                false,
            };
        }

        #region AllowFullyPaid
        [Theory]
        [InlineData(true, 0, true, "Fully paid")]
        [InlineData(true, -1, true, "Fully paid")]
        [InlineData(false, 0, false, "Fully paid disabled")]
        public async Task CanBeRefunded_AllowFullyPaid(bool allowFullyPaid, decimal balanceDueAmount, bool expected, string because)
        {
            Func<Task> testDefaultSetting = async () =>
            {
                // Arrange  
                var settings = BuildHappySettings();
                settings.BookingIsEligibleForBeingCredited.AllowFullyPaidToBeConverted = allowFullyPaid;

                var sut = BuildService(settings, out var booking).Object;
                booking.PaymentInfo.BalanceDueAmount = balanceDueAmount;

                _settingsServiceMock.Setup(x => x.GetCancelCreditSettings()).ReturnsAsync(new CreditAndCashRefundSettings
                {
                    CreditOnlyRules = new List<CreditOnlyRefundRule>(),
                    ExemptionList = new List<string>()
                }); // reset

                // Act
                var actual = await sut.CanBeRefunded(booking);

                // Assert
                actual.IsEnabled.Should().Be(expected, $"Default setting, {because}");
            };

            Func<Task> testCmsSetting = async () =>
            {
                // Arrange  
                var settings = BuildHappySettings();
                settings.BookingIsEligibleForBeingCredited.AllowFullyPaidToBeConverted = allowFullyPaid;

                var sut = BuildService(settings, out var booking).Object;
                booking.PaymentInfo.BalanceDueAmount = balanceDueAmount;

                var rules = new List<CreditOnlyRefundRule>
                {
                    new CreditOnlyRefundRule {
                        Active = new DateRange {
                            Start = DateTimeOffset.MinValue,
                            End = DateTimeOffset.MaxValue
                        },
                        DaysBeforeDeparture = int.MinValue, // enable everything
                        DestinationAirports = new List<string> { "BCN"}
                    }
                };
                _settingsServiceMock.Setup(x => x.GetCancelCreditSettings()).ReturnsAsync(new CreditAndCashRefundSettings { CreditOnlyRules = rules });

                // Act
                var actual = await sut.CanBeRefunded(booking);

                // Assert
                actual.IsEnabled.Should().Be(expected, $"CMS setting, {because}");
            };

            // Act
            await testCmsSetting();
            await testDefaultSetting();
        }
        #endregion

        #region AllowPartiallyPaid
        [Theory]
        [InlineData(true, 1, 100, true, "Partially paid is allowed")]
        [InlineData(false, 1, 100, false, "Partially paid disabled")]
        public async Task CanBeRefunded_AllowPartiallyPaid(bool allowpartiallyPaid, decimal balanceDueAmount, decimal totalPrice, bool expected, string because)
        {
            Func<Task> testDefaultSetting = async () =>
            {
                // Arrange
                var settings = BuildHappySettings();
                settings.BookingIsEligibleForBeingCredited.AllowPartiallyPaidToBeConverted = allowpartiallyPaid;

                var sut = BuildService(settings, out var booking).Object;
                booking.PaymentInfo.BalanceDueAmount = balanceDueAmount;
                booking.PaymentInfo.TotalPrice = totalPrice;
                booking.PaymentInfo.DepositPrice = 10;

                _settingsServiceMock.Setup(x => x.GetCancelCreditSettings()).ReturnsAsync(new CreditAndCashRefundSettings
                {
                    CreditOnlyRules = new List<CreditOnlyRefundRule>(),
                    ExemptionList = new List<string>()
                }); // reset

                // Act
                var actual = await sut.CanBeRefunded(booking);

                // Assert
                actual.IsEnabled.Should().Be(expected, $"Default setting, {because}");
            };

            Func<Task> testCmsSetting = async () =>
            {
                // Arrange
                var settings = BuildHappySettings();
                settings.BookingIsEligibleForBeingCredited.AllowPartiallyPaidToBeConverted = allowpartiallyPaid;

                var sut = BuildService(settings, out var booking).Object;
                booking.PaymentInfo.BalanceDueAmount = balanceDueAmount;
                booking.PaymentInfo.TotalPrice = totalPrice;
                booking.PaymentInfo.DepositPrice = 10;
                var rules = new List<CreditOnlyRefundRule>
                {
                    new CreditOnlyRefundRule {
                        Active = new DateRange {
                            Start = DateTimeOffset.MinValue,
                            End = DateTimeOffset.MaxValue
                        },
                        DaysBeforeDeparture = int.MinValue, // enable everything
                        DestinationAirports = new List<string> { "BCN"},
                    }
                };
                _settingsServiceMock.Setup(x => x.GetCancelCreditSettings()).ReturnsAsync(new CreditAndCashRefundSettings { CreditOnlyRules = rules });
                // Act
                var actual = await sut.CanBeRefunded(booking);

                // Assert
                actual.IsEnabled.Should().Be(expected, $"Cms rules, {because}");
            };

            // Act
            await testCmsSetting();
            await testDefaultSetting();
        }
        #endregion

        #region AllowDepositOnly
        [Theory]
        [InlineData(true, 90, 100, 10, true, "Deposit only")]
        [InlineData(false, 90, 100, 10, false, "Deposit only disabled")]
        public async Task CanBeRefunded_AllowDepositOnly(bool allowDepositOnly, decimal balanceDueAmount, decimal totalPrice, decimal deposit, bool expected, string because)
        {
            Func<Task> testDefaultSetting = async () =>
            {
                // Arrange  
                var settings = BuildHappySettings();
                settings.BookingIsEligibleForBeingCredited.AllowDepositOnlyToBeConverted = allowDepositOnly;

                var sut = BuildService(settings, out var booking).Object;

                booking.PaymentInfo.BalanceDueAmount = balanceDueAmount;
                booking.PaymentInfo.TotalPrice = totalPrice;
                booking.PaymentInfo.DepositPrice = deposit;

                _settingsServiceMock.Setup(x => x.GetCancelCreditSettings()).ReturnsAsync(new CreditAndCashRefundSettings
                {
                    CreditOnlyRules = new List<CreditOnlyRefundRule>(),
                    ExemptionList = new List<string>()
                }); // reset

                // Act
                var actual = await sut.CanBeRefunded(booking);

                // Assert
                actual.IsEnabled.Should().Be(expected, $"Default setting, {because}");
            };

            Func<Task> testCmsSetting = async () =>
            {
                // Arrange  
                var settings = BuildHappySettings();
                settings.BookingIsEligibleForBeingCredited.AllowDepositOnlyToBeConverted = allowDepositOnly;
                var sut = BuildService(settings, out var booking).Object;

                booking.PaymentInfo.BalanceDueAmount = balanceDueAmount;
                booking.PaymentInfo.TotalPrice = totalPrice;
                booking.PaymentInfo.DepositPrice = deposit;

                var rules = new List<CreditOnlyRefundRule>
                {
                    new CreditOnlyRefundRule {
                        Active = new DateRange {
                            Start = DateTimeOffset.MinValue,
                            End = DateTimeOffset.MaxValue
                        },
                        DaysBeforeDeparture = int.MinValue, // enable everything
                        DestinationAirports = new List<string> { "BCN"},
                        //AllowFullyPaidToBeConverted = true,
                        //AllowPartiallyPaidToBeConverted = true,
                        //AllowDepositOnlyToBeConverted = allowDepositOnly
                    }
                };
                _settingsServiceMock.Setup(x => x.GetCancelCreditSettings()).ReturnsAsync(new CreditAndCashRefundSettings { CreditOnlyRules = rules });

                // Act
                var actual = await sut.CanBeRefunded(booking);

                // Assert
                actual.IsEnabled.Should().Be(expected, $"CMS setting, {because}");
            };

            // Act
            await testDefaultSetting();
            await testCmsSetting();
        }
        #endregion

        #region BookingDepartureDate
        [Theory]
        [InlineData(0, 0, true, "the same day")]
        [InlineData(-15, 0, true, "the same day")]
        [InlineData(-20, 0, true, "ends on dep date")]
        [InlineData(-20, 20, true, "includes dep date")]
        [InlineData(1, 1, true, "from same day, but later")]
        [InlineData(-20, -16, true, "previous day, rule is not applicable")]
        [InlineData(20, 25, true, "next day, rule is not applicable")]
        public async Task CanBeRefunded_BookingDepartureDate(double addHoursFrom, double addHoursTo, bool expected, string because)
        {
            // Arrange
            var future = DateTimeOffset.Now.Date.AddDays(10);// dep date should be in future
            var routeDepDate = new DateTimeOffset(future.Year, future.Month, future.Day, 15, 0, 0, TimeSpan.Zero);
            var from = routeDepDate.AddHours(addHoursFrom);
            var to = routeDepDate.AddHours(addHoursTo);

            //Func<Task> testDefaultSetting = async () =>
            //{
            //    // Arrange
            //    var settings = BuildHappySettings();
            //    settings.BookingIsEligibleForBeingCredited.BookingDepartureDate.From = from;
            //    settings.BookingIsEligibleForBeingCredited.BookingDepartureDate.To = to;

            //    var sut = BuildService(settings, out var booking).Object;
            //    booking.Package.Transport.Routes[0].DepDate = routeDepDate;

            //    _settingsServiceMock.Setup(x => x.GetCancelCreditSettings()).ReturnsAsync(new CreditAndCashRefundSettings
            //    {
            //        CreditOnlyRules = new List<CreditOnlyRefundRule>(),
            //        ExemptionList = new List<string>()
            //    }); // reset

            //    // Act
            //    var actual = await sut.CanBeRefunded(booking);

            //    // Assert
            //    actual.IsEnabled.Should().Be(expected, $"Default setting, {because}");
            //};

            Func<Task> testCmsSetting = async () =>
            {
                // Arrange
                var settings = BuildHappySettings();

                var sut = BuildService(settings, out var booking).Object;
                booking.Package.Transport.Routes[0].DepDate = routeDepDate;

                var rules = new List<CreditOnlyRefundRule>
                {
                    new CreditOnlyRefundRule {
                        Active = new DateRange {
                            Start = DateTimeOffset.MinValue,
                            End = DateTimeOffset.MaxValue
                        },
                        DaysBeforeDeparture = int.MinValue, // enable everything
                        DestinationAirports = new List<string> { "BCN"},
                        BookingDepartureDateFrom = from,
                        BookingDepartureDateTo = to
                    }
                };
                _settingsServiceMock.Setup(x => x.GetCancelCreditSettings()).ReturnsAsync(new CreditAndCashRefundSettings { CreditOnlyRules = rules });

                // Act
                var actual = await sut.CanBeRefunded(booking);

                // Assert
                actual.IsEnabled.Should().Be(expected, $"CMS setting, {because}");
            };

            // Act
            await testCmsSetting();
            //await testDefaultSetting();
        }
        #endregion

        #region DateOfChange
        [Theory]
        [InlineData(0, 0, true, "Today")]
        [InlineData(-1, 0, true, "From yesterday to today")]
        [InlineData(0, 1, true, "From today to tomorrow")]
        [InlineData(-1, 1, true, "From yesterday to tomorrow")]
        [InlineData(-2, -1, true, "From the day before yeserday to yesterday, rule is not applicable")]
        [InlineData(1, 2, true, "From tomorrow to the day after tomorrow, rule is not applicable")]
        public async Task CanBeRefunded_DateOfChange(int addDaysFrom, int addDaysTo, bool expected, string because)
        {
            // Arrange
            var from = DateTimeOffset.Now.Date.AddDays(addDaysFrom).Date;
            var to = DateTimeOffset.Now.Date.AddDays(addDaysTo).Date;

            // Arrange
            var settings = BuildHappySettings();

            var sut = BuildService(settings, out var booking).Object;

            var rules = new List<CreditOnlyRefundRule>
            {
                    new CreditOnlyRefundRule {
                        Active = new DateRange {
                            Start = DateTimeOffset.MinValue,
                            End = DateTimeOffset.MaxValue
                        },
                        DaysBeforeDeparture = int.MinValue, // enable everything
                        DestinationAirports = new List<string> { "BCN"},
                        DateOfChangeFrom = from,
                        DateOfChangeTo = to
                    }
                };
            _settingsServiceMock.Setup(x => x.GetCancelCreditSettings()).ReturnsAsync(new CreditAndCashRefundSettings { CreditOnlyRules = rules });

            // Act
            var actual = await sut.CanBeRefunded(booking);

            // Assert
            actual.IsEnabled.Should().Be(expected, $"CMS setting, {because}");
        }
        #endregion

        #region BookedWithinDate
        [Theory]
        [InlineData(-120, -30, RefundType.CreditOnly, "booking date is inside booked within dates")]
        [InlineData(-20, -1, RefundType.CreditAndRefund, "booking date is outside booked within dates")]
        public async Task CanBeRefunded_BookedWithinDate_RefundType(int addDaysFrom, int addDaysTo, RefundType expectedType, string because)
        {
            // Arrange
            var now = DateTimeOffset.Now;
            var settings = BuildHappySettings();
            settings.BookingIsEligibleForBeingCredited.AllowPartialRefunds = false;

            var sut = BuildService(settings, out var booking).Object;
            booking.BookingDate = now.AddDays(-60);
            booking.Package.Transport.Routes[0].DepDate = now.AddDays(9);

            var rules = new List<CreditOnlyRefundRule>
            {
                new CreditOnlyRefundRule
                {
                    Active = new DateRange
                    {
                        Start = DateTimeOffset.MinValue,
                        End = DateTimeOffset.MaxValue
                    },
                    DaysBeforeDeparture = int.MinValue,
                    DestinationAirports = new List<string> { "BCN" },
                    BookedWithinDateFrom = now.Date.AddDays(addDaysFrom),
                    BookedWithinDateTo = now.Date.AddDays(addDaysTo)
                }
            };

            _settingsServiceMock.Setup(x => x.GetCancelCreditSettings())
                .ReturnsAsync(new CreditAndCashRefundSettings { CreditOnlyRules = rules });

            // Act
            var actual = await sut.CanBeRefunded(booking);

            // Assert
            actual.IsEnabled.Should().BeTrue();
            actual.Type.Should().Be(expectedType, because);
        }
        #endregion

        #region DaysBeforeDeparture
        [Theory]
        [MemberData(nameof(DaysBeforeDepartureData))]
        public async Task CanBeRefunded_Rules_DaysBeforeDeparture(string because, int daysBeforeDeparture, DateTime departureDate, bool isRuleApplicable, RefundType type)
        {
            // Arrange
            var settings = BuildHappySettings();
            settings.BookingIsEligibleForBeingCredited.AllowPartialRefunds = false; // disable partial refunds, so we can validate only current rule

            var sut = BuildService(settings, out var booking).Object;
            booking.Package.Transport.Routes[0].DepDate = departureDate;

            var rules = new List<CreditOnlyRefundRule>
            {
                    new CreditOnlyRefundRule {
                        Active = new DateRange {
                            Start = DateTimeOffset.MinValue,
                            End = DateTimeOffset.MaxValue,
                        },
                        DestinationAirports = new List<string> { "BCN"},
                        DaysBeforeDeparture = daysBeforeDeparture,
                    }
                };

            _settingsServiceMock.Setup(x => x.GetCancelCreditSettings()).ReturnsAsync(new CreditAndCashRefundSettings { CreditOnlyRules = rules });

            // Act
            var actual = await sut.CanBeRefunded(booking);

            // Assert
            actual.IsEnabled.Should().Be(isRuleApplicable, because); // e.g. if we expect disabled=true, then method should return `false`            
            if (isRuleApplicable)
            {
                actual.Type.Should().Be(type, because);
            }
        }

        public static IEnumerable<object[]> DaysBeforeDepartureData()
        {
            var now = DateTime.UtcNow;

            // string because, int daysBeforeDeparture, DateTimeOffset departureDate, bool expected
            yield return new object[] {
                "today is <= X days from departure",
                5,
                now.AddDays(5).AddMinutes(-5), // to make sure this date is a liiitle bit smaller than now, otherwise it wont work
                true,
                RefundType.CreditAndRefund
            };

            yield return new object[] {
                "today is < X days  from departure",
                5,
                now.AddDays(3),
                true,
                RefundType.CreditAndRefund
            };

            yield return new object[] {
                "today is > X days  from departure",
                5,
                now.AddDays(8),
                true,
                RefundType.CreditOnly
            };
        }
        #endregion

        [Theory]
        [InlineData("BOOKING", true)]
        [InlineData("bOOKING", false)]
        [InlineData("CANCELLED", false)]
        public async Task CanBeRefunded_BookingIsActive(string bookingStatus, bool expected)
        {
            // Arrange
            var settings = BuildHappySettings();
            settings.BookingIsEligibleForBeingCredited.BookingStatuses = new List<string> { "BOOKING" };

            var sut = BuildService(settings, out var booking).Object;
            booking.BookingStatus = bookingStatus;

            // Act
            var actual = await sut.CanBeRefunded(booking);

            // Assert
            actual.IsEnabled.Should().Be(expected);
        }

        #region Credit only rules

        [Fact]
        public async Task CanBeRefunded_CreditOnlyRules_LessThan28Days_AllowsCredit()
        {
            // Arrange
            var settings = BuildHappySettings(); // Here defautl config is 28 days
            var sut = BuildService(settings, out var booking).Object;
            booking.Package.Transport.Routes[0].ArrPt = "BCN";

            var now = DateTimeOffset.Now;
            var depDate = now.AddDays(9);
            booking.Package.Transport.Routes[0].DepDate = depDate;

            // this rule should take priority
            var creditOnlyRules = new List<CreditOnlyRefundRule>
            {
                // inappropriate airports
                new CreditOnlyRefundRule {
                    Active = new DateRange {
                        Start = DateTimeOffset.MinValue,
                        End = DateTimeOffset.MaxValue,
                    },
                    DestinationAirports = new List<string> { "BCN"},
                    DaysBeforeDeparture = 7,
                }
            };

            _settingsServiceMock.Setup(x => x.GetCancelCreditSettings()).ReturnsAsync(new CreditAndCashRefundSettings
            {
                CreditOnlyRules = creditOnlyRules
            });

            // Act
            var actual = await sut.CanBeRefunded(booking);

            // Assert
            actual.IsEnabled.Should().BeTrue();
            actual.Type.Should().Be(RefundType.CreditOnly);
        }
        #endregion

        /// <summary>
        /// Builds settings which pass through all checks (happy path)
        /// </summary>
        /// <returns></returns>
        private static VoucherSettings BuildHappySettings()
        {
            return new VoucherSettings
            {
                IsActive = true,
                BookingIsEligibleForBeingCredited = new BookingIsEligibleForBeingCreditedSettings
                {
                    IsActive = true,
                    AllowPartialRefunds = false,
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
                },
                DefaultDepositPerPerson = 60,
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
        private Mock<Domain.Services.Booking.BookingRefundEligibleService> BuildService(VoucherSettings settings, out BookingResponse booking, string customerEmail = "c@ej.com", string bookingEmail = "c@ej.com")
        {
            _fixture = FixtureUtils.AutoMoqFixture();

            var apiSettings = Options.Create(new ApiSettings
            {
                Vouchers = settings
            });

            _fixture.Inject(apiSettings);

            var atcomSettings = Options.Create(new AtcomSettings
            {
                PaymentCodes = new Dictionary<string, PaymentCodesSettings>
                {
                    {
                        "refund",
                        new PaymentCodesSettings
                        {
                            Issued = new PaymentTypeSettings {Code = "CI" },
                            Redeemed = new PaymentTypeSettings { Code = "CR"}
                        }
                    },
                    {
                        "goodwill",
                        new PaymentCodesSettings
                        {
                            Issued = new PaymentTypeSettings { Code = "GI"},
                            Redeemed = new PaymentTypeSettings { Code = "GR"}
                        }
                    },
                    {
                        "giftcard",
                        new PaymentCodesSettings
                        {
                            Issued = new PaymentTypeSettings { Code = "GCI"},
                            Redeemed = new PaymentTypeSettings { Code = "GCR"}
                        }
                    },
                    {
                        "onetimeuse",
                        new PaymentCodesSettings
                        {
                            Issued = new PaymentTypeSettings { Code = "OTCI"},
                            Redeemed = new PaymentTypeSettings { Code = "OTCR"}
                        }
                    },
                    {
                        "staff credit",
                        new PaymentCodesSettings
                        {
                            Issued = new PaymentTypeSettings {Code = "PSTI"},
                            Redeemed = new PaymentTypeSettings { Code = "PSTR"}
                        }
                    },
                    {
                        "staff credit 23-24",
                        new PaymentCodesSettings
                        {
                            Issued = new PaymentTypeSettings {Code = "PSTJ"},
                            Redeemed = new PaymentTypeSettings {Code = "PSTK"},
                            ExpirationDate = DateTime.Now.AddMonths(2)
                        }
                    },
                    {
                        "expires in the past - staff credit 23-24",
                        new PaymentCodesSettings
                        {
                            Issued = new PaymentTypeSettings {Code = "PSTJ"},
                            Redeemed = new PaymentTypeSettings {Code = "PstExpPSTK"},
                            Reason = "Promotion - Staff credit 23-24 expires in the past",
                            ExpirationDate = DateTime.Now.AddMonths(-2)
                        }
                    },
                    {
                        "expires in the future - staff credit 23-24",
                        new PaymentCodesSettings
                        {
                            Issued = new PaymentTypeSettings {Code = "PSTJ"},
                            Redeemed = new PaymentTypeSettings {Code = "FrtExprPSTK"},
                            Reason = "Promotion - Staff credit 23-24 expires in the future",
                            ExpirationDate = DateTime.Now.AddMonths(2)
                        }
                    }
                }
            });

            _fixture.Inject(atcomSettings);

            var apiSettingsService = new ApiSettingsService(atcomSettings, _fixture.Freeze<Mock<ILogger<ApiSettingsService>>>().Object);
            _fixture.Inject<IApiSettingsService>(apiSettingsService);

            var authServiceMock = _fixture.Freeze<Mock<IAuthenticationService>>();
            authServiceMock.Setup(x => x.GetCustomerEmail()).ReturnsAsync(customerEmail);


            booking = new BookingResponse
            {
                BookingDate = DateTimeOffset.Now.AddMonths(-3),
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
                CustomerDetails = new()
                {
                    Email = bookingEmail
                },
                PaymentInfo = new PriceInfo()
            };

            var sitecoreRefundSettings = new CreditAndCashRefundSettings
            {
                CurrentRulesApplyForHolidaysBookedFrom = new DateTime(2022, 11, 01, 0, 0, 0, DateTimeKind.Utc)
            };

            _settingsServiceMock = _fixture.Freeze<Mock<ISettingsService>>();
            _settingsServiceMock.Setup(x => x.GetCancelCreditSettings()).ReturnsAsync(sitecoreRefundSettings);

            // freeze dependency, so it can be used later
            _fixture.Freeze<Mock<IBookingRepository>>();
            _fixture.Freeze<Mock<IVouchersService>>();
            _fixture.Freeze<Mock<IBookingRefundService>>();

            var sut = _fixture.Freeze<Mock<Domain.Services.Booking.BookingRefundEligibleService>>();

            return sut;
        }
    }
}