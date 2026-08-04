using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Multisite;
using easyJet.Foundation.Presentation.Extensions;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Presentation.Services
{
    [Service(typeof(IRenderingService), Lifetime = Lifetime.Singleton)]
    public class RenderingService : IRenderingService
    {
        private IHtmlCacheRepository Cache { get; }

        private ISitecoreContext Context { get; }

        public RenderingService(IHtmlCacheRepository cache, ISitecoreContext context)
        {
            Cache = cache;
            Context = context;
        }

        /// <inheritdoc/>
        public bool ShouldRenderingBeHidden(Item renderingItem)
        {
            var hideRenderingsIds = GetHideRenderingIds();
            return hideRenderingsIds.Contains(renderingItem.ID.ToString());
        }

        /// <summary>
        /// Get Renderings IDs that needs to be hidden.
        /// </summary>
        /// <returns>Collection of renderings IDs.</returns>
        private HashSet<string> GetHideRenderingIds()
        {
            var siteInfo = Context.Site?.SiteInfo;
            if (siteInfo == null)
            {
                return new HashSet<string>();
            }

            string key = $"HideRendering::{siteInfo.Name}::{siteInfo.Database}";
            return Cache.GetOrAdd(key, () =>
            {
                var query = siteInfo.GetHideRenderingsQuery();
                if (string.IsNullOrEmpty(query))
                {
                    return new HashSet<string>();
                }

                var hideRenderingSetting = Context.Database.SelectSingleItem(query);
                return hideRenderingSetting != null ? hideRenderingSetting.GetItems(Templates.HideRendering.Fields.Renderings).Select(x => x.ID.ToString()).ToHashSet() : new HashSet<string>();
            });
        }
    }
}