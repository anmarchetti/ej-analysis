using easyJet.Holidays.External.Atcom.Models.InfoBooking;

namespace easyJet.Holidays.External.Atcom.Models.Booking
{
    public class CancellationBookingRequest : AtcomApiRequest<Internal.CancellationRequest>
    {
        public override HttpMethod Method => HttpMethod.Post;
        protected override string RequestNamespace => "AtComRes/CancellationRequest";
    }
}
