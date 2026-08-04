using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.GiataMappings;

public class AccommodationCodeToGiataMappingsRequest : JsonApiRequest<object>
{
    public override HttpMethod Method => HttpMethod.Post;
}