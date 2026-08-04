using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Boards
{
    public class BoardTypesResponse : JsonApiResponse<List<BoardType>>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
}
