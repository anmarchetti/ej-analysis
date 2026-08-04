using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Reports.Services;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Commands
{
    public class RunHotelOverviewDescriptionUploadCommand : BaseCsvCommand
    {
        private readonly IDestinationsSearchService destinationsSearchService;
        private readonly IHotelOverviewDescriptionUploadReportService reportService;

        public RunHotelOverviewDescriptionUploadCommand(
            ICsvUtilsService csvUtilsService,
            IDestinationsLogger logger,
            IDestinationsSearchService destinationsSearchService,
            IDatabaseProvider databaseProvider,
            IHotelOverviewDescriptionUploadReportService reportService,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService)
            : base(databaseProvider, csvUtilsService, logger, userCreationService, sitecoreUiService)
        {
            this.destinationsSearchService = destinationsSearchService;

            this.reportService = reportService;
        }

        protected override IEnumerable<Item> ProcessItems(Item contextItem)
        {
            var hotelsUploadData = GetFileData<HotelOverviewDescriptionUpload>(contextItem)
                .Where(x => !string.IsNullOrWhiteSpace(x.GiataCode)).ToList();

            var giataCodes = hotelsUploadData.Select(model => model.GiataCode).Distinct();

            var hotels = destinationsSearchService.GetHotelsByGiataCodes(giataCodes.ToArray())?.ToList() ?? new List<BaseHotelSearchResultItem>();
            Logger.Info($"Hotels found: {hotels.Count} ({string.Join(",", hotels.Select(x => x.GiataCode))})", this);

            var hotelsByCodes = hotels
                .GroupBy(x => x.GiataCode)
                .ToDictionary(x => x.Key, x => DatabaseProvider.GetItem(x.First().Uri));

            hotelsUploadData = ClearDuplicates(hotelsUploadData, out var duplicates);
            reportService.Warn(duplicates.Values.SelectMany(duplicate => duplicate), Constants.ReportErrors.DuplicateHotels);

            hotelsUploadData = ClearMissedHotels(hotelsUploadData, hotelsByCodes, out var missedHotels);
            reportService.Warn(missedHotels, Constants.ReportErrors.HotelNotExist);

            var processedItems = new List<Item>();
            foreach (var hotelData in hotelsUploadData)
            {
                try
                {
                    if (hotelsByCodes.TryGetValue(hotelData.GiataCode, out var hotelItem))
                    {
                        hotelItem.Editing.BeginEdit();
                        hotelItem[Constants.Fields.AccommodationItem.OverviewDescription] = hotelData.HotelOverviewDescription;
                        hotelItem.Editing.EndEdit();
                        processedItems.Add(hotelItem);
                    }
                }
                catch (Exception ex)
                {
                    var errorMessage = "Something went wrong during hotel processing";
                    Logger.Error(errorMessage, ex, this);
                    reportService.Warn(hotelData.GiataCode, string.Empty, errorMessage);
                }
            }

            return processedItems;
        }

        /// <summary>
        /// Clear duplicates hotels in upload data.
        /// </summary>
        /// <param name="uploadRows">Upload data.</param>
        /// <param name="duplicates">Duplicates hotels.</param>
        private List<HotelOverviewDescriptionUpload> ClearDuplicates(List<HotelOverviewDescriptionUpload> uploadRows, out Dictionary<string, IEnumerable<HotelOverviewDescriptionUpload>> duplicates)
        {
            duplicates = new Dictionary<string, IEnumerable<HotelOverviewDescriptionUpload>>();
            foreach (var uploadRow in uploadRows.GroupBy(x => x.GiataCode).ToDictionary(x => x.Key, x => x.ToList()))
            {
                if (uploadRow.Value.Count > 1)
                {
                    if (!duplicates.ContainsKey(uploadRow.Key))
                    {
                        var duplicatesHotels = uploadRow.Value.Skip(1).ToList();
                        duplicates.Add(uploadRow.Key, duplicatesHotels);
                    }
                }
            }

            return uploadRows.Distinct().ToList();
        }

        /// <summary>
        /// Clear missed hotels which not found in sitecore.
        /// </summary>
        /// <param name="uploadRows">Upload data.</param>
        /// <param name="hotelItems">Hotel items.</param>
        /// <param name="missedHotels">Missed hotel items.</param>
        private List<HotelOverviewDescriptionUpload> ClearMissedHotels(List<HotelOverviewDescriptionUpload> uploadRows, Dictionary<string, Item> hotelItems, out List<HotelOverviewDescriptionUpload> missedHotels)
        {
            missedHotels = new List<HotelOverviewDescriptionUpload>();
            foreach (var uploadRow in uploadRows)
            {
                if (!hotelItems.ContainsKey(uploadRow.GiataCode))
                {
                    missedHotels.Add(uploadRow);
                }
            }

            return uploadRows.Except(missedHotels).ToList();
        }
    }
}