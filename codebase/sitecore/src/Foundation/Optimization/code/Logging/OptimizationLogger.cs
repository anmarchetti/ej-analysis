using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.PushNotifications.Logging;
using easyJet.Foundation.SitecoreExtensions.Logger;

namespace easyJet.Foundation.Optimization.Logging
{
    [ExcludeFromCodeCoverage]
    [Service(typeof(IOptimizationLogger), Lifetime = Lifetime.Singleton)]
    public class OptimizationLogger : BaseLogger, IOptimizationLogger
    {
        private const string LoggerName = "easyJet.Foundation.Optimization.Logger";

        public OptimizationLogger()
            : base(LoggerName)
        {
        }
    }
}