using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore;
using Sitecore.Abstractions;

namespace easyJet.Foundation.Destinations.Services
{
    [Service(typeof(IFiltredFacilitiesService), Lifetime = Lifetime.Singleton)]
    public class FiltredFacilitiesService : IFiltredFacilitiesService
    {
        private readonly IHtmlCacheRepository cache;
        private readonly IDatabaseProvider databaseProvider;
        private readonly string facilityTypesPath;

        public FiltredFacilitiesService(IHtmlCacheRepository cache, BaseSettings settings, IDatabaseProvider databaseProvider)
        {
            this.cache = cache;
            facilityTypesPath = settings.GetSetting("Destinations.FacilityTypes.Path", string.Empty);
            this.databaseProvider = databaseProvider;
        }

        public List<FacilityExtended> GetFiltredFacilities()
        {
            string cacheKey = "Destinations.Cache.FiltredFacilities";
            var data = cache.GetItem<List<FacilityExtended>>(cacheKey);
            if (data != null)
            {
                return data;
            }

            List<FacilityExtended> filtredFacilities = new List<FacilityExtended>();

            var facilityTypesFolder = databaseProvider.GetDatabase(DatabaseType.Context)
                .SelectSingleItem(facilityTypesPath);

            if (facilityTypesFolder == null)
            {
                return filtredFacilities;
            }

            var facilityTypesGroups = facilityTypesFolder.Children.Where(x => x.TemplateID == Constants.TemplateIds.FacilityTypesGroup);

            foreach (var facilityTypesGroup in facilityTypesGroups)
            {
                var facilityTypes = facilityTypesGroup.Children.
                    Where(x => x.TemplateID == Constants.TemplateIds.FacilityType && x.Fields[Constants.Fields.FacilityTypeItem.ShowInFilter]?.Value == Constants.Common.CheckboxTrueValue).
                    Select(x => new FacilityExtended(x));
                filtredFacilities.AddRange(facilityTypes);
            }

            if (filtredFacilities.Any())
            {
                cache.StoreItem(cacheKey, filtredFacilities);
            }

            return filtredFacilities;
        }
    }
}