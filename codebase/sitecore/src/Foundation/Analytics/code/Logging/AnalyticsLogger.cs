using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Logger;

namespace easyJet.Foundation.Analytics.Logging
{
    [ExcludeFromCodeCoverage]
    [Service(typeof(IAnalyticsLogger), Lifetime = Lifetime.Singleton)]
    public class AnalyticsLogger : BaseLogger, IAnalyticsLogger
    {
        private const string LoggerName = "easyJet.Foundation.Analytics.Logger";

        public AnalyticsLogger()
            : base(LoggerName)
        {
        }
    }
}