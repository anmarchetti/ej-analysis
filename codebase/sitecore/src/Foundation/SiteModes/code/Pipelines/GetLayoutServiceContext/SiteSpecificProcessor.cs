using System.Collections.Generic;
using Sitecore.Diagnostics;
using Sitecore.JavaScriptServices.Configuration;
using Sitecore.JavaScriptServices.ViewEngine.LayoutService.Pipelines.GetLayoutServiceContext;
using Sitecore.LayoutService.ItemRendering.Pipelines.GetLayoutServiceContext;

namespace easyJet.Foundation.SiteModes.Pipelines.GetLayoutServiceContext
{
    public abstract class SiteSpecificProcessor : JssGetLayoutServiceContextProcessor
    {
        private readonly IList<string> websites = new List<string>();

        public SiteSpecificProcessor(IConfigurationResolver configurationResolver)
            : base(configurationResolver)
        {
        }

        public abstract void HandleRequest(GetLayoutServiceContextArgs args);

        // Initialize websites list from configuration
        public void AddWebsite(string website)
        {
            websites.Add(website);
        }

        protected override void DoProcess(GetLayoutServiceContextArgs args, AppConfiguration application)
        {
            Assert.ArgumentNotNull(args, nameof(args));

            if (Sitecore.Context.Site != null && websites.Contains(Sitecore.Context.Site.Name))
            {
                HandleRequest(args);
            }
        }
    }
}
