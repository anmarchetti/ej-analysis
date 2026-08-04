using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Models.Responses;
using easyJet.Foundation.Destinations.Reports.Services;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data.Items;
using Sitecore.Sites;

namespace easyJet.Foundation.Destinations.Commands
{
    public class RunHotelThemesTypesUploadCommand : BaseCsvCommand
    {
        private readonly IDestinationsSearchService destinationSearchService;
        private readonly IHotelThemesUploadReportService hotelThemesUploadReportService;
        private readonly IHotelThemesService hotelThemesService;

        public RunHotelThemesTypesUploadCommand(
            ICsvUtilsService csvUtilsService,
            IDestinationsSearchService destinationSearchService,
            IHotelThemesUploadReportService hotelThemesUploadReportService,
            IHotelThemesService hotelThemesService,
            IDatabaseProvider databaseProvider,
            IDestinationsLogger logger,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService)
            : base(databaseProvider, csvUtilsService, logger, userCreationService, sitecoreUiService)
        {
            this.destinationSearchService = destinationSearchService;
            this.hotelThemesUploadReportService = hotelThemesUploadReportService;
            this.hotelThemesService = hotelThemesService;
        }

        /// <summary>
        /// Synchronize items from supplied file.
        /// </summary>
        /// <param name="contextItem">Context item.</param>
        /// <returns>Updated hotel items.</returns>
        protected override IEnumerable<Item> ProcessItems(Item contextItem)
        {
            var hotelsUploadData = GetFileData<HotelWithThemeRow>(contextItem)
                .Where(x => !string.IsNullOrWhiteSpace(x.HotelCode)).ToList();

            var siteCotext = contextItem.GetSiteContext();
            IEnumerable<HotelThemeResponseItem> hotelThemes = null;
            using (new SiteContextSwitcher(siteCotext))
            {
                hotelThemes = hotelThemesService.GetHotelThemes();
            }

            var giataCodes = hotelsUploadData.Select(model => model.HotelCode).Distinct();

            var hotels = destinationSearchService.GetHotelsByGiataCodes(giataCodes.ToArray()).ToList();
            Logger.Info($"Hotels found: {hotels.Count()} ({string.Join(",", hotels.Select(x => x.GiataCode))})", this);

            var hotelsByCodes = hotels
                .GroupBy(x => x.GiataCode)
                .ToDictionary(x => x.Key, x => DatabaseProvider.GetItem(x.First().Uri));

            CleanUpHotelsData(hotelsUploadData, hotelsByCodes);

            var processedItems = new List<Item>();
            foreach (var hotelData in hotelsUploadData)
            {
                try
                {
                    if (hotelsByCodes.TryGetValue(hotelData.HotelCode, out var hotel))
                    {
                        var theme = hotelThemes.FirstOrDefault(x => !string.IsNullOrWhiteSpace(x.Code) && x.Code == hotelData.HotelThemeCode);

                        hotel.Editing.BeginEdit();
                        if (theme != null)
                        {
                            hotel[Constants.Fields.AccommodationItem.HotelTheme] = theme.Id.ToString();
                            var type = theme?.Types?.FirstOrDefault(x => x.Code == hotelData.HotelTypeCode);
                            if (type != null)
                            {
                                hotel[Constants.Fields.AccommodationItem.Types] = type.Id.ToString();
                            }
                            else if (theme != null)
                            {
                                hotelThemesUploadReportService.Warn(hotelData.HotelCode, hotel.Name, hotelData.HotelThemeName, hotelData.HotelThemeCode, hotelData.HotelTypeName, hotelData.HotelTypeCode, "Theme type wasn't found");
                            }
                        }
                        else
                        {
                            hotelThemesUploadReportService.Warn(hotelData.HotelCode, hotel.Name, hotelData.HotelThemeName, hotelData.HotelThemeCode, hotelData.HotelTypeName, hotelData.HotelTypeCode, "Theme and type weren't found");
                        }

                        hotel.Editing.EndEdit();
                        processedItems.Add(hotel);
                    }
                }
                catch (Exception ex)
                {
                    var errorMessage = $"Something went wrong during hotel processing";
                    Logger.Error(errorMessage, ex, this);
                    hotelThemesUploadReportService.Warn(hotelData.HotelCode, string.Empty, string.Empty, hotelData.HotelThemeCode, string.Empty, hotelData.HotelTypeCode, errorMessage);
                }
            }

            return processedItems;
        }

        /// <summary>
        /// Clear duplicates hotels in upload data.
        /// </summary>
        /// <param name="uploadRows">Upload data.</param>
        /// <param name="duplicates">Duplicates hotels.</param>
        private void ClearDuplicates(List<HotelWithThemeRow> uploadRows, out Dictionary<string, IEnumerable<HotelWithThemeRow>> duplicates)
        {
            duplicates = new Dictionary<string, IEnumerable<HotelWithThemeRow>>();
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
        private void ClearMissedHotels(List<HotelWithThemeRow> uploadRows, Dictionary<string, Item> hotelItems, out List<HotelWithThemeRow> missedHotels)
        {
            missedHotels = new List<HotelWithThemeRow>();
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
        private void CleanUpHotelsData(List<HotelWithThemeRow> uploadRows, Dictionary<string, Item> foundHotels)
        {
            ClearDuplicates(uploadRows, out var duplicates);

            hotelThemesUploadReportService.Warn(duplicates.Values.SelectMany(duplicate => duplicate), Constants.ReportErrors.DuplicateHotels);

            ClearMissedHotels(uploadRows, foundHotels, out var missedHotels);

            hotelThemesUploadReportService.Warn(missedHotels, Constants.ReportErrors.HotelNotExist);
        }
    }
}