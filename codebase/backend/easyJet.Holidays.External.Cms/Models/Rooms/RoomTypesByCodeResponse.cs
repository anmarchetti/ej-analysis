using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Rooms
{
    public class RoomTypesByCodeResponse : JsonApiResponse<List<RoomType>>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
}
