using System;
using System.Linq;
using System.Text;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.Data.Items;
using Sitecore.IO;
using Sitecore.LayoutService.Mvc.ItemResolving;
using Sitecore.LayoutService.Mvc.Pipelines.RequestBegin;
using Sitecore.LayoutService.Mvc.Routing;

namespace easyJet.Foundation.Destinations.Pipelines.RequestBegin
{
    /// <summary>
    /// Extends <see cref="ContextItemResolver"/> behaviour.
    /// </summary>
    public class DestinationRootItemResolver : BaseContextItemResolver
    {
        protected override string JssApiPrefix => string.Empty;

        protected override string CachePrefix => "DestinationsRootItem";

        private static string DestinationsStartPath => Settings.GetSetting("Destinations.RootFolderStartPath");

        private const string DestinationsItemUrlSegment = "Destinations";

        /// <summary>
        /// Initializes a new instance of the <see cref="DestinationRootItemResolver"/> class.
        /// </summary>
        /// <param name="itemResolver">itemResolver.</param>
        /// <param name="routeMapper">routeMapper.</param>
        /// <param name="cache">cache.</param>
        public DestinationRootItemResolver(IItemResolver itemResolver, IRouteMapper routeMapper, IHtmlCacheRepository cache)
            : base(itemResolver, routeMapper, cache)
        {
        }

        /// <inheritdoc/>
        protected override Item ResolveItem(string path)
        {
            var destinationSegments = path.Split(new[] { '/' }, StringSplitOptions.RemoveEmptyEntries);
            if (!destinationSegments.Any() || !destinationSegments.Last().Equals(DestinationsItemUrlSegment, StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            var itemPath = new StringBuilder(DestinationsStartPath);

            foreach (var segment in destinationSegments)
            {
                itemPath.Append($"/{MainUtil.DecodeName(segment)}");
            }

            var item = Context.Database?.GetItem(itemPath.ToString());
            return (item?.Template.ID.Equals(Constants.TemplateIds.DestinationsFolder) ?? false) ? item : null;
        }
    }
}