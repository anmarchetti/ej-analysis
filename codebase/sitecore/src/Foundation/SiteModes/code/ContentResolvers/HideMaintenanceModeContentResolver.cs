using easyJet.Foundation.SiteModes.Logging;
using easyJet.Foundation.SiteModes.Services;

namespace easyJet.Foundation.SiteModes.ContentResolvers
{
    public class HideMaintenanceModeContentResolver : BaseHideMaintenanceModeContentResolver
    {
        public HideMaintenanceModeContentResolver(ISiteModeService service, ISiteModesLogger logger)
            : base(service, logger)
        {
        }
    }
}