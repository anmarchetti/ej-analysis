using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.HealthEntryRequirements
{
    public class HealthEntryRequirementsResponse : JsonApiResponse<List<HealthEntryRequirement>>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
}
