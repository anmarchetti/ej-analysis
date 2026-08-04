using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Logger;

namespace easyJet.Foundation.SiteModes.Logging
{
    [Service(typeof(ISiteModesLogger), Lifetime = Lifetime.Singleton)]
    public class SiteModesLogger : BaseLogger, ISiteModesLogger
    {
        private const string LoggerName = "easyJet.Foundation.SiteModes.Logger";

        public SiteModesLogger()
            : base(LoggerName)
        {
        }
    }
}