using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Atcom.Models.Search
{
    public class SearchAvailablePackagesResponse : XmlApiResponse<AvCache>
    {
        public override ApiError[] ApiErrors => new[] { Payload?.Body?.Error }.Where(x => x != null).Select(x => new ApiError
        {
            Code = x.Code,
            Message = x.Text
        }).ToArray();
    }
}
