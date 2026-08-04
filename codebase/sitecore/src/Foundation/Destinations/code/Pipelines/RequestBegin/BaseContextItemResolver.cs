using System;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using Sitecore;
using Sitecore.Data.Items;
using Sitecore.Diagnostics;
using Sitecore.IO;
using Sitecore.LayoutService.Mvc.ItemResolving;
using Sitecore.LayoutService.Mvc.Pipelines.RequestBegin;
using Sitecore.LayoutService.Mvc.Routing;
using Sitecore.Mvc.Pipelines.Request.RequestBegin;

namespace easyJet.Foundation.Destinations.Pipelines.RequestBegin
{
    public abstract class BaseContextItemResolver : ContextItemResolver
    {
        protected readonly IHtmlCacheRepository Cache;

        protected virtual string JssApiPrefix { get; }

        protected virtual string CachePrefix { get; }

        private const string MasterDatabaseName = "master";

        /// <summary>
        /// Initializes a new instance of the <see cref="BaseContextItemResolver"/> class.
        /// </summary>
        /// <param name="itemResolver">itemResolver.</param>
        /// <param name="routeMapper">routeMapper.</param>
        /// <param name="cache">cache.</param>
        protected BaseContextItemResolver(IItemResolver itemResolver, IRouteMapper routeMapper, IHtmlCacheRepository cache)
            : base(itemResolver, routeMapper)
        {
            this.Cache = cache;
        }

        /// <summary>
        /// Resolve context item.
        /// </summary>
        /// <param name="args">Request Begin Args.</param>
        public override void Process(RequestBeginArgs args)
        {
            Assert.ArgumentNotNull(args, nameof(args));

            if (Context.Item != null && Context.Item.ID != ItemIDs.RootID)
            {
                return;
            }

            string path = GetPath(args);

            if (!string.IsNullOrWhiteSpace(path))
            {
                var item = GetContextItem(path);

                if (item != null && item.Access.CanRead())
                {
                    Context.Item = item;
                }
            }
        }

        /// <summary>
        /// Resolve context item.
        /// </summary>
        /// <param name="path">Item path.</param>
        /// <returns>Sitecore item.</returns>
        protected abstract Item ResolveItem(string path);

        /// <summary>
        /// Get and resolve sitecore item.
        /// </summary>
        /// <param name="itemPath">Item path.</param>
        /// <returns>Sitecore item.</returns>
        protected virtual Item GetContextItem(string itemPath)
        {
            var contextDatabase = Context.Database;
            if (contextDatabase == null)
            {
                return null;
            }

            var cacheKey = $"{CachePrefix}-{FileUtil.MakePath(Context.Site?.StartPath, itemPath, '/')}";
            var item = Cache.GetItem<Item>(cacheKey);

            if (item != null)
            {
                return item;
            }

            item = ResolveItem(itemPath);

            if (item != null && !contextDatabase.Name.Equals(MasterDatabaseName, StringComparison.InvariantCultureIgnoreCase))
            {
                Cache.StoreItem(cacheKey, item);
            }

            return item;
        }
    }
}