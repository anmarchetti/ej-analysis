using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Reports.Services;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Commands
{
    /// <summary>
    /// TODO: Update Upload command based on giata code.
    /// </summary>
    public class RunFoodAndDrinkImportCommand : BaseCsvCommand
    {
        private readonly IDestinationsSearchService destinationsSearchService;
        private readonly IDatasourceRepository datasourceRepository;
        private readonly IFoodAndDrinkUploadReportService foodAndDrinkUploadReportService;

        public RunFoodAndDrinkImportCommand(
            ICsvUtilsService csvUtilsService,
            IDestinationsSearchService destinationsSearchService,
            IDatasourceRepository datasourceRepository,
            IFoodAndDrinkUploadReportService foodAndDrinkUploadReportService,
            IDatabaseProvider databaseProvider,
            IDestinationsLogger logger,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService)
            : base(databaseProvider, csvUtilsService, logger, userCreationService, sitecoreUiService)
        {
            this.destinationsSearchService = destinationsSearchService;
            this.datasourceRepository = datasourceRepository;
            this.foodAndDrinkUploadReportService = foodAndDrinkUploadReportService;
        }

        /// <summary>
        /// Synchronize items from supplied file.
        /// </summary>
        /// <param name="contextItem">Context item.</param>
        /// <returns>Updated hotel items.</returns>
        protected override IEnumerable<Item> ProcessItems(Item contextItem)
        {
            var foodAndDrinkUploadData = GetFileData<FoodAndDrinkRow>(contextItem)
                .Where(x => !string.IsNullOrWhiteSpace(x.HotelCode)).ToList();

            var giataCodes = foodAndDrinkUploadData.Select(upload => upload.HotelCode).Distinct();

            var hotels = destinationsSearchService.GetHotelsByGiataCodes(giataCodes.ToArray()).ToList();

            Logger.Info($"Hotels found: {hotels.Count} ({string.Join(",", hotels?.Select(x => x.GiataCode))})", this);

            var hotelsByCodes = hotels
                .GroupBy(x => x.GiataCode)
                .ToDictionary(x => x.Key, x => DatabaseProvider.GetItem(x.First().Uri));

            CleanUpHotelsData(foodAndDrinkUploadData, hotelsByCodes);

            var processedItems = new List<Item>();
            foreach (var foodAndDrinkData in foodAndDrinkUploadData)
            {
                try
                {
                    if (hotelsByCodes.TryGetValue(foodAndDrinkData.HotelCode, out var hotel))
                    {
                        var foodAndDrinkDescription = datasourceRepository.GetOrCreateItem("Food And Drink", Constants.TemplateIds.FoodAndDrinkFacilityRichTextTab, hotel);

                        if (foodAndDrinkDescription != null)
                        {
                            foodAndDrinkDescription.SetValue(Constants.Fields.FacilityRichTextTab.Description, foodAndDrinkData.Description);
                        }

                        processedItems.Add(hotel);
                    }
                }
                catch (Exception ex)
                {
                    var errorMessage = $"Something went wrong during hotel processing";
                    Logger.Error(errorMessage, ex, this);
                    foodAndDrinkUploadReportService.Warn(foodAndDrinkData.HotelCode, foodAndDrinkData.HotelName, errorMessage);
                }
            }

            return processedItems;
        }

        /// <summary>
        /// Clear duplicates hotels in upload data.
        /// </summary>
        /// <param name="uploadRows">Upload data.</param>
        /// <param name="duplicates">Duplicates hotels.</param>
        private void ClearDuplicates(List<FoodAndDrinkRow> uploadRows, out Dictionary<string, IEnumerable<FoodAndDrinkRow>> duplicates)
        {
            duplicates = new Dictionary<string, IEnumerable<FoodAndDrinkRow>>();
            foreach (var uploadRow in uploadRows.GroupBy(x => x.HotelCode).ToDictionary(x => x.Key, x => x.ToList()))
            {
                if (uploadRow.Value.Count > 1)
                {
                    if (!duplicates.ContainsKey(uploadRow.Key))
                    {
                        var duplicatesHotels = uploadRow.Value.Skip(1).ToList();
                        duplicates.Add(uploadRow.Key, duplicatesHotels);
                        duplicatesHotels.ForEach(x => uploadRows.Remove(x));
                    }
                }
            }
        }

        /// <summary>
        /// Clear missed hotels which not found in sitecore.
        /// </summary>
        /// <param name="uploadRows">Upload data.</param>
        /// <param name="hotelItems">Hotel items.</param>
        /// <param name="missedHotels">Missed hotel items.</param>
        private void ClearMissedHotels(List<FoodAndDrinkRow> uploadRows, Dictionary<string, Item> hotelItems, out List<FoodAndDrinkRow> missedHotels)
        {
            missedHotels = new List<FoodAndDrinkRow>();
            foreach (var uploadRow in uploadRows)
            {
                if (!hotelItems.ContainsKey(uploadRow.HotelCode))
                {
                    missedHotels.Add(uploadRow);
                }
            }

            missedHotels.ForEach(x =>
            {
                var hotel = uploadRows.FirstOrDefault(y => y.HotelCode == x.HotelCode);
                if (hotel != null)
                {
                    uploadRows.Remove(hotel);
                }
            });
        }

        /// <summary>
        /// Clear duplicates and missed hotels.
        /// </summary>
        /// <param name="uploadRows">Upload data.</param>
        /// <param name="foundHotels">Found hotels in sitecore.</param>
        private void CleanUpHotelsData(List<FoodAndDrinkRow> uploadRows, Dictionary<string, Item> foundHotels)
        {
            ClearDuplicates(uploadRows, out var duplicates);

            foodAndDrinkUploadReportService.Warn(duplicates.Values.SelectMany(duplicate => duplicate), Constants.ReportErrors.DuplicateHotels);

            ClearMissedHotels(uploadRows, foundHotels, out var missedHotels);

            foodAndDrinkUploadReportService.Warn(missedHotels, Constants.ReportErrors.HotelNotExist);
        }
    }
}
