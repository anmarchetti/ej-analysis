using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Logger;

namespace easyJet.Foundation.BeCause.Logging
{
    [ExcludeFromCodeCoverage]
    [Service(typeof(IBeCauseLogger), Lifetime = Lifetime.Singleton)]
    public class BeCauseLogger : BaseLogger, IBeCauseLogger
    {
        private const string LoggerName = "easyJet.Foundation.BeCause.Logger";

        public BeCauseLogger()
            : base(LoggerName)
        {
        }
    }
}