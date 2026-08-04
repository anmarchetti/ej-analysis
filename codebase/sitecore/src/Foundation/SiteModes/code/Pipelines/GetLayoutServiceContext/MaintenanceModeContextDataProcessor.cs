using easyJet.Foundation.SiteModes.Services;
using Sitecore.JavaScriptServices.Configuration;
using Sitecore.JavaScriptServices.ViewEngine.LayoutService.Pipelines.GetLayoutServiceContext;
using Sitecore.LayoutService.ItemRendering.Pipelines.GetLayoutServiceContext;

namespace easyJet.Foundation.SiteModes.Pipelines.GetLayoutServiceContext
{
    public class MaintenanceModeContextDataProcessor : SiteSpecificProcessor
    {
        private readonly ISiteModeService service;

        public MaintenanceModeContextDataProcessor(ISiteModeService service, IConfigurationResolver configurationResolver)
            : base(configurationResolver)
        {
            this.service = service;
        }

        public override void HandleRequest(GetLayoutServiceContextArgs args)
        {
            args.ContextData.Add("isSoftMode", service.IsSoftMode());
            args.ContextData.Add("isFullMode", service.IsFullMode());
        }
    }
}