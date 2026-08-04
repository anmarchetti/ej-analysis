using easyJet.Feature.Redirects.Models;
using easyJet.Feature.Redirects.Services;
using Sitecore;
using Sitecore.Diagnostics;
using Sitecore.LayoutService.ItemRendering.Pipelines.GetLayoutServiceContext;
using Sitecore.Mvc.Pipelines.Request.RequestBegin;

namespace easyJet.Feature.Redirects.Pipelines.GetLayoutServiceContext
{
    public class RedirectDataContext : IGetLayoutServiceContextProcessor
    {
        private const string RedirectKey = "redirect";
        private readonly IRedirectMapResolverService redirectMapResolverService;

        public RedirectDataContext(IRedirectMapResolverService redirectMapResolverService)
        {
            this.redirectMapResolverService = redirectMapResolverService;
        }

        public void Process(GetLayoutServiceContextArgs args)
        {
            Assert.ArgumentNotNull(args, nameof(args));
            if (args.ContextData.ContainsKey(RedirectKey))
            {
                return;
            }

            if (Context.Items["RedirectData"] != null)
            {
                args.ContextData.Add(RedirectKey, Context.Items["RedirectData"]);
                return;
            }

            var target = redirectMapResolverService.GetRedirectData(args.RenderedItem);
            if (target != null)
            {
                args.ContextData.Add(RedirectKey, target);
            }
        }
    }
}