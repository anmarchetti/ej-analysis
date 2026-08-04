using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Analytics.Helpers;
using easyJet.Foundation.Analytics.Logging;
using easyJet.Foundation.Analytics.Models.Profiles;
using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.Destinations.Models.Responses;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Analytics.Data;
using Sitecore.Data;
using Sitecore.SecurityModel;
using Sitecore.Shell.Framework.Commands;
using Sitecore.Sites;
using Item = Sitecore.Data.Items.Item;

namespace easyJet.Feature.Tracker.Commands.Profiles
{
    /// <summary>
    /// EJH-16827 Add Types/Theme to Hotel Items.
    /// </summary>
    public class SyncHotelProfileCommand : BaseItemProgressReportingCommand
    {
        private readonly IProfileService profileService;
        private readonly IHotelThemesService hotelThemesService;

        public SyncHotelProfileCommand(
            IProfileService profileService,
            IHotelThemesService hotelThemesService,
            IAnalyticsLogger logger,
            IDatabaseProvider databaseProvider,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService)
            : base(databaseProvider, logger, userCreationService, sitecoreUiService)
        {
            this.profileService = profileService;
            this.hotelThemesService = hotelThemesService;
        }

        protected override bool IsCommandContextValid(CommandContext context)
        {
            return context.Items[0].TemplateID.Equals(Foundation.Destinations.Constants.TemplateIds.Resort);
        }

        protected override IEnumerable<Item> ProcessItems(Item contextItem)
        {
            var processedItems = new List<Item>();

            var siteCotext = contextItem.GetSiteContext();
            using (new SiteContextSwitcher(siteCotext))
            using (new DatabaseSwitcher(contextItem.Database))
            using (new SecurityDisabler())
            using (new DatabaseCacheDisabler())
            using (new BulkUpdateContext())
            {
                // get 'Hotel Themes' profile of root item
                ProfileUtil.GetProfiles(contextItem, out var trackingField);
                var contentProfile = trackingField?.Profiles?.FirstOrDefault(p => p.Name.Equals(HotelThemesProfile.ProfileName, StringComparison.InvariantCultureIgnoreCase));

                if (!contentProfile.IsSavedInField)
                {
                    Logger.Warn($"[{nameof(SyncHotelProfileCommand)}-{nameof(ProcessItems)}] Hotel Profile is not defined for parent item '{contextItem.ID}'.", this);
                    return processedItems;
                }

                var hotelItems = contextItem.GetChildren().Where(item => item.TemplateID == Constants.TemplateIds.HotelPage).ToList();
                if (!hotelItems.Any())
                {
                    Logger.Warn($"[{nameof(SyncHotelProfileCommand)}-{nameof(ProcessItems)}] Context item '{contextItem.ID}' has no HotelPage subitems.", this);
                    return processedItems;
                }

                // get 'Hotel Themes' profile
                var itemParentHotelThemeProfile = ProfileCardHelper.GetHotelThemeProfile(contextItem);

                Logger.Info($"[{nameof(SyncHotelProfileCommand)}-{nameof(ProcessItems)}] Begin updating TrackingField for subitems of '{contextItem.ID}'.", this);

                // Get relevant profile card so hotel theme dropdown reflects the resort profile
                HotelThemeResponseItem relevantTheme = null;
                var relevantProfileCardName = itemParentHotelThemeProfile.GetRelevantProfileCardName();
                if (relevantProfileCardName != null)
                {
                    relevantTheme = hotelThemesService.GetHotelThemes().FirstOrDefault(x => string.Equals(x.Name, relevantProfileCardName));
                }

                // set root Hotel Themes profile for the child elements
                foreach (var item in hotelItems)
                {
                    // set root Hotel Themes profile for new Hotel
                    var result = profileService.TagGenericProfile(item, itemParentHotelThemeProfile, new TagChildrenSettings());

                    if (!result[0])
                    {
                        Logger.Warn($"[{nameof(SyncHotelProfileCommand)}-{nameof(ProcessItems)}] TrackingField is null or Error occurred. Hotel Profile can't be set for item '{item.ID}'.", this);
                        continue;
                    }

                    // hotel theme dropdown reflects the resort profile
                    if (relevantTheme != null)
                    {
                        item.Editing.BeginEdit();
                        item.Fields[Foundation.Destinations.Constants.Fields.AccommodationItem.HotelTheme].Value = relevantTheme.Id.ToString();
                        item.Editing.EndEdit();

                        Logger.Info($"[{nameof(SyncHotelProfileCommand)}-{nameof(ProcessItems)}] Field HotelTheme has been updated for item '{item.ID}' with value {relevantTheme.Id}.", this);
                    }

                    processedItems.Add(item);
                    Logger.Info($"[{nameof(SyncHotelProfileCommand)}-{nameof(ProcessItems)}] TrackingField updated for item '{item.ID}'.", this);
                }

                Logger.Info($"[{nameof(SyncHotelProfileCommand)}-{nameof(ProcessItems)}] End updating TrackingField for subitems of '{contextItem.ID}'.", this);
            }

            return processedItems;
        }
    }
}