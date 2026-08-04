using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.HotelBeds.Exceptions;
using easyJet.Foundation.HotelBeds.Logging;
using easyJet.Foundation.HotelBeds.Models.Domain;
using easyJet.Foundation.HotelBeds.Reports.Services;
using easyJet.Foundation.HotelBeds.Services.Sync;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data.Items;

namespace easyJet.Foundation.HotelBeds.Commands
{
    public class RunResyncFacilitesCommand : BaseCsvCommand
    {
        private readonly IDestinationsSearchService destinationsSearchService;
        private readonly ISyncDataService syncDataService;
        private readonly IResyncFaciltitesReportService resyncFaciltitesReportService;
        private readonly IDatabaseProvider databaseProvider;

        public RunResyncFacilitesCommand(
            ICsvUtilsService csvUtilsService,
            IDestinationsSearchService destinationsSearchService,
            ISyncDataService syncDataService,
            IResyncFaciltitesReportService resyncFaciltitesReportService,
            IDatabaseProvider databaseProvider,
            IHotelBedsLogger logger,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService)
            : base(databaseProvider, csvUtilsService, logger, userCreationService, sitecoreUiService)
        {
            this.destinationsSearchService = destinationsSearchService;
            this.resyncFaciltitesReportService = resyncFaciltitesReportService;
            this.databaseProvider = databaseProvider;
            this.syncDataService = syncDataService;
        }

        /// <summary>
        /// Synchronize items from supplied file.
        /// </summary>
        /// <param name="contextItem">Context item.</param>
        /// <returns>Create or updated items.</returns>
        protected override IEnumerable<Item> ProcessItems(Item contextItem)
        {
            // Removing duplicates rows by atcom code.
            var hotelFaciltiesResyncData = GetFileData<HotelFacilitesResyncRow>(contextItem)
                .Where(hotelFacilityRow => !string.IsNullOrWhiteSpace(hotelFacilityRow.GiataCode))
                .GroupBy(x => x.GiataCode).Select(x => x.First());

            var hotels = GetHotelsByCodes(hotelFaciltiesResyncData.Select(g => g.GiataCode).ToArray());

            var candidatesForResyncing = PrepareHotelItems(hotelFaciltiesResyncData.ToList(), hotels);

            var proccededItems = new List<Item>();
            if (candidatesForResyncing.Any())
            {
                try
                {
                    proccededItems = syncDataService.ResyncFacilities(candidatesForResyncing);
                }
                catch (HotelSyncException ex)
                {
                    resyncFaciltitesReportService.Warn(ex.Code, ex.Name, "Error occured during the resyncing of hotel facilities. Contact Admin for more details.");
                    throw;
                }
            }

            Logger.Info($"Resyncing facilities command has been finished ({proccededItems.Count} hotels were procceded).", this);
            return proccededItems;
        }

        /// <summary>
        /// Prepare hotel data for resyncing.
        /// Get valid hotels from file.
        /// </summary>
        /// <param name="fileModel">Uploaded model of csv file.</param>
        /// <param name="hotelSearchResults">Hotel's search result.</param>
        /// <returns>Dictionary of hotels which are ready for resyncing.</returns>
        private Dictionary<string, HotelItem> PrepareHotelItems(List<HotelFacilitesResyncRow> fileModel, Dictionary<string, List<Item>> hotelSearchResults)
        {
            if (hotelSearchResults.Count == 0)
            {
                resyncFaciltitesReportService.Warn(fileModel, "Hotel does not exist in Sitecore.");
                return new Dictionary<string, HotelItem>();
            }

            Dictionary<string, HotelItem> result = new Dictionary<string, HotelItem>();

            foreach (var row in fileModel)
            {
                // Check if hotel exists in Sitecore.
                if (!hotelSearchResults.TryGetValue(row.GiataCode, out var items))
                {
                    resyncFaciltitesReportService.Warn(row.GiataCode, row.Name, "Hotel does not exist in Sitecore.");
                    continue;
                }

                foreach (var item in items)
                {
                    if (!IsHotelHasHotelBedsCode(item))
                    {
                        resyncFaciltitesReportService.Warn(row.GiataCode, row.Name, "Hotel does not have HotelBeds code.");
                        continue;
                    }

                    string hotelBedsCode = item.Fields[Destinations.Constants.Fields.AccommodationItem.HotelBedsCode].Value;
                    result.Add(hotelBedsCode, new HotelItem()
                    {
                        Item = item,
                        Facilities = item.GetDescendantsByTemplate(Destinations.Constants.TemplateIds.AccommodationFacility)
                    });
                }
            }

            return result;
        }

        /// <summary>
        /// Get Hotels by codes.
        /// </summary>
        /// <param name="codes">Atcom codes.</param>
        /// <returns>Dictionary of Hotels where 'Key' - hotel code, Value - Sitecore Item of Hotels.</returns>
        private Dictionary<string, List<Item>> GetHotelsByCodes(string[] codes)
        {
            if (codes == null || !codes.Any())
            {
                return new Dictionary<string, List<Item>>();
            }

            return destinationsSearchService
                   .GetHotelsByGiataCodes(codes)
                   .GroupBy(x => x.GiataCode)
                   .ToDictionary(key => key.Key, searchResult => searchResult.Select(x => databaseProvider.GetItem(x.Uri)).ToList());
        }

        /// <summary>
        /// Checks if the hotel has hotel beds code.
        /// </summary>
        /// <param name="item">Sitecore Hotel Item.</param>
        /// <returns><see langword="True"/> if the hotel has hotel beds code.</returns>
        private bool IsHotelHasHotelBedsCode(Item item)
        {
            return !string.IsNullOrEmpty(item?.Fields[Destinations.Constants.Fields.AccommodationItem.HotelBedsCode]?.Value);
        }
    }
}