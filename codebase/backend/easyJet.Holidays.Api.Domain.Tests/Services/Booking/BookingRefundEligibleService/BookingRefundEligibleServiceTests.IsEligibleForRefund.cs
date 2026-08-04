using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Settings;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking.BookingRefundEligibleService
{
    public partial class BookingRefundEligibleServiceTests
    {
        [Theory]
        [MemberData(nameof(Over28DaysData))]
        public async Task IsEligibleForRefund_DepartureOver28Days(string because, PaymentHistoryItem[] payments, EligibleForRefund expected)
        {
            // Arrange
            var settings = BuildHappySettings();
            var sut = BuildService(settings, out var booking); // DepartureDate is Max (>28 days)

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
        [MemberData(nameof(IsEligibleForRefund_BasedOnDates_Data))]
        public async Task IsEligibleForRefund_BasedOnDatesAndRegulations(BookingResponse booking, CreditAndCashRefundSettings refundRegulations,
            EligibleForRefund expected)
        {
            // Arrange
            var settings = BuildHappySettings();
            var sut = BuildService(settings, out _);
            _settingsServiceMock.Setup(x => x.GetCancelCreditSettings()).ReturnsAsync(refundRegulations);

            // Act
            var res = await sut.Object.IsEligibleForFullRefund(booking);

            // Assert
            res.Should().BeEquivalentTo(expected);
        }

        public static IEnumerable<object[]> IsEligibleForRefund_BasedOnDates_Data()
        {
            var refundAllowed = new EligibleForRefund
            {
                Status = RefundStatus.Ok,
                Rules = RefundRules.Regular,
                Credit = new EligibleAction
                {
                    IsEligible = true,
                    Credit = 1000m,
                    CreditBreakdown = new CreditBreakdown { Goodwill = 120m, Refund = 880m }
                },
                Refund = new EligibleAction
                {
                    IsEligible = true,
                    Credit = 120m,
                    Cash = 880m,
                    CreditBreakdown = new CreditBreakdown { Goodwill = 120m },
                }
            };

            var onlyCreditRefundAllowed = new EligibleForRefund
            {
                Status = RefundStatus.Ok,
                Rules = RefundRules.CreditOnly,
                Credit = new EligibleAction
                {
                    IsEligible = true,
                    Credit = 1000m,
                    CreditBreakdown = new CreditBreakdown { Refund = 1000m }
                },
                Refund = new EligibleAction { IsEligible = false }
            };

            var refundForbidden = new EligibleForRefund
            {
                Status = RefundStatus.DisabledByRules,
                Rules = RefundRules.NoRefund,
                Credit = new EligibleAction { IsEligible = false },
                Refund = new EligibleAction { IsEligible = false },
            };

            return new List<object[]>
            {
                //EJH-16572: New Credit Rules - Change cancellation policy to apply from 60 days prior to departure
                //scenario 1: booked with current regulations, 60+ days until departure -> cancellation & refund are allowed
                new object[] { CreateBooking(bookingDate: new DateTime(2022, 11, 05), daysUntilDeparture: 300), CreateRegulations(), refundAllowed },
                new object[] { CreateBooking(bookingDate: new DateTime(2022, 11, 01), daysUntilDeparture: 60.1), CreateRegulations(), refundAllowed },
                //scenario 2: booked with current regulations, <60 days until departure -> cancellation & refund are forbidden
                new object[] { CreateBooking(bookingDate: new DateTime(2022, 11, 05), daysUntilDeparture: 59.9), CreateRegulations(), refundForbidden },
                new object[] { CreateBooking(bookingDate: new DateTime(2022, 11, 01), daysUntilDeparture: 4), CreateRegulations(), refundForbidden },
                //scenario 3: booked with previous regulations, 28+ days until departure -> cancellation & refund are allowed
                new object[] { CreateBooking(bookingDate: new DateTime(2022, 10, 31), daysUntilDeparture: 65), CreateRegulations(), refundAllowed },
                new object[] { CreateBooking(bookingDate: new DateTime(2022, 10, 20), daysUntilDeparture: 28.1), CreateRegulations(), refundAllowed },
                //scenario 4: booked with previous regulations, <28 days until departure -> cancellation & refund are forbidden
                new object[] { CreateBooking(bookingDate: new DateTime(2022, 10, 31), daysUntilDeparture: 27.9), CreateRegulations(), refundForbidden },
                new object[] { CreateBooking(bookingDate: new DateTime(2022, 08, 05), daysUntilDeparture: 1), CreateRegulations(), refundForbidden },
                //scenario 5: booked with current regulations, <60 days until departure, destination credit rules apply -> only credit refund is allowed
                new object[] { CreateBooking(bookingDate: new DateTime(2023, 01, 17), daysUntilDeparture: 36), CreateRegulations(35, 55), onlyCreditRefundAllowed },
                new object[] { CreateBooking(bookingDate: new DateTime(2022, 11, 01), daysUntilDeparture: 54), CreateRegulations(35, 55), onlyCreditRefundAllowed },
                //scenario 5: booked with current regulations, <60 days until departure,
                //destination credit rules don't apply (booking departure date is outside of credit rule) -> cancellation & refund are forbidden
                new object[] { CreateBooking(bookingDate: new DateTime(2023, 01, 17), daysUntilDeparture: 34), CreateRegulations(35, 55), refundForbidden },
                new object[] { CreateBooking(bookingDate: new DateTime(2022, 11, 01), daysUntilDeparture: 56), CreateRegulations(35, 55), refundForbidden },
                //scenario 6: booked with previous regulations, <28 days until departure, destination credit rules apply -> only credit refund is allowed
                new object[] { CreateBooking(bookingDate: new DateTime(2022, 01, 17), daysUntilDeparture: 11), CreateRegulations(10, 13), onlyCreditRefundAllowed },
                new object[] { CreateBooking(bookingDate: new DateTime(2022, 10, 31), daysUntilDeparture: 12), CreateRegulations(10, 13), onlyCreditRefundAllowed },
                //scenario 6: booked with current regulations, <28 days until departure,
                //destination credit rules don't apply (booking departure date is outside of credit rule) -> cancellation & refund are forbidden
                new object[] { CreateBooking(bookingDate: new DateTime(2022, 01, 17), daysUntilDeparture: 9), CreateRegulations(10, 13), refundForbidden },
                new object[] { CreateBooking(bookingDate: new DateTime(2022, 10, 31), daysUntilDeparture: 14), CreateRegulations(10, 13), refundForbidden },
            };
        }

        private static BookingResponse CreateBooking(DateTime bookingDate, double daysUntilDeparture)
        {
            return new BookingResponse
            {
                BookingStatus = "BOOKING",
                BookingReference = "0000",
                BookingDate = bookingDate,
                Package = new BookingPackage
                {
                    Transport = new Transport
                    {
                        Routes = new List<Route> {
                            new Route {
                                Direction = Direction.Outbound,
                                DepDate =  DateTime.UtcNow.AddDays(daysUntilDeparture),
                                ArrPt = "BCN"
                            }
                        }
                    }
                },
                CustomerDetails = new CustomerDetails
                {
                    Email = "c@ej.com"
                },
                PaymentInfo = new PriceInfo
                {
                    DepositPrice = 120m,
                    TotalPrice = 1000m,
                    PaymentHistory = new PaymentHistoryItem[]
                    {
                        new PaymentHistoryItem
                        {
                            Amount = 1000m
                        }
                    }
                }
            };
        }

        private static CreditAndCashRefundSettings CreateRegulations(double daysBeforeDepartureFrom = default, double daysBeforeDepartureTo = default)
        {
            var regulations = new CreditAndCashRefundSettings
            {
                CurrentRulesApplyForHolidaysBookedFrom = new DateTime(2022, 11, 01),
                CurrentRulesAllowRefundsForXOrMoreDaysBeforeDeparture = 60,
                PreviousRulesAllowRefundsForXOrMoreDaysBeforeDeparture = 28,
            };

            if (daysBeforeDepartureFrom != default || daysBeforeDepartureTo != default)
            {
                regulations.CreditOnlyRules = new List<CreditOnlyRefundRule>
                {
                    new CreditOnlyRefundRule
                    {
                        Active = new()
                        {
                            Start = DateTime.UtcNow.AddDays(-1),
                            End = DateTime.UtcNow.AddDays(1)
                        },
                        BookingDepartureDateFrom = DateTime.UtcNow.AddDays(daysBeforeDepartureFrom),
                        BookingDepartureDateTo = DateTime.UtcNow.AddDays(daysBeforeDepartureTo),
                        DestinationAirports = new [] { "BCN" },
                    }
                };
            }

            return regulations;
        }

        public static IEnumerable<object[]> Over28DaysData()
        {
            // Deposit is 120
            yield return new object[] {
                "Credit payments only",
                new[] {
                    new PaymentHistoryItem {
                        IsCredit = true,
                        Amount = 100,
                        PayMethodCode = "PSTK"
                    },
                    new PaymentHistoryItem {
                        IsCredit = true,
                        Amount = -10,
                        PayMethodCode = "PSTK"
                    },
                    new PaymentHistoryItem {
                        IsCredit = true,
                        Amount = 50,
                        PayMethodCode = "PSTK"
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
                            Goodwill = 120,
                            Refund = 20
                        }
                    },
                    Refund = new EligibleAction
                    {
                        IsEligible = false
                    },
                    Status = RefundStatus.Ok
                }
            };

            yield return new object[] {
                "Cash, only deposit",
                new[] {
                    new PaymentHistoryItem {
                        Amount = 120,
                    }
                },
                new EligibleForRefund
                {
                    Credit = new EligibleAction
                    {
                        IsEligible = true,
                        Credit = 120,
                        CreditBreakdown = new CreditBreakdown
                        {
                            Goodwill = 120,
                        }
                    },
                    Refund = new EligibleAction
                    {
                        IsEligible = false
                    },
                    Status = RefundStatus.Ok
                }
            };

            yield return new object[] {
                "Cash only",
                new[] {
                    new PaymentHistoryItem {
                        Amount = 120,
                    },
                    new PaymentHistoryItem {
                        Amount = 50,
                    }
                },
                new EligibleForRefund
                {
                    Credit = new EligibleAction
                    {
                        IsEligible = true,
                        Credit = 170,
                        CreditBreakdown = new CreditBreakdown
                        {
                            Goodwill = 120,
                            Refund = 50
                        }
                    },
                    Refund = new EligibleAction
                    {
                        IsEligible = true,
                        Cash = 50,
                        Credit = 120,
                        CreditBreakdown = new CreditBreakdown
                        {
                            Goodwill = 120,
                        }
                    },
                    Status = RefundStatus.Ok
                }
            };

            yield return new object[] {
                "Cash and credit",
                new[] {
                    new PaymentHistoryItem {
                        IsCredit = true,
                        Amount = 100,
                        PayMethodCode = "PSTK"
                    },
                    new PaymentHistoryItem {
                        Amount = 100,
                    },
                    new PaymentHistoryItem {
                        Amount = 50,
                    }
                },
                new EligibleForRefund
                {
                    Credit = new EligibleAction
                    {
                        IsEligible = true,
                        Credit = 250,
                        CreditBreakdown = new CreditBreakdown
                        {
                            Goodwill = 120,
                            Refund = 130
                        }
                    },
                    Refund = new EligibleAction
                    {
                        IsEligible = true,
                        Cash = 130,
                        Credit = 120,
                        CreditBreakdown = new CreditBreakdown
                        {
                            Goodwill = 120
                        }
                    },
                    Status = RefundStatus.Ok
                }
            };

            yield return new object[] {
                "Deposit paid with cash and credit",
                new[] {
                    new PaymentHistoryItem {
                        IsCredit = false,
                        Amount = 70,
                    },
                    new PaymentHistoryItem {
                        IsCredit = true,
                        Amount = 50,
                        PayMethodCode = "PSTK"
                    },
                    new PaymentHistoryItem {
                        IsCredit = true,
                        Amount = 97.98m,
                        PayMethodCode = "PSTK"
                    },
                    new PaymentHistoryItem {
                        IsCredit = true,
                        Amount = 2.02m,
                        PayMethodCode = "PSTK"
                    },
                    new PaymentHistoryItem {
                        IsCredit = false,
                        Amount = 200,
                    },
                    new PaymentHistoryItem {
                        IsCredit = false,
                        Amount = 861.44m,
                    }
                },
                new EligibleForRefund
                {
                    Credit = new EligibleAction
                    {
                        IsEligible = true,
                        Credit = 1281.44m,
                        CreditBreakdown = new CreditBreakdown
                        {
                            Goodwill = 120,
                            Refund = 1161.44m
                        }
                    },
                    Refund = new EligibleAction
                    {
                        IsEligible = true,
                        Cash = 1061.44m,
                        Credit = 220,
                        CreditBreakdown = new CreditBreakdown
                        {
                            Goodwill = 120,
                            Refund = 100
                        }
                    },
                    Status = RefundStatus.Ok
                }
            };

            yield return new object[] {
                "Deposit paid with cash and credit",
                new[] {
                    new PaymentHistoryItem {
                        IsCredit = false,
                        Amount = 700,
                    },
                    new PaymentHistoryItem {
                        IsCredit = true,
                        Amount = -160,
                        PayMethodCode = "PSTK"
                    }
                },
                new EligibleForRefund
                {
                    Credit = new EligibleAction
                    {
                        IsEligible = true,
                        Credit = 540m,
                        CreditBreakdown = new CreditBreakdown
                        {
                            Goodwill = 120m,
                            Refund = 420m
                        }
                    },
                    Refund = new EligibleAction
                    {
                        IsEligible = true,
                        Cash = 420m,
                        Credit = 120m,
                        CreditBreakdown = new CreditBreakdown
                        {
                            Goodwill = 120m
                        }
                    },
                    Status = RefundStatus.Ok
                }
            };
        }
    }
}