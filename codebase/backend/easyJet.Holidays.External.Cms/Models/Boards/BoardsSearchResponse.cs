using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models
{
    public class BoardsResponseBody
    {
        public BoardType[] BoardTypes { get; set; }
    }

    public class BoardsSearchResponse : JsonApiResponse<BoardsResponseBody>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
}
