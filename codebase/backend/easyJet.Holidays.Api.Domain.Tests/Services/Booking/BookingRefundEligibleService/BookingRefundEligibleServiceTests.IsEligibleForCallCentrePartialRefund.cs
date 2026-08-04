using easyJet.Holidays.Api.Domain.Data.Booking;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking.BookingRefundEligibleService
{
    public partial class BookingRefundEligibleServiceTests
    {
        [Theory]
        [MemberData(nameof(IsEligibleForCallCentrePartialRefund_TestData))]
        public async Task IsEligibleForCallCentrePartialRefund(PaymentHistoryItem[] allBookingPayments, PaymentHistoryItem refundPayment,
            decimal amountToRefund, EligibleForRefund expected)
        {
            // Arrange
            var settings = BuildHappySettings();
            var sut = BuildService(settings, out var booking);
            booking.PaymentInfo.PaymentHistory = allBookingPayments;
            var customerDetails = new Domain.Data.Authentication.CustomerDetails() { Email = "c@ej.com" };

            // Act
            var actual = await sut.Object.IsEligibleForCallCentrePartialRefund(booking, refundPayment, customerDetails, amountToRefund);

            // Assert
            actual.Should().BeEquivalentTo(expected);
        }

        public static IEnumerable<object[]> IsEligibleForCallCentrePartialRefund_TestData()
        {
            var allTestCases = new List<object[]>();

            //when no refunds were issued whole payment amount is available for refund
            var booking1 = new[]
            {
                new PaymentHistoryItem { Amount = 200, PayMethodCode = "MC" }, //card payment
                new PaymentHistoryItem { Amount = 100, PayMethodCode = "CR", IsCredit = true },
                new PaymentHistoryItem { Amount = 120, PayMethodCode = "GR", IsGoodWill = true },
                new PaymentHistoryItem { Amount = 100, PayMethodCode = "GCR", IsGiftCardCredit = true },
                new PaymentHistoryItem { Amount = 80, PayMethodCode = "PSTR", IsPromoCredit = true}
            };

            allTestCases.Add(new object[] { booking1, booking1[0], 200m, CreditRefundAllowed(200m, new CreditBreakdown { Refund = 200m }) });
            allTestCases.Add(new object[] { booking1, booking1[0], 201m, CreditRefundForbidden() });
            allTestCases.Add(new object[] { booking1, booking1[1], 100m, CreditRefundAllowed(100m, new CreditBreakdown { Refund = 100m }) });
            allTestCases.Add(new object[] { booking1, booking1[1], 101m, CreditRefundForbidden() });
            allTestCases.Add(new object[] { booking1, booking1[2], 120m, CreditRefundAllowed(120m, new CreditBreakdown { Goodwill = 120m }) });
            allTestCases.Add(new object[] { booking1, booking1[2], 121m, CreditRefundForbidden() });
            allTestCases.Add(new object[] { booking1, booking1[3], 100m, CreditRefundAllowed(100m, new CreditBreakdown { GiftCard = 100m }) });
            allTestCases.Add(new object[] { booking1, booking1[3], 101m, CreditRefundForbidden() });
            allTestCases.Add(new object[] { booking1, booking1[4], 80m, CreditRefundAllowed(80m, new CreditBreakdown { Promo = 80m }) });
            allTestCases.Add(new object[] { booking1, booking1[4], 81m, CreditRefundForbidden() });

            //when cash, credit, goodwill or giftcard were used, refund is limited to min(paymentAmount, sumOfAllPaymentsForThisType)
            //with cash and credit treated as same type
            var booking2 = new[]
            {
                new PaymentHistoryItem { Amount = 800, PayMethodCode = "MC" }, //card payment
                new PaymentHistoryItem { Amount = 200, PayMethodCode = "CR", IsCredit = true }, //credit redeemed
                new PaymentHistoryItem { Amount = -100, PayMethodCode = "CI", IsCredit = true }, //credit issued
                new PaymentHistoryItem { Amount = 120, PayMethodCode = "GR", IsGoodWill = true }, //goodwill redeemed
                new PaymentHistoryItem { Amount = -60, PayMethodCode = "GI", IsGoodWill = true }, //goowdill issued
                new PaymentHistoryItem { Amount = 100, PayMethodCode = "GCR", IsGiftCardCredit = true }, //gift card redeemed
                new PaymentHistoryItem { Amount = -20, PayMethodCode = "GCI", IsGiftCardCredit = true }, //gift card issued
            };

            allTestCases.Add(new object[] { booking2, booking2[0], 800m, CreditRefundAllowed(800m, new CreditBreakdown { Refund = 800m }) });
            allTestCases.Add(new object[] { booking2, booking2[0], 801m, CreditRefundForbidden() });
            allTestCases.Add(new object[] { booking2, booking2[1], 200m, CreditRefundAllowed(200m, new CreditBreakdown { Refund = 200m }) });
            allTestCases.Add(new object[] { booking2, booking2[1], 201m, CreditRefundForbidden() });
            allTestCases.Add(new object[] { booking2, booking2[2], 1m, CreditRefundForbidden() });
            allTestCases.Add(new object[] { booking2, booking2[3], 60m, CreditRefundAllowed(60m, new CreditBreakdown { Goodwill = 60m }) });
            allTestCases.Add(new object[] { booking2, booking2[3], 61m, CreditRefundForbidden() });
            allTestCases.Add(new object[] { booking2, booking2[4], 1m, CreditRefundForbidden() });
            allTestCases.Add(new object[] { booking2, booking2[5], 80m, CreditRefundAllowed(80m, new CreditBreakdown { GiftCard = 80m }) });
            allTestCases.Add(new object[] { booking2, booking2[5], 81m, CreditRefundForbidden() });
            allTestCases.Add(new object[] { booking2, booking2[6], 1m, CreditRefundForbidden() });

            //when promo credit were used, refund is limited to min(paymentAmount, sumOfAllPaymentsForThisTypePromoType)
            var booking3 = new[]
            {
                new PaymentHistoryItem { Amount = 800, PayMethodCode = "MC" }, //card payment
                new PaymentHistoryItem { Amount = 200, PayMethodCode = "PSTR", IsPromoCredit = true}, //staff credit redeemed
                new PaymentHistoryItem { Amount = -100, PayMethodCode = "PSTI", IsPromoCredit = true}, //staff credit refunded
                new PaymentHistoryItem { Amount = 400, PayMethodCode = "PSTK", IsPromoCredit = true}, //staff credit 23-24 redeemed
                new PaymentHistoryItem { Amount = -100, PayMethodCode = "PSTJ", IsPromoCredit = true}, //staff credit 23-24 refunded
            };

            allTestCases.Add(new object[] { booking3, booking3[1], 100m, CreditRefundAllowed(100m, new CreditBreakdown { Promo = 100m }) });
            allTestCases.Add(new object[] { booking3, booking3[1], 101m, CreditRefundForbidden() });
            allTestCases.Add(new object[] { booking3, booking3[2], 1m, CreditRefundForbidden() });
            allTestCases.Add(new object[] { booking3, booking3[3], 300m, CreditRefundAllowed(300m, new CreditBreakdown { Promo = 300m }) });
            allTestCases.Add(new object[] { booking3, booking3[3], 301m, CreditRefundForbidden() });
            allTestCases.Add(new object[] { booking3, booking3[4], 1m, CreditRefundForbidden() });

            return allTestCases;
        }

        private static EligibleForRefund CreditRefundAllowed(decimal credit, CreditBreakdown breakdown)
        {
            return new EligibleForRefund
            {
                Credit = new EligibleAction
                {
                    IsEligible = true,
                    Cash = 0,
                    Credit = credit,
                    CreditBreakdown = breakdown
                },
                Refund = new EligibleAction
                {
                    IsEligible = false
                },
                Rules = RefundRules.PartialRefund,
                Status = RefundStatus.Ok
            };
        }

        private static EligibleForRefund CreditRefundForbidden()
        {
            return new EligibleForRefund
            {
                Credit = new EligibleAction
                {
                    IsEligible = false
                },
                Refund = new EligibleAction
                {
                    IsEligible = false
                },
                Rules = RefundRules.NoRefund,
                Status = RefundStatus.DisabledByRules,
            };
        }
    }
}
