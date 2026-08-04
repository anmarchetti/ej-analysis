using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Logger;

namespace easyJet.Foundation.Presentation.Logging
{
    [Service(typeof(IPresentationLogger), Lifetime = Lifetime.Singleton)]
    public class PresentationLogger : BaseLogger, IPresentationLogger
    {
        private const string LoggerName = "easyJet.Foundation.Presentation.Logger";

        public PresentationLogger()
            : base(LoggerName)
        {
        }
    }
}