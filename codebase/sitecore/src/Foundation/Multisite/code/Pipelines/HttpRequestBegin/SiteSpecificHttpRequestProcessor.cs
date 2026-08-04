using System.Collections.Generic;
using Sitecore.Diagnostics;
using Sitecore.Pipelines.HttpRequest;

namespace easyJet.Foundation.Multisite.Pipelines.HttpRequestBegin
{
    public abstract class SiteSpecificHttpRequestProcessor : HttpRequestProcessor
    {
        private readonly IList<string> websites = new List<string>();

        public override void Process(HttpRequestArgs args)
        {
            Assert.ArgumentNotNull(args, nameof(args));

            if (Sitecore.Context.Site != null && websites.Contains(Sitecore.Context.Site.Name))
            {
                HandleRequest(args);
            }
        }

        public abstract void HandleRequest(HttpRequestArgs args);

        // Initialize websites list from configuration
        public void AddWebsite(string website)
        {
            websites.Add(website);
        }
    }
}