using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Logger;

namespace easyJet.Feature.ChangeTracking.Logging
{
    [ExcludeFromCodeCoverage]
    [Service(typeof(IChangeTrackingLogger))]
    public class ChangeTrackingLogger : BaseLogger, IChangeTrackingLogger
    {
        private const string LoggerName = "easyJet.Feature.ChangeTracking.Logger";

        public ChangeTrackingLogger()
            : base(LoggerName)
        {
        }
    }
}