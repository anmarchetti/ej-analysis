using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Newtonsoft.Json;
using Sitecore.ContentSearch;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    public class AccommodationVirtualRegionComputedField : AccommodationComputedField
    {
        private const int CacheExpirationTime = 60;

        private readonly ICustomCacheRepository cache;

        public AccommodationVirtualRegionComputedField()
            : this(new CustomCacheRepository())
        {
        }

        // For supporting unit testing
        public AccommodationVirtualRegionComputedField(ICustomCacheRepository cacheRepository)
        {
            cache = cacheRepository;
        }

        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            var accommodationItem = indexableItem.Item;
            // Resort -> Region lvl parent
            var regionParentItem = accommodationItem.Parent.Parent;
            var codes = GetAccommodationVirtualRegionCodes(regionParentItem);
            return codes.Any() ? JsonConvert.SerializeObject(codes) : null;
        }

        private static string[] GetRelatedRegions(Item virtualRegion)
        {
            MultilistField multilist = virtualRegion.Fields[Constants.Fields.VirtualDestination.Regions];
            return (multilist?.GetItems() ?? Enumerable.Empty<Item>())
                .Select(x => x.Fields[Constants.Fields.DatasourceItem.Code]?.Value)
                .ToArray();
        }

        private IEnumerable<VirtualRegion> GetAccommodationVirtualRegionCodes(Item regionParentItem)
        {
            var key = $"virtual-regions-results-{regionParentItem.Language.Name}-{regionParentItem.Name}";

            var cachedItem = cache.GetItem<CachedVirtualRegions>(key);

            if (cachedItem?.IsCached ?? false)
            {
                return cachedItem.VirtualRegionsCodes;
            }

            var virtualRegionItems = GetAllVirtualRegions(regionParentItem.Parent);

            if (virtualRegionItems == null)
            {
                return new List<VirtualRegion>(0);
            }

            var regionItemCode = regionParentItem[Constants.Fields.DatasourceItem.Code];

            var cachedResultItem = new CachedVirtualRegions
            {
                IsCached = true,
                VirtualRegionsCodes = virtualRegionItems.Where(x => x.RelatedRegion.Contains(regionItemCode))
                    .Select(x => new VirtualRegion { Code = x.Code, Name = x.Name, SmallImage = x.SmallImage }),
            };

            cache.StoreItem(key, cachedResultItem, CacheExpirationTime);

            return cachedResultItem.VirtualRegionsCodes;
        }

        private IEnumerable<VirtualRegionItem> GetAllVirtualRegions(Item countryItem)
        {
            if (countryItem.TemplateID == Constants.TemplateIds.VirtualCountry)
            {
                return null;
            }

            var key = $"virtual-regions-{countryItem.Name}";

            var item = cache.GetItem<CachedVirtualRegionsItem>(key);
            if (item?.IsCached ?? false)
            {
                return item.VirtualRegions;
            }

            var virtualRegions = countryItem.Children?.Where(child => child.TemplateID == Constants.TemplateIds.VirtualRegion).ToList();

            var virtualRegionsCacheItem = new CachedVirtualRegionsItem
            {
                IsCached = true,
                VirtualRegions = virtualRegions?.Select(x => new VirtualRegionItem
                {
                    Name = x[Constants.Fields.DatasourceItem.Name],
                    Code = x[Constants.Fields.DatasourceItem.Code],
                    SmallImage = x.GetSmallMediaUrl(Constants.Fields.SitecoreImageItem.Image),
                    RelatedRegion = GetRelatedRegions(x),
                }) ?? new List<VirtualRegionItem>(),
            };

            cache.StoreItem(key, virtualRegionsCacheItem, CacheExpirationTime);

            return virtualRegionsCacheItem.VirtualRegions;
        }
    }
}