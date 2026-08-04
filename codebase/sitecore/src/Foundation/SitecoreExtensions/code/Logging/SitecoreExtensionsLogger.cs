using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Logger;

namespace easyJet.Foundation.SitecoreExtensions.Logging
{
    [ExcludeFromCodeCoverage]
    [Service(typeof(ISitecoreExtensionsLogger), Lifetime = Lifetime.Singleton)]
    public class SitecoreExtensionsLogger : BaseLogger, ISitecoreExtensionsLogger
    {
        private const string LoggerName = "easyJet.Foundation.SitecoreExtensions.Logger";

        public SitecoreExtensionsLogger()
            : base(LoggerName)
        {
        }
    }
}