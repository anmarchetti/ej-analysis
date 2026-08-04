using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Logger;

namespace easyJet.Foundation.WebApi.Logging
{
    [Service(typeof(IWebApiLogger), Lifetime = Lifetime.Singleton)]
    public class WebApiLogger : BaseLogger, IWebApiLogger
    {
        private const string LoggerName = "easyJet.Foundation.WebApi.Logger";

        public WebApiLogger()
            : base(LoggerName)
        {
        }
    }
}