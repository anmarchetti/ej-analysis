using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking.BookingRefundEligibleService
{
    public partial class BookingRefundEligibleServiceTests
    {
        [Theory]
        [MemberData(nameof(BuildCreditBreakdownTestData))]
        public async Task BuildCreditBreakdown(string because, double departureDays, PaymentHistoryItem[] payments, /*, RefundRules refundRules, EligibleAction action,*/ EligibleForRefund expected)
        {
            if (because != "Full balance paid. Deposit with cash, then cash, promo & giftcard") return;
            // Arrange
            var settings = BuildHappySettings();
            var sut = BuildService(settings, out var booking);
            var outboundRoute = booking?.Package?.Transport?.Routes?.FirstOrDefault(r => r.Direction == Direction.Outbound);
            outboundRoute.DepDate = DateTime.UtcNow.AddDays(departureDays);

            booking.PaymentInfo = new PriceInfo()
            {
                DepositPrice = 120,
                TotalPrice = 1000,
                PaymentHistory = payments
            };

            // Act
            var actual = await sut.Object.IsEligibleForFullRefund(booking);

            // Assert
            actual.Should().BeEquivalentTo(expected, because);
        }

        public static IEnumerable<object[]> BuildCreditBreakdownTestData()
        {
            foreach (var x in BuildCreditBreakdownTestDataDeposit()) yield return x;

            foreach (var x in BuildCreditBreakdownTestDataSomeBalance()) yield return x;

            foreach (var x in BuildCreditBreakdownTestDataFullBalance()) yield return x;

            foreach (var x in BuildCreditBreakdown25Days()) yield return x;
        }

        public static IEnumerable<object[]> BuildCreditBreakdownTestDataDeposit()
        {
            // Deposit is 120

            //=================Deposit only paid
            yield return new object[]
            {
                "Deposit only paid. Cash",
                40,
                new[]
                {
                    new PaymentHistoryItem
                    {
                        Amount = 120,
                    }
                },
                new EligibleForRefund
                {
                    Credit = new EligibleAction()
                    {
                        Credit = 120,
                        CreditBreakdown = new CreditBreakdown
                        {
                            Goodwill = 120,
                        },
                        IsEligible = true,
                    },
                    Refund = new EligibleAction()
                    {
                        IsEligible = false,
                    },
                    Status = RefundStatus.Ok,
                    Rules = RefundRules.Regular
                }
            };
            yield return new object[]
            {
                "Deposit only paid. Gift card",
                40,
                new[]
                {
                    new PaymentHistoryItem
                    {
                        Amount = 120,
                        IsCredit = true,
                        IsGiftCardCredit = true
                    }
                },
                new EligibleForRefund
                {
                    Credit = new EligibleAction()
                    {
                        Credit = 120,
                        CreditBreakdown = new CreditBreakdown
                        {
                            Goodwill = 120,
                        },
                        IsEligible = true,
                    },
                    Refund = new EligibleAction()
                    {
                        IsEligible = false,
                    },
                    Status = RefundStatus.Ok,
                    Rules = RefundRules.Regular
                }
            };
            yield return new object[]
            {
                "Deposit only paid. Gift card and cash",
                40,
                new[]
                {
                    new PaymentHistoryItem
                    {
                        Amount = 60,
                        IsCredit = true,
                        IsGiftCardCredit = true
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 60
                    }
                },
                new EligibleForRefund
                {
                    Credit = new EligibleAction()
                    {
                        Credit = 120,
                        CreditBreakdown = new CreditBreakdown
                        {
                            Goodwill = 120,
                        },
                        IsEligible = true,
                    },
                    Refund = new EligibleAction()
                    {
                        IsEligible = false,
                    },
                    Status = RefundStatus.Ok,
                    Rules = RefundRules.Regular
                }
            };

            yield return new object[]
            {
                "Deposit only paid. Promo and cash",
                40,
                new[]
                {
                    new PaymentHistoryItem
                    {
                        Amount = 60,
                        IsCredit = true,
                        IsPromoCredit = true
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 60
                    }
                },
                new EligibleForRefund
                {
                    Credit = new EligibleAction()
                    {
                        Credit = 120,
                        CreditBreakdown = new CreditBreakdown
                        {
                            Promo = 60,
                            Goodwill = 60,
                        },
                        IsEligible = true,
                    },
                    Refund = new EligibleAction()
                    {
                        IsEligible = false,
                    },
                    Status = RefundStatus.Ok,
                    Rules = RefundRules.Regular
                }
            };
        }

        public static IEnumerable<object[]> BuildCreditBreakdownTestDataSomeBalance()
        {
            // Deposit is 120

            // =========== Some of balance paid off
            yield return new object[]
            {
                "Some of balance paid off. Promo and cash",
                40,
                new[]
                {
                    new PaymentHistoryItem
                    {
                        Amount = 60,
                        IsCredit = true,
                        IsPromoCredit = true
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 200
                    }
                },
                new EligibleForRefund
                {
                    Credit = new EligibleAction()
                    {
                        Credit = 260,
                        CreditBreakdown = new CreditBreakdown
                        {
                            Promo = 60,
                            Goodwill = 120,
                            Refund = 80
                        },
                        IsEligible = true,
                    },
                    Refund = new EligibleAction()
                    {
                        Credit = 180,
                        Cash = 80,
                        CreditBreakdown = new CreditBreakdown
                        {
                            Promo = 60,
                            Goodwill = 120
                        },
                        IsEligible = true,
                    },
                    Status = RefundStatus.Ok,
                    Rules = RefundRules.Regular
                }
            };
            yield return new object[]
            {
                "Some of balance paid off. Promo and cash(refund)",
                40,
                new[]
                {
                    new PaymentHistoryItem
                    {
                        Amount = 60,
                        IsCredit = true,
                        IsPromoCredit = true
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 100,
                        IsCredit = true
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 100
                    }
                },
                new EligibleForRefund
                {
                    Credit = new EligibleAction()
                    {
                        Credit = 260,
                        CreditBreakdown = new CreditBreakdown
                        {
                            Promo = 60,
                            Goodwill = 120,
                            Refund = 80
                        },
                        IsEligible = true,
                    },
                    Refund = new EligibleAction()
                    {
                        Credit = 180,
                        Cash = 80,
                        CreditBreakdown = new CreditBreakdown
                        {
                            Promo = 60,
                            Goodwill = 120
                        },
                        IsEligible = true,
                    },
                    Status = RefundStatus.Ok,
                    Rules = RefundRules.Regular
                }
            };

            yield return new object[]
            {
                "Some of balance paid off. Deposit paid with promo & gift card",
                40,
                new[]
                {
                    new PaymentHistoryItem
                    {
                        Amount = 50, // promo
                        IsCredit = true,
                        IsPromoCredit = true
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 70, // gift card
                        IsCredit = true,
                        IsGiftCardCredit = true
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 5, // goodwill
                        IsCredit = true
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 45 // cash
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 80, // gift card
                        IsCredit = true,
                        IsGiftCardCredit = true
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 20 // cash
                    }
                },
                new EligibleForRefund
                {
                    Credit = new EligibleAction()
                    {
                        Credit = 270,
                        CreditBreakdown = new CreditBreakdown
                        {
                            Promo = 50,
                            Goodwill = 120,
                            GiftCard = 35,
                            Refund = 65
                        },
                        IsEligible = true,
                    },
                    Refund = new EligibleAction()
                    {
                        Credit = 205,
                        Cash = 65,
                        CreditBreakdown = new CreditBreakdown
                        {
                            Promo = 50,
                            Goodwill = 120,
                            GiftCard = 35
                        },
                        IsEligible = true,
                    },
                    Status = RefundStatus.Ok,
                    Rules = RefundRules.Regular
                }
            };
        }

        public static IEnumerable<object[]> BuildCreditBreakdownTestDataFullBalance()
        {
            // Deposit is 120

            //========Full balance paid
            yield return new object[]
            {
                "Full balance paid",
                40,
                new[]
                {
                    new PaymentHistoryItem
                    {
                        Amount = 60,
                        IsCredit = true,
                        IsPromoCredit = true
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 40,
                        IsCredit = true
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 200,
                        IsCredit = true,
                        IsGiftCardCredit = true
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 700
                    }
                },
                new EligibleForRefund
                {
                    Credit = new EligibleAction()
                    {
                        Credit = 1000,
                        CreditBreakdown = new CreditBreakdown
                        {
                            Promo = 60,
                            Goodwill = 120,
                            GiftCard = 120,
                            Refund = 700
                        },
                        IsEligible = true,
                    },
                    Refund = new EligibleAction()
                    {
                        Credit = 300,
                        Cash = 700,
                        CreditBreakdown = new CreditBreakdown
                        {
                            Promo = 60,
                            Goodwill = 120,
                            GiftCard = 120,
                        },
                        IsEligible = true,
                    },
                    Status = RefundStatus.Ok,
                    Rules = RefundRules.Regular
                }
            };

            yield return new object[]
            {
                "Full balance paid #2",
                40,
                new[]
                {
                    new PaymentHistoryItem
                    {
                        Amount = 60, // promo
                        IsCredit = true,
                        IsPromoCredit = true
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 40, // credit
                        IsCredit = true
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 50, // giftcard
                        IsCredit = true,
                        IsGiftCardCredit = true
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 850 // cash
                    }
                },
                new EligibleForRefund
                {
                    Credit = new EligibleAction()
                    {
                        Credit = 1000,
                        CreditBreakdown = new CreditBreakdown
                        {
                            Promo = 60,
                            Goodwill = 120,
                            Refund = 820
                        },
                        IsEligible = true,
                    },
                    Refund = new EligibleAction()
                    {
                        Credit = 180,
                        Cash = 820,
                        CreditBreakdown = new CreditBreakdown
                        {
                            Promo = 60,
                            Goodwill = 120
                        },
                        IsEligible = true,
                    },
                    Status = RefundStatus.Ok,
                    Rules = RefundRules.Regular
                }
            };


            yield return new object[]
            {
                "Fully paid #3 with cash, giftcard and promo(payments order). Should take deposit from cache first",
                40,
                new[]
                {
                    new PaymentHistoryItem
                    {
                        Amount = 255.86m, // cash
                        IsCredit = false,
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 200, // giftcard
                        IsCredit = true,
                        IsGiftCardCredit = true
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 50, // promo
                        IsCredit = true,
                        IsPromoCredit = true
                    },
                },
                new EligibleForRefund
                {
                    Credit = new EligibleAction
                    {
                        IsEligible = true,
                        Credit = 505.86m,
                        CreditBreakdown = new CreditBreakdown
                        {
                            Promo = 50,
                            Goodwill = 120,
                            GiftCard = 80,
                            Refund = 255.86m
                        }
                    },
                    Refund = new EligibleAction
                    {
                        IsEligible = true,
                        Cash = 135.86m,
                        Credit = 370,
                        CreditBreakdown = new CreditBreakdown
                        {
                            Promo = 50,
                            Goodwill = 120,
                            GiftCard = 200
                        }
                    },
                    Status = RefundStatus.Ok
                }
            };

            yield return new object[]
            {
                "Fully paid #4 with giftcard, promo and cache(payments order). Should take deposit from giftcard",
                40,
                new[]
                {
                    new PaymentHistoryItem
                    {
                        Amount = 200, // giftcard
                        IsCredit = true,
                        IsGiftCardCredit = true
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 50, // promo
                        IsCredit = true,
                        IsPromoCredit = true
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 255.86m, // cash
                        IsCredit = false,
                    },
                },
                new EligibleForRefund
                {
                    Credit = new EligibleAction
                    {
                        IsEligible = true,
                        Credit = 505.86m,
                        CreditBreakdown = new CreditBreakdown
                        {
                            Promo = 50,
                            Goodwill = 120,
                            GiftCard = 80,
                            Refund = 255.86m
                        }
                    },
                    Refund = new EligibleAction
                    {
                        IsEligible = true,
                        Cash = 255.86m,
                        Credit = 250,
                        CreditBreakdown = new CreditBreakdown
                        {
                            Promo = 50,
                            Goodwill = 120,
                            GiftCard = 80
                        }
                    },
                    Status = RefundStatus.Ok
                }
            };

            yield return new object[]
           {
                "Full balance paid. Deposit with cash(goes to goodwill), then cash, promo & giftcard",
                40,
                new[]
                {
                    new PaymentHistoryItem
                    {
                        Amount = 120, // cash
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 50, //promo
                        IsCredit = true,
                        IsPromoCredit = true,
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 100, // cash
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 10, // goodwill
                        IsCredit = true,
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 90, // giftcard
                        IsCredit = true,
                        IsGiftCardCredit = true
                    }
                },
                new EligibleForRefund
                {
                    Credit = new EligibleAction()
                    {
                        Credit = 370,
                        CreditBreakdown = new CreditBreakdown
                        {
                            Promo = 50,
                            Goodwill = 120,
                            Refund = 200
                        },
                        IsEligible = true,
                    },
                    Refund = new EligibleAction()
                    {
                        Credit = 270,
                        Cash = 100,
                        CreditBreakdown = new CreditBreakdown
                        {
                            Promo = 50,
                            Goodwill = 120,
                            Refund = 10,
                            GiftCard = 90
                        },
                        IsEligible = true,
                    },
                    Status = RefundStatus.Ok,
                    Rules = RefundRules.Regular
                }
           };
        }

        public static IEnumerable<object[]> BuildCreditBreakdown25Days()
        {
            // Deposit is 120
            // at 25 days, 50% credit or 25% cash 

            //========Full balance paid
            yield return new object[]
            {
                "Full balance paid. Cancelled at 25 days.",
                25,
                new[]
                {
                    new PaymentHistoryItem
                    {
                        Amount = 60,
                        IsCredit = true,
                        IsPromoCredit = true
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 40,
                        IsCredit = true
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 200,
                        IsCredit = true,
                        IsGiftCardCredit = true
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 700
                    }
                },
                new EligibleForRefund
                {
                    Credit = new EligibleAction()
                    {
                        Credit = 500,
                        CreditBreakdown = new CreditBreakdown
                        {
                            Refund = 500 // drawn from the cash balance
                        },
                        IsEligible = true,
                    },
                    Refund = new EligibleAction()
                    {
                        Cash = 250,
                        CreditBreakdown = new CreditBreakdown(),
                        IsEligible = true,
                    },
                    Status = RefundStatus.Ok,
                    Rules = RefundRules.QuarterOfCashOrHalfOfCredit
                }
            };

            yield return new object[]
            {
                "Full balance paid. Cancelled at 25 days #2",
                25,
                new[]
                {
                    new PaymentHistoryItem
                    {
                        Amount = 60,
                        IsCredit = true,
                        IsPromoCredit = true
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 540,
                        IsCredit = true
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 200,
                        IsCredit = true,
                        IsGiftCardCredit = true
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 200
                    }
                },
                new EligibleForRefund
                {
                    Credit = new EligibleAction()
                    {
                        Credit = 500,
                        CreditBreakdown = new CreditBreakdown
                        {
                            Refund = 300, // drawn from the cash balance (200)
                            GiftCard = 200
                        },
                        IsEligible = true,
                    },
                    Refund = new EligibleAction()
                    {
                        Cash = 200,
                        Credit = 50,
                        CreditBreakdown = new CreditBreakdown
                        {
                            GiftCard = 50
                        },
                        IsEligible = true,
                    },
                    Status = RefundStatus.Ok,
                    Rules = RefundRules.QuarterOfCashOrHalfOfCredit
                }
            };

            yield return new object[]
            {
                "Full balance paid. Cancelled at 25 days #2",
                25,
                new[]
                {
                    new PaymentHistoryItem
                    {
                        Amount = 60,
                        IsCredit = true,
                        IsPromoCredit = true
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 140,
                        IsCredit = true
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 600,
                        IsCredit = true,
                        IsGiftCardCredit = true
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 200
                    }
                },
                new EligibleForRefund
                {
                    Credit = new EligibleAction()
                    {
                        Credit = 500,
                        CreditBreakdown = new CreditBreakdown
                        {
                            Refund = 200, // drawn from the cash balance (200)
                            GiftCard = 300
                        },
                        IsEligible = true,
                    },
                    Refund = new EligibleAction()
                    {
                        Cash = 200,
                        Credit = 50,
                        CreditBreakdown = new CreditBreakdown
                        {
                            GiftCard = 50
                        },
                        IsEligible = true,
                    },
                    Status = RefundStatus.Ok,
                    Rules = RefundRules.QuarterOfCashOrHalfOfCredit
                }
            };
        }
    }
}