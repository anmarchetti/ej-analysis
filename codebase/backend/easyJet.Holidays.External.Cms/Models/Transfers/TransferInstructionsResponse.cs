using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Transfers;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Transfers
{
    public class TransferInstructionsResponse : JsonApiResponse<TransferInfo>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
}
