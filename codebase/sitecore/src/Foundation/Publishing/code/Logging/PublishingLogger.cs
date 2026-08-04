using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Logger;

namespace easyJet.Foundation.Publishing.Logging
{
    [Service(typeof(IPublishingLogger), Lifetime = Lifetime.Singleton)]
    public class PublishingLogger : BaseLogger, IPublishingLogger
    {
        private const string LoggerName = "easyJet.Foundation.Publishing.Logger";

        public PublishingLogger()
            : base(LoggerName)
        {
        }
    }
}