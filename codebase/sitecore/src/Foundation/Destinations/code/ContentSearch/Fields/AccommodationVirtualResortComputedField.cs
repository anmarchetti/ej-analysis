using System;
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
    public class AccommodationVirtualResortComputedField : AccommodationComputedField
    {
        private const int CacheExpirationTime = 60;

        private readonly ICustomCacheRepository cache;

        public AccommodationVirtualResortComputedField()
            : this(new CustomCacheRepository())
        {
        }

        // For supporting unit testing
        public AccommodationVirtualResortComputedField(ICustomCacheRepository cacheRepository)
        {
            cache = cacheRepository;
        }

        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            var accommodationItem = indexableItem.Item;
            var resortItem = accommodationItem.Parent;
            var virtualResorts = GetAccommodationVirtualResorts(resortItem);
            return virtualResorts.Any() ? JsonConvert.SerializeObject(virtualResorts) : null;
        }

        private static string[] GetRelatedResorts(Item virtualResort)
        {
            MultilistField multilist = virtualResort.Fields[Constants.Fields.VirtualDestination.Resorts];
            return (multilist?.GetItems() ?? Enumerable.Empty<Item>())
                .Select(x => x.Fields[Constants.Fields.DatasourceItem.Code]?.Value)
                .ToArray();
        }

        private IEnumerable<VirtualResort> GetAccommodationVirtualResorts(Item resortItem)
        {
            var key = $"virtual-resorts-results-{resortItem.Language.Name}-{resortItem.Name}";

            var cachedItem = cache.GetItem<CachedVirtualResorts>(key);

            if (cachedItem?.IsCached ?? false)
            {
                return cachedItem.VirtualResorts;
            }

            var virtualResortItems = GetAllVirtualResorts(resortItem.Parent);

            if (!virtualResortItems.Any())
            {
                return Enumerable.Empty<VirtualResort>();
            }

            var resortItemCode = resortItem[Constants.Fields.DatasourceItem.Code];

            var cachedResultItem = new CachedVirtualResorts
            {
                IsCached = true,
                VirtualResorts = virtualResortItems.Where(x => x.RelatedResorts.Contains(resortItemCode))
                    .Select(x => new VirtualResort { Code = x.Code, Name = x.Name, SmallImage = x.SmallImage }),
            };

            cache.StoreItem(key, cachedResultItem, CacheExpirationTime);

            return cachedResultItem.VirtualResorts;
        }

        private IEnumerable<VirtualResortItem> GetAllVirtualResorts(Item regionItem)
        {
            if (regionItem.TemplateID == Constants.TemplateIds.VirtualRegion)
            {
                return Enumerable.Empty<VirtualResortItem>();
            }

            var key = $"virtual-resorts-{regionItem.Name}";

            var item = cache.GetItem<CachedVirtualResortsItem>(key);
            if (item?.IsCached ?? false)
            {
                return item.VirtualResorts;
            }

            var virtualResorts = regionItem.Children?.Where(child => child.TemplateID == Constants.TemplateIds.VirtualResort).ToList();

            var virtualResortsCacheItem = new CachedVirtualResortsItem
            {
                IsCached = true,
                VirtualResorts = virtualResorts?.Select(x => new VirtualResortItem
                {
                    Name = x[Constants.Fields.DatasourceItem.Name],
                    Code = x[Constants.Fields.DatasourceItem.Code],
                    SmallImage = x.GetSmallMediaUrl(Constants.Fields.SitecoreImageItem.Image),
                    RelatedResorts = GetRelatedResorts(x),
                }) ?? new List<VirtualResortItem>(),
            };

            cache.StoreItem(key, virtualResortsCacheItem, CacheExpirationTime);

            return virtualResortsCacheItem.VirtualResorts;
        }
    }
}