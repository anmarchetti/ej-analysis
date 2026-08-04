using System.Net;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore;
using Sitecore.Diagnostics;
using Sitecore.LayoutService.Mvc.ItemResolving;
using Sitecore.LayoutService.Mvc.Pipelines.RequestBegin;
using Sitecore.LayoutService.Mvc.Routing;
using Sitecore.Mvc.Pipelines.Request.RequestBegin;

namespace easyJet.Foundation.Multisite.Pipelines.HttpRequestBegin
{
    public class HandleItemNotFoundProcessor : ContextItemResolver
    {
        public HandleItemNotFoundProcessor(IItemResolver itemResolver, IRouteMapper routeMapper)
            : base(itemResolver, routeMapper)
        {
        }

        public override void Process(RequestBeginArgs args)
        {
            Assert.ArgumentNotNull(args, nameof(args));

            if (!RouteMapper.IsLayoutServiceRoute(args.PageContext.RequestContext) || ItemIsValid())
            {
                return;
            }

            var settings = Context.Database.SelectSingleItem($"{Context.Site.RootPath}/*[@@templateid='{Templates.Settings.Id}']");
            var itemNotFoundPage = settings?.GetTargetItem(Templates.Settings.Fields.ItemNotFoundPage);

            if (itemNotFoundPage != null)
            {
                Context.Item = itemNotFoundPage;

                args.RequestContext.HttpContext.Response.StatusCode = (int)HttpStatusCode.NotFound;
                args.RequestContext.HttpContext.Response.TrySkipIisCustomErrors = true;
            }
        }

        private bool ItemIsValid()
        {
            return !(Context.Item == null ||
                     Context.Item.TemplateID == ItemIDs.RootID ||
                     Context.Item.Versions.Count <= 0 ||
                     Context.Item.Visualization.Layout == null);
        }
    }
}