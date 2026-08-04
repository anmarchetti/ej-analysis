using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Filters;

/// <summary>
/// Offer Filter Reordering Request
/// </summary>
public class OfferFilterReorderingRequest: JsonApiRequest<object>
{
    /// <summary>
    /// Method
    /// </summary>
    public override HttpMethod Method => HttpMethod.Get;
}