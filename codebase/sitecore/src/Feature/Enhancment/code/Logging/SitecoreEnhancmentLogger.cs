using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Logger;

namespace easyJet.Feature.SitecoreEnhancment.Logging
{
    [ExcludeFromCodeCoverage]
    [Service(typeof(ISitecoreEnhancmentLogger), Lifetime = Lifetime.Singleton)]
    public class SitecoreEnhancmentLogger : BaseLogger, ISitecoreEnhancmentLogger
    {
        private const string LoggerName = "easyJet.Feature.SitecoreEnhancment.Logger";

        public SitecoreEnhancmentLogger()
            : base(LoggerName)
        {
        }
    }
}