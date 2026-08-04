using System.Collections.Generic;
using System.Linq;
using easyJet.Feature.PageContent.Models;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Multisite;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data.Items;

namespace easyJet.Feature.PageContent.Services
{
    [Service(typeof(IRecommendedDestinationService), Lifetime = Lifetime.Transient)]
    public class RecommendedDestinationService : IRecommendedDestinationService
    {
        private readonly IHtmlCacheRepository cache;
        private readonly IDatabaseProvider databaseProvider;
        private readonly ISitecoreContext sitecoreContext;

        public RecommendedDestinationService(IHtmlCacheRepository cache, IDatabaseProvider databaseProvider, ISitecoreContext sitecoreContext)
        {
            this.databaseProvider = databaseProvider;
            this.sitecoreContext = sitecoreContext;
            this.cache = cache;
        }

        /// <inheritdoc/>
        public Dictionary<string, RecommendedDestination> GetAll()
        {
            var data = cache.GetOrAdd($"InspireMe.Cache.GetAllRecommendedDestinations", () =>
            {
                var inspireMeDestinationFolder = databaseProvider.SelectSingleItem($"{sitecoreContext.Site.RootPath}/*[@@templateid = '{Templates.Data.Id}']/*[@@templateid = '{Constants.TemplateIds.InspireDestinationsMeFolder}']");

                if (inspireMeDestinationFolder == null)
                {
                    return new Dictionary<string, RecommendedDestination>();
                }

                var recommendedDestinations = inspireMeDestinationFolder
                .Children
                .Select((item) => Map(item))
                .Where(x => x != null)
                .GroupBy(x => x.Code)
                .ToDictionary(x => x.Key, x => x.FirstOrDefault());

                return recommendedDestinations;
            });

            return data;
        }

        /// <summary>
        /// Map Item to Recommended destination model.
        /// </summary>
        /// <param name="item">Sitecore Item.</param>
        /// <returns>Recommended destination object.</returns>
        private static RecommendedDestination Map(Item item)
        {
            var destinationItem = item?.GetItems(Constants.Fields.RecommendedDestination.Destination).FirstOrDefault();
            if (destinationItem == null)
            {
                return null;
            }

            var tags = item.GetItems(Constants.Fields.RecommendedDestination.Tags)?.Select(x => x[Foundation.Destinations.Constants.Fields.DatasourceItem.Code]).ToArray();

            return new RecommendedDestination()
            {
                Code = destinationItem.Fields[Foundation.Destinations.Constants.Fields.DatasourceItem.Code].Value,
                Tags = tags,
            };
        }
    }
}