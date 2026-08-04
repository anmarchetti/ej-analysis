using easyJet.Feature.Redirects.Services;
using easyJet.Foundation.Multisite;
using Sitecore;
using Sitecore.Diagnostics;
using Sitecore.LayoutService.Mvc.ItemResolving;
using Sitecore.LayoutService.Mvc.Pipelines.RequestBegin;
using Sitecore.LayoutService.Mvc.Routing;
using Sitecore.Mvc.Pipelines.Request.RequestBegin;

namespace easyJet.Feature.Redirects.Pipelines.HttpRequestBegin
{
    public class HandleItemNotFoundRedirectProcessor : ContextItemResolver
    {
        private readonly IRedirectMapResolverService redirectMapResolverService;
        private readonly ISitecoreContext sitecoreContext;

        #pragma warning disable CS0618 // ContextItemResolver(IItemResolver, IRouteMapper) is obsolete in current Sitecore version.
        public HandleItemNotFoundRedirectProcessor(IItemResolver itemResolver, IRouteMapper routeMapper, IRedirectMapResolverService redirectMapResolverService, ISitecoreContext sitecoreContext)
            : base(itemResolver, routeMapper)
        #pragma warning restore CS0618
        {
            this.redirectMapResolverService = redirectMapResolverService;
            this.sitecoreContext = sitecoreContext;
        }

        public override void Process(RequestBeginArgs args)
        {
            Assert.ArgumentNotNull(args, nameof(args));

            if (!RouteMapper.IsLayoutServiceRoute(args.PageContext.RequestContext) || ItemIsValid())
            {
                return;
            }

            var target = redirectMapResolverService.GetRedirectData(GetPath(args), language: sitecoreContext.Language);

            if (target == null)
            {
                return;
            }

            Context.Items["RedirectData"] = target;
        }

        private bool ItemIsValid()
        {
            return !(sitecoreContext.Item == null ||
                     sitecoreContext.Item.TemplateID == ItemIDs.RootID ||
                     sitecoreContext.Item.Versions.Count <= 0 ||
                     sitecoreContext.Item.Visualization.Layout == null);
        }
    }
}