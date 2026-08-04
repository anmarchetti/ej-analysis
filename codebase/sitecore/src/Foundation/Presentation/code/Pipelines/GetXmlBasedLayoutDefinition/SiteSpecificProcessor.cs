using System.Collections.Generic;
using Sitecore.Diagnostics;
using Sitecore.Mvc.Pipelines.Response.GetXmlBasedLayoutDefinition;

namespace easyJet.Foundation.Presentation.Pipelines.GetXmlBasedLayoutDefinition
{
    public abstract class SiteSpecificProcessor : GetFromLayoutField
    {
        private readonly IList<string> websites = new List<string>();

        public override void Process(GetXmlBasedLayoutDefinitionArgs args)
        {
            Assert.ArgumentNotNull(args, nameof(args));

            if (Sitecore.Context.Site != null && websites.Contains(Sitecore.Context.Site.Name))
            {
                HandleRequest(args);
            }
        }

        public abstract void HandleRequest(GetXmlBasedLayoutDefinitionArgs args);

        // Initialize websites list from configuration
        public void AddWebsite(string website)
        {
            websites.Add(website);
        }
    }
}
