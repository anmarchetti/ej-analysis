using System;
using System.Linq;
using easyJet.Foundation.Analytics.Helpers;
using easyJet.Foundation.Analytics.Logging;
using easyJet.Foundation.Analytics.Models.Profiles;
using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.Destinations.Models.Responses;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Logger;
using Sitecore.Data.Events;
using Sitecore.Events;
using Sitecore.Sites;

namespace easyJet.Feature.Tracker.Events
{
    /// <summary>
    /// EJH-16827 Add Types/Theme to Hotel Items.
    /// </summary>
    public class HotelProfileItemEventHandler
    {
        private readonly IProfileService profileService;
        private readonly IHotelThemesService hotelThemesService;

        protected ILogger Logger { get; }

        public HotelProfileItemEventHandler(
            IProfileService profileService,
            IHotelThemesService hotelThemesService,
            IAnalyticsLogger logger)
        {
            this.profileService = profileService;
            this.hotelThemesService = hotelThemesService;
            Logger = logger;
        }

        /// <summary>
        /// Inherit tag profile from parent on creating Hotel.
        /// </summary>
        /// <param name="sender">Sender.</param>
        /// <param name="args">Sitecore Event Args.</param>
        public void OnItemCreated(object sender, EventArgs args)
        {
            var createdArgs = Event.ExtractParameter(args, 0) as ItemCreatedEventArgs;
            if (createdArgs == null)
            {
                return;
            }

            var item = createdArgs?.Item;

            if (item.TemplateID.Equals(Constants.TemplateIds.HotelPage) &&
                item.Parent.TemplateID.Equals(Foundation.Destinations.Constants.TemplateIds.Resort) &&
                item.Database.Name.Equals("master", StringComparison.OrdinalIgnoreCase))
            {
                // check if root item has 'Hotel Themes' profile
                var (_, itemProfile) = profileService.GetItemTrackingFieldAndContentProfile(item.Parent, HotelThemesProfile.ProfileName);
                if (!itemProfile.IsSavedInField)
                {
                    Logger.Warn($"[{nameof(HotelProfileItemEventHandler)}-{nameof(OnItemCreated)}] Hotel Profile is not defined for parent item '{item.Parent.ID}'.", this);
                    return;
                }

                // Get relevant profile card so hotel theme dropdown reflects the resort profile
                var itemParentHotelThemeProfile = ProfileCardHelper.GetHotelThemeProfile(item.Parent);
                var relevantProfileCardName = itemParentHotelThemeProfile.GetRelevantProfileCardName();
                if (relevantProfileCardName != null)
                {
                    var siteCotext = item.GetSiteContext();
                    HotelThemeResponseItem relevantTheme;
                    using (new SiteContextSwitcher(siteCotext))
                    {
                        relevantTheme = hotelThemesService.GetHotelThemes().FirstOrDefault(x => string.Equals(x.Name, relevantProfileCardName, StringComparison.OrdinalIgnoreCase));
                    }

                    if (relevantTheme != null)
                    {
                        item.Editing.BeginEdit();
                        item.Fields[Foundation.Destinations.Constants.Fields.AccommodationItem.HotelTheme].Value = relevantTheme.Id.ToString();
                        item.Editing.EndEdit();

                        Logger.Info($"[{nameof(HotelProfileItemEventHandler)}-{nameof(OnItemCreated)}] Field HotelTheme has been updated for item '{item.ID}' with value {relevantTheme.Id}.", this);
                    }
                }

                Logger.Info($"[{nameof(HotelProfileItemEventHandler)}-{nameof(OnItemCreated)}] Begin updating TrackingField for item '{item.ID}'.", this);

                // set root Hotel Themes profile for new Hotel
                var result = profileService.TagGenericProfile(item, itemParentHotelThemeProfile, new TagChildrenSettings());

                if (!result[0])
                {
                    Logger.Warn($"[{nameof(HotelProfileItemEventHandler)}-{nameof(OnItemCreated)}] TrackingField is null or Error occurred. Hotel Profile can't be set for item '{item.ID}'.", this);
                    return;
                }

                Logger.Info($"[{nameof(HotelProfileItemEventHandler)}-{nameof(OnItemCreated)}] End updating TrackingField for item '{item.ID}'.", this);
            }
        }
    }
}