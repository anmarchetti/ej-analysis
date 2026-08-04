using System;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Requests;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Services
{
    [Service(typeof(IExpediaHotelContentResolverService), Lifetime = Lifetime.Transient)]
    public class ExpediaHotelContentResolverService : IExpediaHotelContentResolverService
    {
        private readonly IDestinationsRepository destinationsRepository;
        private readonly ISearchDatasourceRepository searchDatasourceRepository;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IDestinationsLogger logger;

        public ExpediaHotelContentResolverService(
            IDestinationsRepository destinationsRepository,
            ISearchDatasourceRepository searchDatasourceRepository,
            IDatabaseProvider databaseProvider,
            IDestinationsLogger logger)
        {
            this.destinationsRepository = destinationsRepository;
            this.searchDatasourceRepository = searchDatasourceRepository;
            this.databaseProvider = databaseProvider;
            this.logger = logger;
        }

        public Item ResolveHotelItem(UpsertHotelRequest request)
        {
            if (request == null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            if (!string.IsNullOrWhiteSpace(request.SitecoreId))
            {
                var item = GetHotelById(request.SitecoreId);

                if (item != null)
                {
                    return item;
                }

                logger.Warn(
                    $"Hotel item with SitecoreId '{request.SitecoreId}' was not found in master database. Falling back to GIATA.",
                    this);
            }

            return GetHotelByGiataCode(request.GiataCode);
        }

        public Item ResolveResortByCode(string resortCode)
        {
            if (string.IsNullOrWhiteSpace(resortCode))
            {
                return null;
            }

            resortCode = resortCode.Trim();

            var candidateResort = searchDatasourceRepository.GetItemByCode(
                resortCode,
                Constants.TemplateIds.Resort,
                false);

            return GetMasterItem(
                candidateResort,
                $"Resort with code '{resortCode}' was found by search but was not found in master database.");
        }

        private Item GetHotelById(string sitecoreId)
        {
            if (!ID.TryParse(sitecoreId, out var itemId))
            {
                return null;
            }

            return GetMasterItem(itemId);
        }

        private Item GetHotelByGiataCode(string giataCode)
        {
            if (string.IsNullOrWhiteSpace(giataCode))
            {
                logger.Warn("GIATA code is empty. Cannot resolve hotel.", this);
                return null;
            }

            giataCode = giataCode.Trim();

            var results = destinationsRepository.SearchHotelsByCodes(new[] { giataCode });

            var document = results?.Hits?
                .Select(x => x.Document)
                .FirstOrDefault(x => string.Equals(x.GiataCode, giataCode, StringComparison.InvariantCultureIgnoreCase));

            if (document == null)
            {
                logger.Info($"Hotel with GIATA '{giataCode}' not found.", this);
                return null;
            }

            var candidateHotel = document.GetItem();

            if (candidateHotel == null)
            {
                logger.Info($"Hotel with GIATA '{giataCode}' was found in search but item could not be resolved.", this);
                return null;
            }

            return GetMasterItem(
                candidateHotel,
                $"Hotel with GIATA '{giataCode}' was found in search but was not found in master database.");
        }

        private Item GetMasterItem(ID itemId)
        {
            return databaseProvider.GetItem(itemId, DatabaseType.Master);
        }

        private Item GetMasterItem(Item candidateItem, string notFoundInMasterMessage)
        {
            if (candidateItem == null)
            {
                return null;
            }

            var masterItem = GetMasterItem(candidateItem.ID);

            if (masterItem == null)
            {
                logger.Warn($"{notFoundInMasterMessage} ItemId: '{candidateItem.ID}'.", this);
            }

            return masterItem;
        }
    }
}