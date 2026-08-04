using System;
using Sitecore.Configuration;

namespace easyJet.Foundation.Tracking
{
    public static class TrackingSettings
    {
        public const string SearchChannelIdSettingName = "Tracking.SearchChannelId";

        /// <summary>
        /// Gets a search channel id for creating user search interaction.
        /// </summary>
        public static Guid? SearchChannelId
        {
            get
            {
                if (Guid.TryParse(Settings.GetSetting(SearchChannelIdSettingName), out Guid channelId))
                {
                    return channelId;
                }

                return null;
            }
        }
    }
}