using easyJet.Holidays.External.Atcom.Models.InfoBooking;

namespace easyJet.Holidays.External.Atcom.Models.ItemSearch
{
    public class ItemSearchRequest : AtcomApiRequest<Internal.ItemSearchRequest>
    {
        public override HttpMethod Method => HttpMethod.Post;
        protected override string RequestNamespace => "AtComRes/ItemSearchRequest";
    }
}
