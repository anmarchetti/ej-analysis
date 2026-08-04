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
using Sitecore.Mvc.Pipelines.Request.RequestBegin;

namespace easyJet.Foundation.Destinations.Pipelines.RequestBegin
{
    /// <summary>
    /// Extends <see cref="ContextItemResolver"/> behaviour.
    /// </summary>
    public class DestinationContextItemResolver : ContextItemResolver
    {
        private static string JssApiPrefix => Settings.GetSetting("Destinations.JssApiPrefix");

        private static string DestinationsStartPath => Settings.GetSetting("Destinations.RootFolderStartPath");

        /// <summary>
        /// Initializes a new instance of the <see cref="DestinationContextItemResolver"/> class.
        /// </summary>
        /// <param name="itemResolver">itemResolver.</param>
        /// <param name="routeMapper">routeMapper.</param>
        public DestinationContextItemResolver(IItemResolver itemResolver, IRouteMapper routeMapper)
            : base(itemResolver, routeMapper)
        {
        }

        protected override string GetPath(RequestBeginArgs args)
        {
            string path = base.GetPath(args);
            return FileUtil.MakePath($"{DestinationsStartPath}{JssApiPrefix}", path, '/');
        }
    }
}