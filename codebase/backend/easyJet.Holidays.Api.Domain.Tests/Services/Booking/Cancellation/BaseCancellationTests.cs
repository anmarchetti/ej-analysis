using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking.Cancellation
{
    public abstract class BaseCancellationTests
    {
        protected static PaymentHistoryItem CashPayment(decimal amount) => new() { Amount = amount, PaymentDate = DateTime.UtcNow };

        protected static PaymentHistoryItem OneTimeUseCreditPayment(decimal amount, string transNo = null) =>
            new() { Amount = amount, IsCredit = true, IsOneTimeUseCredit = true, PaymentDate = DateTime.UtcNow, TransNo = transNo};

        protected static PaymentHistoryItem GoodWillPayment(decimal amount, string transNo = null) =>
            new() { Amount = amount, IsCredit = true, IsGoodWill = true, PaymentDate = DateTime.UtcNow, TransNo = transNo };

        protected static PaymentHistoryItem PromoCreditPayment(decimal amount, string payMethodCode = null, string transNo = null) =>
            new() { Amount = amount, IsCredit = true, IsPromoCredit = true, PaymentDate = DateTime.UtcNow, PayMethodCode = payMethodCode, TransNo = transNo};

        protected static PaymentHistoryItem GiftCardCreditPayment(decimal amount, string transNo = null) =>
            new() { Amount = amount, IsCredit = true, IsGiftCardCredit = true, PaymentDate = DateTime.UtcNow, TransNo = transNo };
        
        protected static PaymentHistoryItem RefundCreditPayment(decimal amount, string transNo = null) =>
            new() { Amount = amount, IsCredit = true, PaymentDate = DateTime.UtcNow, TransNo = transNo};
    }
}