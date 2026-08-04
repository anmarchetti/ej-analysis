using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain;

namespace easyJet.Foundation.Destinations.Services
{
    public interface IPriceBreakdownSettingService
    {
        /// <summary>
        /// Get price breakdown settings from sitecore.
        /// </summary>
        /// <returns>Dictionary where key is code of breakdown and value is definition of setting.</returns>
        Dictionary<string, PriceBreakdownSetting> GetPriceBreakdownSettings();
    }
}