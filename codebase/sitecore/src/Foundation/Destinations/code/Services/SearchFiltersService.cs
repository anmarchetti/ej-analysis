using System.Collections.Generic;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using Sitecore.Data;

namespace easyJet.Foundation.Destinations.Services
{
    [Service(typeof(ISearchFiltersService), Lifetime = Lifetime.Singleton)]
    public class SearchFiltersService : ISearchFiltersService
    {
        private const string FilterFacilityMatrixCacheKey = "Filters.Cache.FacilitiesMatrix";
        private const string FilterCacheKey = "Desinations.Cache.SearchFilters";
        private readonly IHtmlCacheRepository cache;
        private readonly IFacilityMatrixService facilityMatrixConfigurationService;
        private readonly string searchFiltersPath = Sitecore.Configuration.Settings.GetSetting("Destinations.SearchFiltersFolderPath");

        public SearchFiltersService(IHtmlCacheRepository cache, IFacilityMatrixService facilityMatrixConfigurationService)
        {
            this.cache = cache;
            this.facilityMatrixConfigurationService = facilityMatrixConfigurationService;
        }

        /// <inheritdoc/>
        public SearchFilter GetSearchFilters(Database database)
        {
            return cache.GetOrAdd(FilterCacheKey, () => new SearchFilter(database.SelectSingleItem(searchFiltersPath)));
        }

        public List<FacilityMatrixConfiguration> GetFacilityMatrixConfigurations()
        {
            return cache.GetOrAdd(FilterFacilityMatrixCacheKey, () => facilityMatrixConfigurationService.GetFacilityMatrix());
        }
    }
}