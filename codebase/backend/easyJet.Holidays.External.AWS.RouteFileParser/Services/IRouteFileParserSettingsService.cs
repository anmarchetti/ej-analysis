using easyJet.Holidays.Api.Domain.Data.Settings;

namespace easyJet.Holidays.External.AWS.RouteFileParser.Services;

/// <summary>
/// Lambda specific Cms connector
/// </summary>
public interface IRouteFileParserSettingsService
{
    /// <summary>
    /// Retrieve MarketSettings from Cms
    /// </summary>
    /// <returns></returns>
    Task<Dictionary<string, MarketSettings>> GetMarketSettings();
}