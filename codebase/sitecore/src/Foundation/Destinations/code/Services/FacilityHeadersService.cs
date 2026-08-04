using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Multisite.Extensions;
using easyJet.Foundation.SitecoreExtensions.Cache.Providers;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Services
{
    [Service(typeof(IFacilityHeadersService), Lifetime = Lifetime.Singleton)]
    public class FacilityHeadersService : IFacilityHeadersService
    {
        private const string CacheKey = "Desinations.Cache.FacilityHeaders";
        private readonly int cacheExpiration = Sitecore.Configuration.Settings.GetIntSetting("Destinations.FacilityHeaders.CacheExpiredInMinutes", 10);

        /// <inheritdoc/>
        public List<FacilityHeader> GetFacilityHeaders(Item item)
        {
            string cacheKey = $"Desinations.Cache.FacilityHeaders-{item.Language.Name}";
            var facilityHeaders = CustomCacheProvider.GetCacheObject<List<FacilityHeader>>(cacheKey);
            if (facilityHeaders != null)
            {
                return facilityHeaders;
            }

            Item facilityHeaderFolder = item.Database
                .SelectSingleItem($"{item.GetDataFolderQuery()}/*[@@templateid ='{Constants.TemplateIds.FacilityHeaderFolder}']");

            if (facilityHeaderFolder?.Children == null)
            {
                return new List<FacilityHeader>();
            }

            facilityHeaders = facilityHeaderFolder.Children
                .Select((x, order) => new FacilityHeader(x, order))
                .ToList();

            if (facilityHeaders.Any())
            {
                CustomCacheProvider.SetCacheObject(CacheKey, facilityHeaders, cacheExpiration);
            }

            return facilityHeaders;
        }

        /// <inheritdoc/>
        public List<FacilityHeader> MapFacilityHeaders(IEnumerable<FacilityHeader> facilityHeaders, IEnumerable<FacilityFilteredType> accommodationFacilities)
        {
            var result = new List<FacilityHeader>();

            foreach (var facilityHeader in facilityHeaders)
            {
                // Grouping accommodation facilities in facility header by code which is a combination of {group code}-{facility code}
                var query = from facilitiesHeader in facilityHeader.FacilityFilteredTypes
                            from accommodationFacility in accommodationFacilities
                            where facilitiesHeader.Code == accommodationFacility.Code || facilitiesHeader.Code == accommodationFacility.FacilityFilterGroup?.Code
                            select facilitiesHeader;

                if (query.Any())
                {
                    // Distinct duplicates
                    var mergedFacilities = query
                        .GroupBy(x => x.Code)
                        .Select(x => x.First())
                        .OrderBy(x => x.Order)
                        .ToList();

                    result.Add(new FacilityHeader()
                    {
                        Name = facilityHeader.Name,
                        FacilityFilteredTypes = mergedFacilities,
                        Order = facilityHeader.Order,
                        TrackingId = facilityHeader.TrackingId
                    });
                }
            }

            return result;
        }
    }
}