using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Logger;

namespace easyJet.Foundation.AmazonSqs.Logging
{
    [Service(typeof(IAmazonSqsLogger), Lifetime = Lifetime.Singleton)]
    public class AmazonSqsLogger : BaseLogger, IAmazonSqsLogger
    {
        private const string LoggerName = "easyJet.Foundation.AmazonSqs.Logger";

        public AmazonSqsLogger()
            : base(LoggerName)
        {
        }
    }
}