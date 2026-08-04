using easyJet.Holidays.External.Atcom.Models.InfoBooking;

namespace easyJet.Holidays.External.Atcom.Models.Booking
{
    public class ModifyMemoRequest : AtcomApiRequest<Internal.ModifyMemoRequest>
    {
        public override HttpMethod Method => HttpMethod.Post;
        protected override string RequestNamespace => "AtComRes/ModifyMemoRequest";
    }
}
