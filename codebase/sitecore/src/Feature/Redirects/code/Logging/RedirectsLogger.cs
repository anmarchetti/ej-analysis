using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Logger;

namespace easyJet.Feature.Redirects.Logging
{
    [Service(typeof(IRedirectsLogger), Lifetime = Lifetime.Singleton)]
    public class RedirectsLogger : BaseLogger, IRedirectsLogger
    {
        private const string LoggerName = "easyJet.Feature.Redirects.Logger";

        public RedirectsLogger()
            : base(LoggerName)
        {
        }
    }
}