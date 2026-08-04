using easyJet.Foundation.SitecoreExtensions.Logger;
using Sitecore.Common;

namespace easyJet.Foundation.SitecoreExtensions.Switchers
{
    public class LogSwitcher : Switcher<ILogger, LogSwitcher>
    {
        private readonly bool isOwner = false;

        public LogSwitcher(ILogger log)
        {
            if (CurrentValue == null)
            {
                isOwner = true;
                Enter(log);
            }
        }

        public override void Dispose()
        {
            if (isOwner)
            {
                base.Dispose();
            }
        }
    }
}
