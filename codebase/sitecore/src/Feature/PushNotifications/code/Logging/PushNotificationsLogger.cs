using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Logger;

namespace easyJet.Feature.PushNotifications.Logging
{
    [Service(typeof(IPushNotificationsLogger), Lifetime = Lifetime.Singleton)]
    public class PushNotificationsLogger : BaseLogger, IPushNotificationsLogger
    {
        private const string LoggerName = "easyJet.Feature.PushNotifcations.Logger";

        public PushNotificationsLogger()
            : base(LoggerName)
        {
        }
    }
}