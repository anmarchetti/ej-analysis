using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Hotels
{
    public class HotelResortInfoResponse : JsonApiResponse<HotelResortInfo>
    {
        public override ApiError[] ApiErrors => null;
    }
}
