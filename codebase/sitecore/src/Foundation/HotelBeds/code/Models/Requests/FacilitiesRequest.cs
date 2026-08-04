namespace easyJet.Foundation.HotelBeds.Models.Requests
{
    public class FacilitiesRequest : BaseRequest
    {
        public override string GetRequestString()
        {
            return $"/types/facilities{GetQueryString()}";
        }
    }
}