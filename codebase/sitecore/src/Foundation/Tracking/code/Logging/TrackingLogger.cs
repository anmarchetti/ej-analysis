using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Logger;

namespace easyJet.Foundation.Tracking.Logging
{
    [Service(typeof(ITrackingLogger))]
    public class TrackingLogger : BaseLogger, ITrackingLogger
    {
        private const string LoggerName = "easyJet.Foundation.Tracking.Logger";

        public TrackingLogger()
            : base(LoggerName)
        {
        }
    }
}