using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Logger;

namespace easyJet.Foundation.TripAdvisor.Logging
{
    [Service(typeof(ITripAdvisorLogger), Lifetime = Lifetime.Singleton)]
    public class TripAdvisorLogger : BaseLogger, ITripAdvisorLogger
    {
        private const string LoggerName = "easyJet.Foundation.TripAdvisor.Logger";

        public TripAdvisorLogger()
            : base(LoggerName)
        {
        }
    }
}