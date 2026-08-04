using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Verint.Models
{
    public class AssociateCaseAttachmentResponse : JsonApiResponse<object>
    {
        public override ApiError[] ApiErrors => null;

    }
}