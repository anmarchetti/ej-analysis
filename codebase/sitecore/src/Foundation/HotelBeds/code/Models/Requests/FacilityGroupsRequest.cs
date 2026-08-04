using System.Linq;

namespace easyJet.Foundation.HotelBeds.Models.Requests
{
    public class FacilityGroupsRequest : BaseRequest
    {
        public string[] FacilityGroupsCodes { get; set; }

        public override string GetRequestString()
        {
            return $"/types/facilitygroups{GetQueryString()}";
        }

        protected override string GetQueryString()
        {
            var codesParam = FacilityGroupsCodes != null && FacilityGroupsCodes.Any() ? $"&codes={string.Join(",", FacilityGroupsCodes)}" : string.Empty;
            return $"{base.GetQueryString()}{codesParam}";
        }
    }
}