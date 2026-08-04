using Sitecore.Analytics;

namespace easyJet.Foundation.Analytics.Services
{
    public interface ITrackerProvider
    {
        ITracker CurrentTracker { get; }

        bool Enabled { get; }

        void StartTracking(bool force);
    }
}
