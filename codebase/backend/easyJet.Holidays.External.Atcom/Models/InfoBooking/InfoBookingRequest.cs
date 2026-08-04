namespace easyJet.Holidays.External.Atcom.Models.InfoBooking
{
    public class InfoBookingRequest : AtcomApiRequest<Internal.InfoBookingRequest>
    {
        public override HttpMethod Method => HttpMethod.Post;
        protected override string RequestNamespace => "AtComRes/InfoBookingRequest";
    }
}
