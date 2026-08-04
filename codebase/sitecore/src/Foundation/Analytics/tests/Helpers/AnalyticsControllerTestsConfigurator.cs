using easyJet.Foundation.Analytics.Services;
using NSubstitute;
using Sitecore.Analytics;
using Sitecore.Analytics.Tracking;

namespace easyJet.Foundation.Analytics.Tests.Helpers
{
    public class AnalyticsControllerTestsConfigurator
    {
        protected ITrackerProvider TrackerProviderService { get; set; }

        protected ITracker Tracker { get; set; }

        public AnalyticsControllerTestsConfigurator()
        {
            Tracker = Substitute.For<ITracker>();
            Tracker.IsActive.Returns(true);
            Tracker.Contact.Returns(Substitute.For<Contact>());
            Tracker.Interaction.Returns(Substitute.For<CurrentInteraction>());

            TrackerProviderService = Substitute.For<ITrackerProvider>();
            TrackerProviderService.CurrentTracker.Returns(Tracker);
            TrackerProviderService.Enabled.Returns(true);
        }
    }
}
