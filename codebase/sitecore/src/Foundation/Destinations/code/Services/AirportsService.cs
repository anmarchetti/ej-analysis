using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using Newtonsoft.Json;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Services
{
    [Service(typeof(IAirportsService), Lifetime = Lifetime.Singleton)]
    public class AirportsService : IAirportsService
    {
        private readonly int cacheExparation = Settings.GetIntSetting("Destinations.CacheExpiredInMinutes", 10);

        private readonly ICustomCacheRepository cacheRepository;
        private readonly IAirportRepository airportRepository;

        public AirportsService(IAirportRepository airportRepository, ICustomCacheRepository cacheRepository)
        {
            this.airportRepository = airportRepository;
            this.cacheRepository = cacheRepository;
        }

        public string GetAccommodationAirportsField(Item item, IEnumerable<string> airportCodes, string sitePath = null)
        {
            List<string> airportIds = new List<string>();
            if (airportCodes != null)
            {
                var airportsIdsByCodes = GetAirports(sitePath);

                foreach (var airportCode in airportCodes)
                {
                    if (airportsIdsByCodes.TryGetValue(airportCode, out var id))
                    {
                        airportIds.Add(id.ToString());
                    }
                }
            }

            return string.Join("|", airportIds);
        }

        public List<Airport> GetAirportsByCountryCodes(string[] codes)
        {
            var airportsData = airportRepository.SearchByCountryCode(codes)?.Select(x => x?.Document?.Airports).Where(x => x != null);
            return airportsData?.SelectMany(x => x.Select(JsonConvert.DeserializeObject<Airport>)).ToList() ?? new List<Airport>();
        }

        private Dictionary<string, ID> GetAirports(string sitePath = null)
        {
            string cacheKey = "HotelBeds.Cache.Airports";

            var airportsIdsByCodes = cacheRepository.GetItem<Dictionary<string, ID>>(cacheKey);
            if (airportsIdsByCodes != null)
            {
                return airportsIdsByCodes;
            }

            // Get all Airport items from sitecore.
            airportsIdsByCodes = airportRepository.GetAirportCodesItemIds(sitePath);

            if (airportsIdsByCodes == null || !airportsIdsByCodes.Any())
            {
                return new Dictionary<string, ID>();
            }

            cacheRepository.StoreItem(cacheKey, airportsIdsByCodes, cacheExparation);

            return airportsIdsByCodes;
        }
    }
}