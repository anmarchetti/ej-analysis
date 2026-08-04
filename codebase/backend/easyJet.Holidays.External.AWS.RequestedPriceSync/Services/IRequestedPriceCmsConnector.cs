using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.External.AWS.Models.RequestedPrice;

namespace easyJet.Holidays.External.AWS.RequestedPriceSync.Services;

/// <summary>
/// Makes request to Sitecore to fetch the <see cref="RequestedPriceConfiguration"/>
/// </summary>
public interface IRequestedPriceCmsConnector
{
    /// <summary>
    /// Get requested prices settings from CMS
    /// </summary>
    /// <returns></returns>
    Task<RequestedPriceConfiguration> GetConfig( string marketLanguage);
}