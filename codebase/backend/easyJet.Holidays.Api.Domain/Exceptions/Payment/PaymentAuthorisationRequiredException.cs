using easyJet.Holidays.Api.Domain.Data.Payment;

namespace easyJet.Holidays.Api.Domain.Exceptions
{
    public class PaymentAuthorisationRequiredException : Exception
    {
        public MakePaymentResponse PaymentResponse { get; private set; }

        public PaymentAuthorisationRequiredException(MakePaymentResponse response)
        {
            PaymentResponse = response;
        }
    }
}
