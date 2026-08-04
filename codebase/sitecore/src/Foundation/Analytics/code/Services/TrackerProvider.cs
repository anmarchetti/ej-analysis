using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using Sitecore;
using Sitecore.Analytics;
using Sitecore.Analytics.Pipelines.StartAnalytics;
using Sitecore.Diagnostics;

namespace easyJet.Foundation.Analytics.Services
{
    [Service(typeof(ITrackerProvider), Lifetime = Lifetime.Transient)]
    public class TrackerProvider : ITrackerProvider
    {
        public ITracker CurrentTracker => Tracker.Current;

        public bool Enabled => Tracker.Enabled;

        public void StartTracking(bool force)
        {
            if (!Enabled && !force)
            {
                return;
            }

            if (force)
            {
                Context.Items[Constants.Pipelines.StartAnalyticsForce] = true;
            }

            Log.Info("[tracker] Start analytics pipeline.", this);
            StartAnalyticsPipeline.Run();
        }
    }
}