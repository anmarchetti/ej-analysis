using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Settings;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking.BookingRefundEligibleService
{
    /// <summary>
    /// Tests for IsEligibleForRefund when partial refunds are enabled. On prod and most other envs partial refunds are disabled
    /// </summary>
    public partial class BookingRefundEligibleServiceTests
    {
        [Theory]
        [MemberData(nameof(LessThan28DaysData))]
        public async Task IsEligibleForRefund_DepartureLessThan28Days(string because, double departureDays, PaymentHistoryItem[] payments, EligibleForRefund expected)
        {
            // Arrange
            var settings = BuildHappySettings();
            settings.BookingIsEligibleForBeingCredited.AllowPartialRefunds = true;

            var sut = BuildService(settings, out var booking); // DepartureDate is Max (>28 days)
            _settingsServiceMock.Setup(x => x.GetCancelCreditSettings()).ReturnsAsync(
                new CreditAndCashRefundSettings
                {
                    CurrentRulesApplyForHolidaysBookedFrom = new DateTime(2022, 11, 01),
                    CurrentRulesAllowRefundsForXOrMoreDaysBeforeDeparture = 60,
                    PreviousRulesAllowRefundsForXOrMoreDaysBeforeDeparture = 28,
                });

            var outboundRoute = booking?.Package?.Transport?.Routes?.FirstOrDefault(r => r.Direction == Direction.Outbound);
            outboundRoute.DepDate = DateTime.UtcNow.AddDays(departureDays);

            booking.PaymentInfo = new PriceInfo
            {
                PaymentHistory = payments,
                DepositPrice = 120m,
                TotalPrice = 999999999m
            };

            // Act
            var actual = await sut.Object.IsEligibleForFullRefund(booking);

            // Assert
            actual.Should().BeEquivalentTo(expected, because);
        }

        [Theory]
        [MemberData(nameof(Over28DaysData))] // Use test data from Over28Days because for partial bookings we should use the same rules
        public async Task IsEligibleForRefund_DepartureLessThan28Days_DepositOnly(string because, PaymentHistoryItem[] payments, EligibleForRefund expected)
        {
            // Arrange
            var settings = BuildHappySettings();
            settings.BookingIsEligibleForBeingCredited.AllowPartialRefunds = true;
            var sut = BuildService(settings, out var booking);
            var outboundRoute = booking?.Package?.Transport?.Routes?.FirstOrDefault(r => r.Direction == Direction.Outbound);
            outboundRoute.DepDate = DateTime.Now.AddDays(1);

            booking.PaymentInfo = new PriceInfo
            {
                PaymentHistory = payments,
                DepositPrice = 120m,
                TotalPrice = 999999999m,
                BalanceDueAmount = 1 // partially paid
            };

            // Act
            var actual = await sut.Object.IsEligibleForFullRefund(booking);

            // Assert
            actual.Should().BeEquivalentTo(expected, because);
        }

        public static IEnumerable<object[]> LessThan28DaysData()
        {
            // 21-27 days: 50% credit or 25 cash(remainder topped with credits)
            var data2127 = DataFor2127(new List<double> { 21.1, 27.9 });
            foreach (var i in data2127) yield return i;

            // 14-20 days: 25% credit
            var data1420 = DataFor1420(new List<double> { 14.1, 20.9 });
            foreach (var i in data1420) yield return i;

            // 0-13 days: disabled on web site
            var data013 = DataFor013(new List<double> { 0.5, 13.9 });
            foreach (var i in data013) yield return i;

            // 0 days is disabled by rules: departure should be in future 
            yield return new object[] {
                $"0 days. Disabled by rules",
                0,
                new PaymentHistoryItem[] {
                    new PaymentHistoryItem {
                        IsCredit = true,
                        Amount = 140,
                        PayMethodCode = "PSTK"
                    }
                },
                new EligibleForRefund
                {
                    Credit = new EligibleAction
                    {
                        IsEligible = false
                    },
                    Refund = new EligibleAction
                    {
                        IsEligible = false
                    },
                    Status = RefundStatus.DisabledByRules,
                    Rules = RefundRules.NoRefund
                }
            };
        }

        private static IEnumerable<object[]> DataFor2127(List<double> days)
        {
            foreach (var day in days)
            {
                yield return new object[] {
                    $"{day} days. Credits only. 50% credit or 25 cash(remainder topped with credits)",
                    day,
                    new[] {
                        new PaymentHistoryItem {
                            IsCredit = true,
                            Amount = 140,
                            PayMethodCode = "PSTK"

                        }
                    },
                    new EligibleForRefund
                    {
                        Credit = new EligibleAction
                        {
                            IsEligible = true,
                            Credit = 70,
                            CreditBreakdown = new CreditBreakdown
                            {
                                Refund = 70
                            }
                        },
                        Refund = new EligibleAction
                        {
                            IsEligible = false
                        },
                        Status = RefundStatus.Ok,
                        Rules = RefundRules.QuarterOfCashOrHalfOfCredit
                    }
                };

                yield return new object[] {
                    $"{day} days. Credits and cash. 50% credit or 25 cash(remainder topped with credits)",
                    day,
                    new[] {
                        new PaymentHistoryItem {
                            IsCredit = true,
                            Amount = 140,
                            PayMethodCode = "PSTK"
                        },
                        new PaymentHistoryItem {
                            IsCredit = false,
                            Amount = 140,
                        }
                    },
                    new EligibleForRefund
                    {
                        Credit = new EligibleAction
                        {
                            IsEligible = true,
                            Credit = 140,
                            CreditBreakdown = new CreditBreakdown
                            {
                                Refund = 140
                            }
                        },
                        Refund = new EligibleAction
                        {
                            IsEligible = true,
                            Cash = 70,
                            CreditBreakdown = new CreditBreakdown()
                        },
                        Status = RefundStatus.Ok,
                        Rules = RefundRules.QuarterOfCashOrHalfOfCredit
                    }
                };

                yield return new object[] {
                    $"{day} days. Credits and cash (with rounding). 50% credit or 25 cash(remainder topped with credits)",
                    day,
                    new[] {
                        new PaymentHistoryItem {
                            IsCredit = true,
                            Amount = 140,
                            PayMethodCode = "PSTK"
                        },
                        new PaymentHistoryItem {
                            IsCredit = false,
                            Amount = 143.7m,
                        }
                    },
                    new EligibleForRefund
                    {
                        Credit = new EligibleAction
                        {
                            IsEligible = true,
                            Credit = 141.85m,
                            CreditBreakdown = new CreditBreakdown
                            {
                                Refund = 141.85m
                            }
                        },
                        Refund = new EligibleAction
                        {
                            IsEligible = true,
                            Cash = 70.93m,
                            CreditBreakdown = new CreditBreakdown()
                        },
                        Status = RefundStatus.Ok,
                        Rules = RefundRules.QuarterOfCashOrHalfOfCredit
                    }
                };

                yield return new object[] {
                    $"{day} days. Credits and cash(not enough for full refund). 50% credit or 25 cash(remainder topped with credits)",
                    day,
                    new[] {
                        new PaymentHistoryItem {
                            IsCredit = true,
                            Amount = 90,
                            PayMethodCode = "PSTK"
                        },
                        new PaymentHistoryItem {
                            IsCredit = false,
                            Amount = 10,
                        }
                    },
                    new EligibleForRefund
                    {
                        Credit = new EligibleAction
                        {
                            IsEligible = true,
                            Credit = 50,
                            CreditBreakdown = new CreditBreakdown
                            {
                                Refund = 50
                            }
                        },
                        Refund = new EligibleAction
                        {
                            IsEligible = true,
                            Cash = 10,
                            Credit = 15,
                            CreditBreakdown = new CreditBreakdown
                            {
                                Refund = 15
                            }
                        },
                        Status = RefundStatus.Ok,
                        Rules = RefundRules.QuarterOfCashOrHalfOfCredit
                    }
                };
            }
        }

        private static IEnumerable<object[]> DataFor1420(List<double> days)
        {
            foreach (var day in days)
            {
                yield return new object[] {
                    $"{day} days. Credits only. 25% credit",
                    day,
                    new[] {
                        new PaymentHistoryItem {
                            IsCredit = true,
                            Amount = 140,
                            PayMethodCode = "PSTK"
                        }
                    },
                    new EligibleForRefund
                    {
                        Credit = new EligibleAction
                        {
                            IsEligible = true,
                            Credit = 35,
                            CreditBreakdown = new CreditBreakdown
                            {
                                Refund = 35
                            }
                        },
                        Refund = new EligibleAction
                        {
                            IsEligible = false
                        },
                        Status = RefundStatus.Ok,
                        Rules = RefundRules.CreditOnly
                    }
                };
                yield return new object[] {
                    $"{day} days. Credits and cash. 25% credit",
                    day,
                    new[] {
                        new PaymentHistoryItem {
                            IsCredit = true,
                            Amount = 70,
                            PayMethodCode = "PSTK"
                        },
                        new PaymentHistoryItem {
                            IsCredit = false,
                            Amount = 70,
                        }
                    },
                    new EligibleForRefund
                    {
                        Credit = new EligibleAction
                        {
                            IsEligible = true,
                            Credit = 35,
                            CreditBreakdown = new CreditBreakdown
                            {
                                Refund = 35
                            }
                        },
                        Refund = new EligibleAction
                        {
                            IsEligible = false
                        },
                        Status = RefundStatus.Ok,
                        Rules = RefundRules.CreditOnly
                    }
                };
                yield return new object[] {
                    $"{day} days. Cash only. 25% credit",
                    day,
                    new[] {
                        new PaymentHistoryItem {
                            IsCredit = false,
                            Amount = 140,
                        }
                    },
                    new EligibleForRefund
                    {
                        Credit = new EligibleAction
                        {
                            IsEligible = true,
                            Credit = 35,
                            CreditBreakdown = new CreditBreakdown
                            {
                                Refund = 35
                            }
                        },
                        Refund = new EligibleAction
                        {
                            IsEligible = false
                        },
                        Status = RefundStatus.Ok,
                        Rules = RefundRules.CreditOnly
                    }
                };
            }
        }

        private static IEnumerable<object[]> DataFor013(List<double> days)
        {
            foreach (var day in days)
            {
                yield return new object[] {
                    $"{day} days. Disabled on site",
                    day,
                    new[] {
                        new PaymentHistoryItem {
                            IsCredit = true,
                            Amount = 140,
                            PayMethodCode = "PSTK"
                        }
                    },
                    new EligibleForRefund
                    {
                        Credit = new EligibleAction
                        {
                            IsEligible = false
                        },
                        Refund = new EligibleAction
                        {
                            IsEligible = false
                        },
                        Status = RefundStatus.DisabledOnSite,
                        Rules = RefundRules.NoRefund
                    }
                };
            }
        }
    }
}
