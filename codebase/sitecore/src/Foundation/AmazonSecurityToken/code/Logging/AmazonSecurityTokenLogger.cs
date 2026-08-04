using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Logger;

namespace easyJet.Foundation.AmazonSecurityToken.Logging
{
    [Service(typeof(IAmazonSecurityTokenLogger), Lifetime = Lifetime.Singleton)]
    public class AmazonSecurityTokenLogger : BaseLogger, IAmazonSecurityTokenLogger
    {
        private const string LoggerName = "easyJet.Foundation.AmazonSecurityToken.Logger";

        public AmazonSecurityTokenLogger()
            : base(LoggerName)
        {
        }
    }
}