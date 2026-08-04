using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.SitecoreExtensions.Utils;
using Sitecore;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Services
{
    [Service(typeof(IOfferFiltersService), Lifetime = Lifetime.Singleton)]
    public class OfferFiltersService : IOfferFiltersService
    {
        private const string CacheKey = "Desinations.Cache.OfferFilters";
        private readonly IDatabaseProvider databaseProvider;
        private readonly IHtmlCacheRepository cache;

        public OfferFiltersService(
            IDatabaseProvider databaseProvider,
            IHtmlCacheRepository cache)
        {
            this.databaseProvider = databaseProvider;
            this.cache = cache;
        }

        public OfferFilters GetOfferFilters()
        {
            return cache.GetOrAdd(CacheKey, () =>
            {
                var offerFiltersFolder = databaseProvider.SelectSingleItem(
                    $"{Context.Site.RootPath}/Data/*[@@templateId='{Constants.TemplateIds.OfferFiltersFolder}']");
                return new OfferFilters(offerFiltersFolder);
            });
        }

        /// <inheritdoc />
        public OfferFiltersReorderingConfiguration GetOfferFiltersReorderingConfiguration()
        {
            var offerFiltersReorderingConfigurationItem = databaseProvider.SelectSingleItem(
                $"{Context.Site.RootPath}/Data/*[@@templateId='{Constants.TemplateIds.OfferFilterReorderingConfiguration}']");

            if (offerFiltersReorderingConfigurationItem == null)
            {
                return new OfferFiltersReorderingConfiguration
                {
                    IsEnabled = false
                };
            }

            var offerFiltersOrders = FieldUtils.GetMultilistTargetItems("SelectedFilters", offerFiltersReorderingConfigurationItem);

            var offerFiltersReorderingConfiguration = new OfferFiltersReorderingConfiguration
            {
                IsEnabled = FieldUtils.IsChecked("EnableFiltersOrdering", offerFiltersReorderingConfigurationItem),
                ExperienceId = offerFiltersReorderingConfigurationItem["ExperienceId"],
                Filters = offerFiltersOrders.Select(ToOfferFilterReordering)
            };

            return offerFiltersReorderingConfiguration;
        }

        private static OfferFilterReordering ToOfferFilterReordering(Item item)
            => new OfferFilterReordering
            {
                Code = item["Code"],
                FilterOrder = FieldUtils.GetMultilistTargetItems("FiltersOrder", item).Select(x => x["Code"]).ToList()
            };
    }
}