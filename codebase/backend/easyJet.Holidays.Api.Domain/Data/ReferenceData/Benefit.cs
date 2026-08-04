using easyJet.Holidays.Api.Domain.CustomJsonConverters;
using Newtonsoft.Json;

namespace easyJet.Holidays.Api.Domain.Data.ReferenceData;

[Serializable]
public class Benefit
{
    public string Name { get; set; }

    public string Code { get; set; }

    public string Description { get; set; }

    public string Icon { get; set; }

    [JsonConverter(typeof(SiteCoreBooleanConverter))]
    public bool IsVisibleOnSeatMapPlan { get; set; } = true;
}