using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using Newtonsoft.Json;
using Sitecore.ContentSearch;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    public abstract class AccommodationHierarchyComputedField : AccommodationComputedField
    {
        private readonly ICustomCacheRepository cache;

        protected AccommodationHierarchyComputedField()
            : this(new CustomCacheRepository())
        {
        }

        // For supporting unit testing
        protected AccommodationHierarchyComputedField(ICustomCacheRepository cacheRepository)
        {
            cache = cacheRepository;
        }

        public abstract Item GetHierarchyItem(Item accommodation);

        public abstract bool HierarchyItemIsValid(Item item);

        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            // Assumming accommodations have three-level hierarchy
            var item = GetHierarchyItem(indexableItem.Item);

            if (item != null && HierarchyItemIsValid(item))
            {
                var key = $"{item.ID}-{item.Language}";
                var parentSerialized = cache.GetItem<string>(key);

                if (!string.IsNullOrEmpty(parentSerialized))
                {
                    return parentSerialized;
                }

                var country = new Models.Domain.DatasourceObjectWithImage(item, true);

                parentSerialized = JsonConvert.SerializeObject(country);

                cache.StoreItem(key, parentSerialized, 10);
                return parentSerialized;
            }

            return null;
        }
    }
}