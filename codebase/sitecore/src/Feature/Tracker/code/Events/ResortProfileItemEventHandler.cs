using System;
using System.Runtime.CompilerServices;
using easyJet.Foundation.Analytics.Helpers;
using easyJet.Foundation.Analytics.Models.Profiles;
using easyJet.Foundation.Analytics.Services;
using Sitecore.Data;
using Sitecore.Data.Events;
using Sitecore.Data.Items;
using Sitecore.Events;
using DestinationTemplates = easyJet.Foundation.Destinations.Constants.TemplateIds;

[assembly: InternalsVisibleTo("easyJet.Feature.Tracker.Tests")]
[assembly: InternalsVisibleTo("DynamicProxyGenAssembly2")]

namespace easyJet.Feature.Tracker.Events
{
    public class ResortProfileItemEventHandler
    {
        private readonly IProfileService profileService;

        public ResortProfileItemEventHandler(IProfileService profileService)
        {
            this.profileService = profileService;
        }

        /// <summary>
        /// Inherit tag profile from parent on creating resort.
        /// </summary>
        /// <param name="sender">Sender.</param>
        /// <param name="args">Sitecore Event Args.</param>
        public void OnItemCreated(object sender, EventArgs args)
        {
            var createdArgs = Event.ExtractParameter(args, 0) as ItemCreatedEventArgs;
            var item = createdArgs?.Item;
            if (item == null)
            {
                return;
            }

            if (!item.Database.Name.Equals("master", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            var isResort = item.TemplateID.Equals(DestinationTemplates.Resort) ||
                item.TemplateID.Equals(DestinationTemplates.VirtualResort);

            if (!isResort)
            {
                return;
            }

            var parentTemplateId = item.Parent?.TemplateID ?? ID.Null;
            var isValidParent = parentTemplateId.Equals(DestinationTemplates.RegionPage) ||
                parentTemplateId.Equals(DestinationTemplates.RegionCityPage) ||
                parentTemplateId.Equals(DestinationTemplates.VirtualRegion);

            if (!isValidParent)
            {
                return;
            }

            var parentHotelThemeProfile = GetHotelThemeProfileForItem(item);
            profileService.TagGenericProfile(item, parentHotelThemeProfile, new TagChildrenSettings());
        }

        internal virtual HotelThemesProfile GetHotelThemeProfileForItem(Item item)
            => ProfileCardHelper.GetHotelThemeProfile(item.Parent);
    }
}