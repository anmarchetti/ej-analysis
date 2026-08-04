using easyJet.Holidays.External.Atcom.Models.InfoBooking;

namespace easyJet.Holidays.External.Atcom.Models.ModifyBooking
{
    public class ModifyBookingRequest : AtcomApiRequest<Internal.ModifyBookingRequest.ModifyBookingRequest>
    {
        public override HttpMethod Method => HttpMethod.Post;
        protected override string RequestNamespace => "AtComRes/ModifyBookingRequest";
    }
}