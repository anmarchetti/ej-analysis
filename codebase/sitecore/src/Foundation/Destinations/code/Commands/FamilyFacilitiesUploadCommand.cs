using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Extensions;
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
    public class FamilyFacilitiesUploadCommand : BaseCsvCommand
    {
        private readonly IFamilyFacilityUploadReportService familyFacilityUploadReportService;
        private readonly IDestinationsSearchService destinationsSearchService;
        private readonly IDatasourceRepository datasourceRepository;

        public FamilyFacilitiesUploadCommand(
            IFamilyFacilityUploadReportService familyFacilityUploadReportService,
            IDestinationsSearchService destinationsSearchService,
            IDatasourceRepository datasourceRepository,
            IDatabaseProvider databaseProvider,
            ICsvUtilsService csvUtilsService,
            IDestinationsLogger logger,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService)
            : base(databaseProvider, csvUtilsService, logger, userCreationService, sitecoreUiService)
        {
            this.familyFacilityUploadReportService = familyFacilityUploadReportService;
            this.destinationsSearchService = destinationsSearchService;
            this.datasourceRepository = datasourceRepository;
        }

        protected override IEnumerable<Item> ProcessItems(Item contextItem)
        {
            var facilities = GetFileData<FamilyFacilityTabRow>(contextItem);

            LogMissingGiataCode(facilities.Where(x => string.IsNullOrEmpty(x.GiataCode)));

            var duplicateItems = facilities.Where(x => !string.IsNullOrEmpty(x.GiataCode)).GroupBy(x => x.GiataCode).Where(group => group.Count() > 1).ToList();
            if (duplicateItems.Any())
            {
                LogDuplications(duplicateItems);
            }

            var facilitiesByGiataCode = facilities.Distinct(new FamilyFacilityTabComparer()).ToDictionary(row => row.GiataCode.ToLower(), row => row);
            var hotels = destinationsSearchService.GetHotelsByGiataCodes(facilitiesByGiataCode.Keys.ToArray())?.ToList();

            LogMissingHotels(hotels, facilitiesByGiataCode);

            var processedItems = ApplyChanges(hotels, facilitiesByGiataCode);

            return processedItems;
        }

        private void LogMissingGiataCode(IEnumerable<FamilyFacilityTabRow> dataRows)
        {
            foreach (var dataRow in dataRows)
            {
                familyFacilityUploadReportService.Warn(dataRow.GiataCode, dataRow.HotelName, "Missing Giata code.");
            }
        }

        private void LogMissingHotels(IList<BaseHotelSearchResultItem> foundHotels, IDictionary<string, FamilyFacilityTabRow> facilitiesByGiataCode)
        {
            if (foundHotels == null || !foundHotels.Any())
            {
                foreach (var dataRow in facilitiesByGiataCode.Values)
                {
                    familyFacilityUploadReportService.Warn(dataRow.GiataCode, dataRow.HotelName, "Couldn't find hotel in the index.");
                }

                return;
            }

            foreach (var dataRow in facilitiesByGiataCode.Where(x => !foundHotels.Any(h => h.GiataCode.Equals(x.Key))))
            {
                familyFacilityUploadReportService.Warn(dataRow.Value.GiataCode, dataRow.Value.HotelName, "Couldn't find hotel in the index.");
            }
        }

        private void LogDuplications(IEnumerable<IGrouping<string, FamilyFacilityTabRow>> duplications)
        {
            foreach (var dataRow in duplications)
            {
                familyFacilityUploadReportService.Warn(dataRow.Key, dataRow.First().HotelName, "Duplicate item.");
            }
        }

        private IEnumerable<Item> ApplyChanges(IEnumerable<BaseHotelSearchResultItem> hotels, Dictionary<string, FamilyFacilityTabRow> facilitiesByGiataCode)
        {
            var processedItems = new List<Item>();

            foreach (var hotel in hotels.Select(x => x.GetItem()))
            {
                try
                {
                    var facilityRow = facilitiesByGiataCode[hotel[Constants.Fields.AccommodationItem.GiataCode]];
                    var facilityTab = datasourceRepository.GetOrCreateItem("Family Facilities", Constants.TemplateIds.FamilyFacilityRichTextTab, hotel);

                    if (facilityTab != null)
                    {
                        facilityTab.SetValue(Constants.Fields.FacilityRichTextTab.Description, facilityRow.Description);
                    }
                    else
                    {
                        familyFacilityUploadReportService.Warn(hotel[Constants.Fields.AccommodationItem.GiataCode], hotel.Name, "Error fetching or creating new facility tab for the item");
                    }

                    processedItems.Add(hotel);
                }
                catch (Exception ex)
                {
                    var errorMessage = $"Something went wrong during hotel processing";
                    Logger.Error(errorMessage, ex, this);
                    familyFacilityUploadReportService.Warn(hotel[Constants.Fields.AccommodationItem.GiataCode], hotel.Name, errorMessage);
                }
            }

            return processedItems;
        }
    }
}
