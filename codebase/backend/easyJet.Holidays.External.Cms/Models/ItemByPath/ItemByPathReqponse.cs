using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.ItemByPath
{
    public class ItemByPathResponse<T> : JsonApiResponse<T>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
}
