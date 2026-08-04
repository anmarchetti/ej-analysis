using System.Collections.Generic;
using Sitecore.Diagnostics;
using Sitecore.Mvc.Pipelines.Response.GetRenderer;

namespace easyJet.Foundation.Presentation.Pipelines.MvcGetRenderer
{
    public abstract class SiteSpecificProcessor : GetRendererProcessor
    {
        private readonly IList<string> websites = new List<string>();

        public override void Process(GetRendererArgs args)
        {
            Assert.ArgumentNotNull(args, nameof(args));

            if (Sitecore.Context.Site != null && websites.Contains(Sitecore.Context.Site.Name))
            {
                HandleRequest(args);
            }
        }

        public abstract void HandleRequest(GetRendererArgs args);

        // Initialize websites list from configuration
        public void AddWebsite(string website)
        {
            websites.Add(website);
        }
    }
}
