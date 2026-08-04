using System.Collections.Generic;
using easyJet.Foundation.Multisite.Models;

namespace easyJet.Foundation.Multisite.Services
{
    public interface IMarketSettingsService
    {
        MarketSettings GetCurrentMarket();

        Dictionary<string, MarketSettings> GetAllMarkets();
    }
}
