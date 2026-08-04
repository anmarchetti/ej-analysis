using easyJet.Holidays.External.Atcom.Models.InfoBooking;

namespace easyJet.Holidays.External.Atcom.Models.ModifyBooking
{
    public class InfoModifyBookingRequest : AtcomApiRequest<Internal.InfoModifyBookingRequest.InfoModifyBookingRequest>
    {
        public override HttpMethod Method => HttpMethod.Post;
        protected override string RequestNamespace => "AtComRes/InfoModifyBookingRequest";
    }
}