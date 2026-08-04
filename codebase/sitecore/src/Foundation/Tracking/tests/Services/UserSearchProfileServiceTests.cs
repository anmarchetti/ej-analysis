using System;
using easyJet.Foundation.Analytics.Logging;
using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.Tracking.Services;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ReturnsExtensions;
using Sitecore.Analytics;
using Sitecore.Analytics.Tracking;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Xunit;
using Profile = Sitecore.Analytics.Tracking.Profile;

namespace easyJet.Foundation.Tracking.Tests.Services
{
    public class UserSearchProfileServiceTests
    {
        private readonly UserSearchProfileService sut;
        private readonly ITrackerProvider trackerProviderService;
        private readonly IProfileService profileService;
        private readonly IHtmlCacheRepository cache;
        private readonly IAnalyticsLogger logger;

        public UserSearchProfileServiceTests()
        {
            trackerProviderService = Substitute.For<ITrackerProvider>();
            profileService = Substitute.For<IProfileService>();
            cache = Substitute.For<IHtmlCacheRepository>();
            logger = Substitute.For<IAnalyticsLogger>();
            sut = new UserSearchProfileService(trackerProviderService, profileService, cache, logger);
        }

        [Fact]
        public void BoostDurationProfileValueByDays_ShouldReturnFalse_IfPatternCardOrProfileIsNull()
        {
            // Arrange
            var duration = 10;
            var startDate = DateTime.Now.ToShortDateString();
            var endDate = DateTime.Now.AddDays(duration).ToShortDateString();

            var data = new Tuple<Item, Item>(null, null);
            cache.GetOrAdd(Arg.Any<string>(), Arg.Any<Func<Tuple<Item, Item>>>()).Returns(data);

            // Act
            var result = sut.BoostDurationProfileValueByDays(startDate, endDate);

            // Assert
            result.Should().BeFalse();
            logger.Received().Warn($"Can not find pattern card or profile card for {duration}.", sut);
        }

        [Fact]
        public void BoostDurationProfileValueByDays_ShouldReturnFalse_IfProfileIsNull()
        {
            // Arrange
            var duration = 10;
            var startDate = DateTime.Now.ToShortDateString();
            var endDate = DateTime.Now.AddDays(duration).ToShortDateString();
            var theme = "beach";

            var patterCardParentParentFakeItem = new FakeItem().WithName(theme);
            var patternCardParentFakeItem = new FakeItem().WithParent(patterCardParentParentFakeItem);
            var patternCardFakeItem = new FakeItem().WithName("PatternCard").WithParent(patternCardParentFakeItem);
            var profileCardFakeItem = new FakeItem().WithName("ProfileCard");

            var data = new Tuple<Item, Item>(patternCardFakeItem, profileCardFakeItem);
            cache.GetOrAdd(Arg.Any<string>(), Arg.Any<Func<Tuple<Item, Item>>>()).Returns(data);
            var tracker = Substitute.For<ITracker>();
            var interaction = Substitute.For<CurrentInteraction>();
            tracker.Interaction.Returns(interaction);
            interaction.Profiles[theme].ReturnsNull();
            trackerProviderService.CurrentTracker.Returns(tracker);

            // Act
            var result = sut.BoostDurationProfileValueByDays(startDate, endDate);

            // Assert
            result.Should().BeFalse();
            logger.Received().Warn($"Can not get user profile for {theme}.", sut);
        }

        [Fact]
        public void BoostDurationProfileValueByDays_ShouldReturnTrue_IfProfileWasBoosted()
        {
            // Arrange
            var duration = 10;
            var startDate = DateTime.Now.ToShortDateString();
            var endDate = DateTime.Now.AddDays(duration).ToShortDateString();
            var theme = "beach";

            var patterCardParentParentFakeItem = new FakeItem().WithName(theme);
            var patternCardParentFakeItem = new FakeItem().WithParent(patterCardParentParentFakeItem);
            var patternCardFakeItem = new FakeItem().WithName("PatternCard").WithParent(patternCardParentFakeItem);
            var profileCardFakeItem = new FakeItem().WithName("ProfileCard");

            var data = new Tuple<Item, Item>(patternCardFakeItem, profileCardFakeItem);
            cache.GetOrAdd(Arg.Any<string>(), Arg.Any<Func<Tuple<Item, Item>>>()).Returns(data);
            var tracker = Substitute.For<ITracker>();
            var interaction = Substitute.For<CurrentInteraction>();
            tracker.Interaction.Returns(interaction);
            var profile = new Profile(theme);
            interaction.Profiles[theme].Returns(profile);
            trackerProviderService.CurrentTracker.Returns(tracker);
            profileService.BoostUserProfile(patternCardFakeItem, profile, profileCardFakeItem).Returns(true);

            // Act
            var result = sut.BoostDurationProfileValueByDays(startDate, endDate);

            // Assert
            result.Should().BeTrue();
            logger.DidNotReceive().Warn(Arg.Any<string>(), sut);
        }
    }
}