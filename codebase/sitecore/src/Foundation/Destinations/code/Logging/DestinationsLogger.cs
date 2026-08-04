using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Logger;

namespace easyJet.Foundation.Destinations.Logging
{
    [Service(typeof(IDestinationsLogger), Lifetime = Lifetime.Singleton)]
    public class DestinationsLogger : BaseLogger, IDestinationsLogger
    {
        private const string LoggerName = "easyJet.Foundation.Destinations.Logger";

        public DestinationsLogger()
            : base(LoggerName)
        {
        }
    }
}