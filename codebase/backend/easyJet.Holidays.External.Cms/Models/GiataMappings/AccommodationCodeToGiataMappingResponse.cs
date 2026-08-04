using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.GiataMappings;

public class AccommodationCodeToGiataMappingResponse : JsonApiResponse<Dictionary<string, string>>
{
    public override ApiError[] ApiErrors => null;
}