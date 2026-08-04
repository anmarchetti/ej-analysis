using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Logger;

namespace easyJet.Feature.ScrappingTrigger.Logging
{
    [ExcludeFromCodeCoverage]
    [Service(typeof(IScrappingTriggerLogger), Lifetime = Lifetime.Singleton)]
    public class ScrappingTriggerLogger : BaseLogger, IScrappingTriggerLogger
    {
        private const string LoggerName = "easyJet.Feature.ScrappingTrigger.Logger";

        public ScrappingTriggerLogger()
            : base(LoggerName)
        {
        }
    }
}