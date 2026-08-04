using easyJet.Foundation.Destinations.Pipelines.RequestBegin;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using Sitecore;
using Sitecore.Data.Items;
using Sitecore.LayoutService.Mvc.ItemResolving;
using Sitecore.LayoutService.Mvc.Routing;
using Sitecore.Pipelines;

namespace easyJet.Feature.PageContent.Pipelines.ItemResolving
{
    public class ExecuteResolveItemPipeline : BaseContextItemResolver
    {
        public ExecuteResolveItemPipeline(IItemResolver itemResolver, IRouteMapper routeMapper, IHtmlCacheRepository cache)
            : base(itemResolver, routeMapper, cache)
        {
        }

        protected override string CachePrefix => "ResolveItemPipeline";

        protected override Item ResolveItem(string path)
        {
            var resolveItemArgs = new ResolveItemArgs(path)
            {
                Item = Context.Item,
                Site = Context.Site,
                Language = Context.Language,
                Settings = ResolveItemSettings.CreateDefaultSettings(Context.Item),
            };

            CorePipeline.Run("easyJet.ResolveItem", resolveItemArgs);
            return resolveItemArgs.Item;
        }
    }
}