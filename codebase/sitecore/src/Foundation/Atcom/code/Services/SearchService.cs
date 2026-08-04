using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Atcom.Logging;
using easyJet.Foundation.Atcom.Models.Domain;
using easyJet.Foundation.Atcom.Models.External;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using Sitecore.Abstractions;

namespace easyJet.Foundation.Atcom.Services
{
    [Service(typeof(ISearchService), Lifetime = Lifetime.Singleton)]
    public class SearchService : AtcomService, ISearchService
    {
        private const string DateFormat = "yyyy-MM-dd";
        private readonly BaseSettings settings;

        protected string Host { get; set; }

        protected string BaseUrl { get; set; }

        protected string SearchQuery { get; set; }

        public SearchService(IAtcomLogger logger, ICustomCacheRepository cache, BaseSettings settings)
            : base(logger, cache)
        {
            this.settings = settings;
            Host = settings.GetSetting("Atcom.SearchServiceHost");
            BaseUrl = settings.GetSetting("Atcom.SearchServiceBaseUrl");
            BuildSearchQuery();
        }

        /// <inheritdoc/>
        public Dictionary<string, AtcomAccommodation> GetDataCollection()
        {
            var cacheKey = "Atcom.Cache.SearchService.Response";
            var cacheTime = settings.GetIntSetting("Atcom.SearchService.CacheExpiredInMinutes", 1440);
            var searchServiceUrl = $"{Host}{BaseUrl}?{SearchQuery}";

            var result = GetData<AvCache, Dictionary<string, AtcomAccommodation>>(searchServiceUrl, null, cacheKey, cacheTime, response =>
                {
                    // This data structure presented in Atcom scheme.
                    var offers = response?.Result?.Offers?.Offer;

                    if (offers == null || !offers.Any())
                    {
                        return null;
                    }

                    Logger.Debug($"Response: {response.Result.Offers.Count} items was retrieved", this);

                    // Groupping accommodation data by accommodation code.
                    var accommodationsByCode = offers
                        .GroupBy(x => x.Accom.First().Code)
                        .ToDictionary(x => x.Key, y =>
                        {
                            var accommodation = y.First().Accom?.First(); // Getting accommodation entry from offer.
                            if (accommodation == null)
                            {
                                return null;
                            }

                            return new AtcomAccommodation()
                            {
                                Latitude = accommodation.Latitude,
                                Longitude = accommodation.Longitude,
                                TypeCode = accommodation.Prom.Substring(2) // Promo string consists of 4 chars, where 2 last are theme type code.
                            };
                        })
                        .Where(i => i.Value != null)
                        .ToDictionary(i => i.Key, i => i.Value);

                    return accommodationsByCode;
                });

            return result;
        }

        /// <summary>
        /// Build query for atcom search service.
        /// </summary>
        private void BuildSearchQuery()
        {
            var monthsOffset = settings.GetIntSetting("Atcom.SearchServiceQuery.MonthsOffset", 6);
            SearchQuery = string.Format(
                settings.GetSetting("Atcom.SearchServiceQuery"),
                DateTime.Now.ToString(DateFormat),
                // Months offset needed for time duration with better amount of results.
                DateTime.Now.AddMonths(monthsOffset).ToString(DateFormat));
        }
    }
}