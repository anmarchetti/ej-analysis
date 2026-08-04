using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Rooms
{
    public class RoomTypesResponse : JsonApiResponse<RoomTypesResponseInner>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }

    public class RoomTypesResponseInner
    {
        public List<RoomType> RoomTypes { get; set; }

        public int Take { get; set; }

        public int Total { get; set; }

        public int Page { get; set; }
    }
}
