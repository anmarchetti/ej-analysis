using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Logger;

namespace easyJet.Feature.Bundles.Logging
{
    [ExcludeFromCodeCoverage]
    [Service(typeof(IBundlesLogger))]
    public class BundlesLogger : BaseLogger, IBundlesLogger
    {
        private const string LoggerName = "easyJet.Feature.Bundles.Logger";

        public BundlesLogger()
            : base(LoggerName)
        {
        }
    }
}