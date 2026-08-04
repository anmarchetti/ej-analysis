using System;
using easyJet.Foundation.Analytics.Helpers;
using easyJet.Foundation.Analytics.Logging;
using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Utils;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Tracking.Services
{
    [Service(typeof(IUserSearchProfileService), Lifetime = Lifetime.Singleton)]
    public class UserSearchProfileService : IUserSearchProfileService
    {
        public const int MaxNumberOfDaysForLongStay = 10;
        public const int MinNumberOfDaysForShortStay = 2;
        private readonly ITrackerProvider trackerProviderService;
        private readonly IProfileService profileService;
        private readonly IHtmlCacheRepository cache;
        private readonly IAnalyticsLogger logger;

        public UserSearchProfileService(
            ITrackerProvider trackerProviderService,
            IProfileService profileService,
            IHtmlCacheRepository cache,
            IAnalyticsLogger logger)
        {
            this.trackerProviderService = trackerProviderService;
            this.profileService = profileService;
            this.cache = cache;
            this.logger = logger;
        }

        public bool BoostDurationProfileValueByDays(string startDate, string endDate)
        {
            var durationStay = DateUtil.CalculateDifference(startDate, endDate);
            var duration = durationStay.Days.Clamp(MinNumberOfDaysForShortStay, MaxNumberOfDaysForLongStay);
            (var patternCard, var profileCard) = GetDurationProfilePatternCardByDays(duration);

            if (patternCard == null || profileCard == null)
            {
                var msg = $"Can not find pattern card or profile card for {duration}.";
                logger.Warn(msg, this);
                return false;
            }

            var profile = trackerProviderService.CurrentTracker?.Interaction?.Profiles[patternCard.Parent.Parent.Name];

            if (profile == null)
            {
                var msg = $"Can not get user profile for {patternCard.Parent.Parent.Name}.";
                logger.Warn(msg, this);
                return false;
            }

            return profileService.BoostUserProfile(patternCard, profile, profileCard);
        }

        /// <summary>
        /// Get tuple of duration stay pattern card and profile card.
        /// </summary>
        /// <param name="duration">Duration stay.</param>
        /// <returns>Tuple of duration pattern card and profile card.</returns>
        private Tuple<Item, Item> GetDurationProfilePatternCardByDays(int duration)
        {
            return cache.GetOrAdd(
                $"Destinations.HotelTheme.PatternProfileCard-{duration}-Days",
                () => ProfileCardHelper.GetProfilePatternCardByDays("Profile.VacationStay", duration));
        }
    }
}