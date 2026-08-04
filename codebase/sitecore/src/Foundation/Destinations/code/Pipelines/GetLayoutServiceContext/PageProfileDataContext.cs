using easyJet.Foundation.Analytics.Helpers;
using easyJet.Foundation.Analytics.Models.Profiles;
using easyJet.Foundation.Analytics.Services;
using Sitecore.Diagnostics;
using Sitecore.JavaScriptServices.Configuration;
using Sitecore.JavaScriptServices.ViewEngine.LayoutService.Pipelines.GetLayoutServiceContext;
using Sitecore.LayoutService.ItemRendering.Pipelines.GetLayoutServiceContext;

namespace easyJet.Foundation.Destinations.Pipelines.GetLayoutServiceContext
{
    public class PageProfileDataContext : JssGetLayoutServiceContextProcessor
    {
        private const string PageProfile = "pageProfile";
        private readonly IProfileService profileService;

        public PageProfileDataContext(
            IConfigurationResolver configurationResolver,
            IProfileService profileService)
            : base(configurationResolver)
        {
            this.profileService = profileService;
        }

        protected override void DoProcess(GetLayoutServiceContextArgs args, AppConfiguration application)
        {
            Assert.ArgumentNotNull(args, nameof(args));
            if (args.ContextData.ContainsKey(PageProfile) || args.RenderedItem == null)
            {
                return;
            }

            // check if root item has 'Hotel Themes' profile
            var (_, itemProfile) = profileService.GetItemTrackingFieldAndContentProfile(args.RenderedItem, HotelThemesProfile.ProfileName);
            if (!itemProfile.IsSavedInField)
            {
                return;
            }

            var hotelThemeProfile = ProfileCardHelper.GetHotelThemeProfile(args.RenderedItem);

            var pageProfile = new
            {
                hotelTheme = hotelThemeProfile
            };

            args.ContextData.Add(PageProfile, pageProfile);
        }
    }
}