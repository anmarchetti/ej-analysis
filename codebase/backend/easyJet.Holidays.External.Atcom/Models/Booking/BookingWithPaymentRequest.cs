using easyJet.Holidays.External.Atcom.Models.InfoBooking;

namespace easyJet.Holidays.External.Atcom.Models.Booking
{
    public class BookingWithPaymentRequest : AtcomApiRequest<Internal.ModifyCustPaymentRequest>
    {
        public override HttpMethod Method => HttpMethod.Post;
        protected override string RequestNamespace => "AtComRes/ModifyCustPaymentRequest";

        public BookingWithPaymentRequest()
        {
        }

        public BookingWithPaymentRequest(BookingRequest bookingRequest)
        {
            Payload.Body = new Internal.ModifyCustPaymentRequest(bookingRequest.Payload.Body);
        }
    }
}
