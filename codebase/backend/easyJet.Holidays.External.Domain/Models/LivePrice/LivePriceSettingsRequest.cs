using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Domain.Models.LivePrice;

public class LivePriceSettingsRequest : JsonApiRequest<LivePriceSettingsRequestBody>
{
    public override HttpMethod Method => HttpMethod.Get;
}

public class LivePriceSettingsRequestBody
{
    public string MarketCode { get; set; }
}