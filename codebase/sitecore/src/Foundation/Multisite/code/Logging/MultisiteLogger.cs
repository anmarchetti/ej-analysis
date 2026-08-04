using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Logger;

namespace easyJet.Foundation.Multisite.Logging
{
    [Service(typeof(IMultisiteLogger), Lifetime = Lifetime.Singleton)]
    public class MultisiteLogger : BaseLogger, IMultisiteLogger
    {
        private const string LoggerName = "easyJet.Foundation.Multisite.Logger";

        public MultisiteLogger()
            : base(LoggerName)
        {
        }
    }
}