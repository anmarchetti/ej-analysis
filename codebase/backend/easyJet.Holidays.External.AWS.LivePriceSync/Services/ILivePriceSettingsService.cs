using easyJet.Holidays.Api.Domain.Data.LivePrice;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using easyJet.Holidays.External.AWS.LivePriceSync.Models;

namespace easyJet.Holidays.External.AWS.LivePriceSync.Services;

/// <summary>
/// 
/// </summary>
public interface ILivePriceSettingsService
{
    /// <summary>
    /// Gets rid of offers which don't exist in CMS
    /// </summary>
    /// <returns></returns>
    Task<List<AvCacheResultOffersOffer>> ExcludeOffersThatAreNotInCms(
        List<AvCacheResultOffersOffer> offers,
        string language);
    /// <summary>
    /// retrieves settings from cms
    /// </summary>
    /// <param name="market"></param>
    /// <param name="languageSettings"></param>
    /// <returns></returns>
    Task<LivePriceConfiguration> GetSettings(MarketSettings market, LanguageSettings languageSettings);
    
    /// <summary>
    /// Get validated range
    /// If range wasn't valid function goes to next DestinationSchedule
    /// </summary>
    /// <returns></returns>
    DateRange GetValidRange(DateTimeOffset currentDate, DateRange range);
}