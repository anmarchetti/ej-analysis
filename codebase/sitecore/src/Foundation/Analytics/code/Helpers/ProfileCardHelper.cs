using System;
using System.Linq;
using easyJet.Foundation.Analytics.Models.Profiles;
using Sitecore;
using Sitecore.Analytics.Data;
using Sitecore.Configuration;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Analytics.Helpers
{
    public static class ProfileCardHelper
    {
        /// <summary>
        /// Get tuple of hotel theme pattern card and profile card.
        /// </summary>
        /// <param name="settingsName">Profile settings name.</param>
        /// <param name="type">Profile card type.</param>
        /// <returns>Tuple of pattern card and profile card.</returns>
        public static Tuple<Item, Item> GetProfilePatternCardByType(string settingsName, string type)
        {
            var profilePath = Settings.GetSetting(settingsName);
            var patternCardItem = Context.Database
                .SelectSingleItem($"{profilePath}/{Constants.Profile.PatternCards}/*[CompareCaseInsensitive(@@name,'{type}')]");

            var profileCardItem = Context.Database
                .SelectSingleItem($"{profilePath}/{Constants.Profile.ProfileCards}/*[CompareCaseInsensitive(@@name,'{type}')]");

            return Tuple.Create(patternCardItem, profileCardItem);
        }

        /// <summary>
        /// Get tuple of hotel theme pattern card and profile card.
        /// </summary>
        /// <param name="settingsName">Profile settings name.</param>
        /// <param name="days">Profile card type.</param>
        /// <returns>Tuple of pattern card and profile card.</returns>
        public static Tuple<Item, Item> GetProfilePatternCardByDays(string settingsName, int days)
        {
            var profilePath = Settings.GetSetting(settingsName);
            var profileCardItem = Context.Database
                .SelectSingleItem($"{profilePath}/{Constants.Profile.ProfileCards}/*[CompareCaseInsensitive(@@name,'{days} Days')]");

            var patternCardItem = Context.Database
                .SelectSingleItem($"{profilePath}/{Constants.Profile.PatternCards}/*[CompareCaseInsensitive(@@name,'{profileCardItem["Details"]}')]");

            return Tuple.Create(patternCardItem, profileCardItem);
        }

        public static HotelThemesProfile GetHotelThemeProfile(Item item)
        {
            ProfileUtil.GetProfiles(item, out var trackingField);
            var contentProfile = trackingField?.Profiles?.FirstOrDefault(p => p.Name.Equals(HotelThemesProfile.ProfileName, StringComparison.InvariantCultureIgnoreCase));

            var beach = (int?)contentProfile?.Keys?.FirstOrDefault(x => x.Key.Equals(nameof(HotelThemesProfile.Beach)))?.Value;
            var city = (int?)contentProfile?.Keys?.FirstOrDefault(x => x.Key.Equals(nameof(HotelThemesProfile.City)))?.Value;
            var lake = (int?)contentProfile?.Keys?.FirstOrDefault(x => x.Key.Equals(nameof(HotelThemesProfile.Lakes)))?.Value;
            return new HotelThemesProfile(beach, city, lake);
        }
    }
}