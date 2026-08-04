using easyJet.Foundation.SiteModes.Logging;
using easyJet.Foundation.SiteModes.Services;

namespace easyJet.Foundation.SiteModes.ContentResolvers
{
    public class ShowMaintenanceModeContentResolver : BaseShowMaintenanceModeContentResolver
    {
        public ShowMaintenanceModeContentResolver(ISiteModeService service, ISiteModesLogger logger)
            : base(service, logger)
        {
        }
    }
}