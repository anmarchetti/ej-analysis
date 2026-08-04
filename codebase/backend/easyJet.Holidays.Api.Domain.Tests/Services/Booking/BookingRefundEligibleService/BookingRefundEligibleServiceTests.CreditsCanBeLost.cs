using Castle.Components.DictionaryAdapter;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking.BookingRefundEligibleService
{
    public partial class BookingRefundEligibleServiceTests
    {
        [Theory]
        [MemberData(nameof(Data))]
        public async Task IsEligibleForFullRefund_CheckCreditBreakdown(BookingResponse booking, EligibleForRefund expected)
        {
            // Arrange
            var settings = BuildHappySettings();
            var sut = BuildService(settings, out _);
            _settingsServiceMock.Setup(x => x.GetCancelCreditSettings()).ReturnsAsync(CreateRegulations());

            // Act
            var res = await sut.Object.IsEligibleForFullRefund(booking);

            // Assert
            res.Should().BeEquivalentTo(expected);
        }

        public static IEnumerable<object[]> Data()
        {
            var refundForNotExpiredCase = new EligibleForRefund
            {
                Status = RefundStatus.Ok,
                Rules = RefundRules.Regular,
                Credit = new EligibleAction
                {
                    IsEligible = true,
                    Credit = 1000m,
                    CreditBreakdown = new CreditBreakdown
                    {
                        Goodwill = 120m,
                        Refund = 880m
                    }
                },
                Refund = new EligibleAction
                {
                    IsEligible = false,
                    Credit = 0m,
                    Cash = 0m
                }
            };

            var refundForExpiredCase = new EligibleForRefund
            {
                Status = RefundStatus.Ok,
                Rules = RefundRules.Regular,
                Credit = new EligibleAction
                {
                    IsEligible = true,
                    Credit = 1000m,
                    CreditBreakdown = new CreditBreakdown
                    {
                        Goodwill = 120m,
                        Refund = 880m
                    },
                    LostCreditsIfCancelled = ["Promotion - Staff credit 23-24 expires in the past"]
                },
                Refund = new EligibleAction
                {
                    IsEligible = false,
                    Credit = 0m,
                    Cash = 0m
                }
            };

            var refundForNotExpiredAndOneTimeUseCreditCase = new EligibleForRefund
            {
                Status = RefundStatus.Ok,
                Rules = RefundRules.Regular,
                Credit = new EligibleAction
                {
                    IsEligible = true,
                    Credit = 1000m,
                    CreditBreakdown = new CreditBreakdown
                    {
                        Goodwill = 120m,
                        Refund = 880m
                    }
                },
                Refund = new EligibleAction
                {
                    IsEligible = false,
                    Credit = 0m,
                    Cash = 0m
                }
            };

            var refundForNotExpiredAndOneTimeUseCreditWithGoodWillCreditAndPromoCreditCase = new EligibleForRefund
            {
                Status = RefundStatus.Ok,
                Rules = RefundRules.Regular,
                Credit = new EligibleAction
                {
                    IsEligible = true,
                    Credit = 1000m,
                    CreditBreakdown = new CreditBreakdown
                    {
                        Goodwill = 120m,
                        Refund = 700m,
                        Promo = 180m
                    }
                },
                Refund = new EligibleAction
                {
                    IsEligible = false,
                    Credit = 0m,
                    Cash = 0m
                }
            };

            var refundForNotExpiredAndOneTimeUseCreditWithGoodWillAndPromoAndGiftCardAndCashCase = new EligibleForRefund
            {
                Status = RefundStatus.Ok,
                Rules = RefundRules.Regular,
                Credit = new EligibleAction
                {
                    IsEligible = true,
                    Credit = 1000m,
                    CreditBreakdown = new CreditBreakdown
                    {
                        Goodwill = 120m,
                        Refund = 427.46m,
                        Promo = 180m,
                        GiftCard = 272.54m
                    }
                },
                Refund = new EligibleAction
                {
                    IsEligible = true,
                    Credit = 833.74m,
                    Cash = 166.26m,
                    CreditBreakdown = new CreditBreakdown
                    {
                        Goodwill = 120m,
                        Refund = 261.20m,
                        Promo = 180m,
                        GiftCard = 272.54m
                    }
                }
            };

            var refundForNotExpiredAndMoreOneTimeUseCreditWithGoodWillAndPromoAndGiftCardAndCashCase = new EligibleForRefund
            {
                Status = RefundStatus.Ok,
                Rules = RefundRules.Regular,
                Credit = new EligibleAction
                {
                    IsEligible = true,
                    Credit = 1000m,
                    CreditBreakdown = new CreditBreakdown
                    {
                        Goodwill = 120m,
                        Refund = 427.46m,
                        Promo = 180m,
                        GiftCard = 272.54m
                    }
                },
                Refund = new EligibleAction
                {
                    IsEligible = true,
                    Credit = 833.74m,
                    Cash = 166.26m,
                    CreditBreakdown = new CreditBreakdown
                    {
                        Goodwill = 120m,
                        Refund = 261.20m,
                        Promo = 180m,
                        GiftCard = 272.54m
                    }
                }
            };

            var paymentHistoryInFuture = new[]
            {
                        new PaymentHistoryItem
                        {
                            Amount = 1000m,
                            IsCredit = true,
                            PayMethodCode = "FrtExprPSTK"
                        }
            };

            var paymentHistoryInPast = new[]
            {
                        new PaymentHistoryItem
                        {
                            Amount = 1000m,
                            IsCredit = true,
                            PayMethodCode = "PstExpPSTK"
                        }
            };

            var onlyOneTimeUseAndOtherCredit = new[]
            {
                new PaymentHistoryItem { Amount = 120m, IsCredit = true, IsOneTimeUseCredit = true, PayMethodCode = "OTCI"},
                new PaymentHistoryItem { Amount = 880m, IsCredit = true, IsGoodWill = true, PayMethodCode = "FrtExprPSTK" }
            };

            var oneTimeUseWithGoodWillAndPromo = new[]
            {
                new PaymentHistoryItem { Amount = 120m, IsCredit = true, IsOneTimeUseCredit = true, PayMethodCode = "OTCI"},
                new PaymentHistoryItem { Amount = 700m, IsCredit = true, IsGoodWill = true, PayMethodCode = "GI" },
                new PaymentHistoryItem { Amount = 180m, IsCredit = true, IsPromoCredit = true, PayMethodCode = "PSTI" }
            };

            var oneTimeUseWithGoodWillAndPromoAndGiftCardAndCash = new[]
            {
                new PaymentHistoryItem { Amount = 120m, IsCredit = true, IsOneTimeUseCredit = true, PayMethodCode = "OTCI"},
                new PaymentHistoryItem { Amount = 261.20m, IsCredit = true, IsGoodWill = true, PayMethodCode = "GI" },
                new PaymentHistoryItem { Amount = 180m, IsCredit = true, IsPromoCredit = true, PayMethodCode = "PSTI" },
                new PaymentHistoryItem { Amount = 272.54m, IsCredit = true, IsGiftCardCredit = true, PayMethodCode = "GCI" },
                new PaymentHistoryItem { Amount = 166.26m, IsCredit = false }
            };

            var moreOneTimeUseWithGoodWillAndPromoAndGiftCardAndCash = new[]
            {
                new PaymentHistoryItem { Amount = 180m, IsCredit = true, IsOneTimeUseCredit = true, PayMethodCode = "OTCI"},
                new PaymentHistoryItem { Amount = 201.20m, IsCredit = true, IsGoodWill = true, PayMethodCode = "GI" },
                new PaymentHistoryItem { Amount = 180m, IsCredit = true, IsPromoCredit = true, PayMethodCode = "PSTI" },
                new PaymentHistoryItem { Amount = 272.54m, IsCredit = true, IsGiftCardCredit = true, PayMethodCode = "GCI" },
                new PaymentHistoryItem { Amount = 166.26m, IsCredit = false }
            };

            return new List<object[]>
            {
                //EJH-17438: New Credit Rules - Inform staff that credit will be lost
                //scenario 1: Try canceling your booking when the credits have expired -> should return the reasons in LostCreditsIfCancelled collection
                new object[] { CreateBookingWithCustomPaymentHistory(paymentHistoryInPast), refundForExpiredCase },
                //scenario 2: Try canceling your booking when the credits haven't yet expired -> should return null collection
                new object[] { CreateBookingWithCustomPaymentHistory(paymentHistoryInFuture), refundForNotExpiredCase },
                new object[] { CreateBookingWithCustomPaymentHistory(onlyOneTimeUseAndOtherCredit), refundForNotExpiredAndOneTimeUseCreditCase },
                new object[] { CreateBookingWithCustomPaymentHistory(oneTimeUseWithGoodWillAndPromo), refundForNotExpiredAndOneTimeUseCreditWithGoodWillCreditAndPromoCreditCase },
                new object[] { CreateBookingWithCustomPaymentHistory(oneTimeUseWithGoodWillAndPromoAndGiftCardAndCash), refundForNotExpiredAndOneTimeUseCreditWithGoodWillAndPromoAndGiftCardAndCashCase },
                new object[] { CreateBookingWithCustomPaymentHistory(moreOneTimeUseWithGoodWillAndPromoAndGiftCardAndCash), refundForNotExpiredAndMoreOneTimeUseCreditWithGoodWillAndPromoAndGiftCardAndCashCase }
            };
        }

        private static BookingResponse CreateBookingWithCustomPaymentHistory(PaymentHistoryItem[] paymentHistory)
        {
            return new BookingResponse
            {
                BookingStatus = "BOOKING",
                BookingReference = "0000",
                BookingDate = new DateTime(2022, 11, 05),
                Package = new BookingPackage
                {
                    Transport = new Transport
                    {
                        Routes = new List<Route> {
                            new Route {
                                Direction = Direction.Outbound,
                                DepDate =  DateTime.UtcNow.AddDays(300),
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
                    TotalPrice = 1000m,
                    PaymentHistory = paymentHistory
                },
                Guests = new EditableList<PersonWithDetails>()
                {
                    new()
                    {
                        Age = 21
                    },
                    new()
                    {
                        Age = 22
                    }
                }
            };
        }
    }
}