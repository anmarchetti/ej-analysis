namespace easyJet.Foundation.HotelBeds.Models.Requests
{
    public class FacilityTypologiesRequest : BaseRequest
    {
        public override string GetRequestString()
        {
            return $"/types/facilitytypologies{GetQueryString()}";
        }
    }
}