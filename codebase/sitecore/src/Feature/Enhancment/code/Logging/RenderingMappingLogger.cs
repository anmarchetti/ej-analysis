using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Logger;

namespace easyJet.Feature.SitecoreEnhancment.Logging
{
    [Service(typeof(IRenderingMappingLogger), Lifetime = Lifetime.Singleton)]
    public class RenderingMappingLogger : BaseLogger, IRenderingMappingLogger
    {
        private const string LoggerName = "easyJet.Feature.SitecoreEnhancment.RenderingMapping.Logger";

        public RenderingMappingLogger()
            : base(LoggerName)
        {
        }
    }
}
