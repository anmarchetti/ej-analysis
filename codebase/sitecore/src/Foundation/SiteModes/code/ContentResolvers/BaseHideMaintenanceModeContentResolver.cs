using easyJet.Foundation.SitecoreExtensions.Logger;
using easyJet.Foundation.SiteModes.Services;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;

namespace easyJet.Foundation.SiteModes.ContentResolvers
{
    public class BaseHideMaintenanceModeContentResolver : BaseMaintenanceModeContentResolver
    {
        public BaseHideMaintenanceModeContentResolver(ISiteModeService service, ILogger logger)
            : base(service, logger)
        {
        }

        /// <summary>
        /// Resolve content when current state isn't in maintenance mode.
        /// </summary>
        /// <param name="rendering">Sitecore rendering item.</param>
        /// <param name="renderingConfig">Sitecore rendering config.</param>
        /// <returns>Resolved content.</returns>
        public override object ResolveContents(Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            // Return null if current state is in maintenance mode.
            return GetContentByMode(rendering, renderingConfig, !IsInMaintenanceMode);
        }
    }
}