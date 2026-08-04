using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Filters;

/// <summary>
/// Offer Filter Reordering Response
/// </summary>
public class OfferFilterReorderingResponse: JsonApiResponse<OfferFiltersReorderingConfiguration>
{
    /// <summary>
    /// Api Errors handling
    /// </summary>
    public override ApiError[] ApiErrors => [];
}