using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.ReferenceData.Luggage;
using easyJet.Holidays.External.Domain.Models.Api;
using easyJet.Holidays.External.Domain.Models.Api.Payload;
using Newtonsoft.Json;

namespace easyJet.Holidays.External.Cms.Models.Luggage;
/// <summary>
/// Get Luggage Response
/// </summary>
public class GetLuggageResponse : JsonApiResponse<Holidays.Api.Domain.Data.ReferenceData.Luggage.Luggage>
{
    /// <summary>
    /// Api Errors handling
    /// </summary>
    public override ApiError[] ApiErrors => []; // Don't handle response body errors

    /// <summary>
    /// Deserializes the payload from the response.
    /// </summary>
    /// <param name="payload"></param>
    public override void DeserializePayload(string payload)
    {
        var settings = new JsonSerializerSettings();
        settings.Converters.Add(new LuggageItemConverter());

        JsonApiPayload<Holidays.Api.Domain.Data.ReferenceData.Luggage.Luggage> newPayload = new()
        {
            Body = JsonConvert.DeserializeObject<Holidays.Api.Domain.Data.ReferenceData.Luggage.Luggage>(payload, settings)
        };

        Payload = newPayload;
    }
}