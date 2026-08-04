using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Logger;

namespace easyJet.Feature.Tracker.Logging
{
    [Service(typeof(ITrackerLogger), Lifetime = Lifetime.Singleton)]
    public class TrackerLogger : BaseLogger, ITrackerLogger
    {
        private const string LoggerName = "easyJet.Feature.Tracker.Logger";

        public TrackerLogger()
            : base(LoggerName)
        {
        }
    }
}