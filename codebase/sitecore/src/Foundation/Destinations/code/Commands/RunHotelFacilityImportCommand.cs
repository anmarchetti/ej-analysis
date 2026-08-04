using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Reports.Services;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.Multisite.Extensions;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.SecurityModel;
using Sitecore.Shell.Framework.Commands;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Foundation.Destinations.Commands
{
    /// <summary>
    /// triggered from /sitecore/content/EasyJet/Holidays/Home/Destinations context menu,
    /// adds facilities from .csv file to hotels. Hotels are matched by their GIATA code.
    /// </summary>
    public class RunHotelFacilityImportCommand : BaseItemProgressReportingCommand
    {
        private readonly BaseMediaManager mediaManager;
        private readonly ICsvUtilsService csvUtilsService;
        private readonly IDestinationsSearchService destinationsSearchService;
        private readonly IDatasourceRepository datasourceRepository;
        private readonly IFacilityUploadReportService facilityUploadReportService;
        private readonly IDestinationsLogger logger;
        private readonly ISitecoreUIService sitecoreUiService;
        private bool hasErrorsDuringUpload = false;

        public RunHotelFacilityImportCommand(
            BaseMediaManager mediaManager,
            ICsvUtilsService csvUtilsService,
            IDestinationsSearchService destinationsSearchService,
            IDatasourceRepository datasourceRepository,
            IFacilityUploadReportService facilityUploadReportService,
            IDatabaseProvider databaseProvider,
            IDestinationsLogger logger,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService)
            : base(databaseProvider, logger, userCreationService, sitecoreUiService)
        {
            this.mediaManager = mediaManager;
            this.csvUtilsService = csvUtilsService;
            this.destinationsSearchService = destinationsSearchService;
            this.datasourceRepository = datasourceRepository;
            this.facilityUploadReportService = facilityUploadReportService;
            this.logger = logger;
            this.sitecoreUiService = sitecoreUiService;
        }

        /// <inheritdoc />
        protected override bool IsCommandContextValid(CommandContext context)
        {
            var item = context.Items.FirstOrDefault();

            var shouldShowItem = item?.TemplateID.Equals(Constants.TemplateIds.DestinationsFolder) ?? false;

            if (!shouldShowItem)
            {
                return false;
            }

            FileField file = item.Fields[Constants.Fields.DestinationsFolder.FacilityUpload];

            return file.ContainsCsvFile();
        }

        /// <summary>
        /// Show modal window.
        /// </summary>
        /// <param name="args">ClientPipelineArgs args.</param>
        protected override void PostAction(ClientPipelineArgs args)
        {
            if (hasErrorsDuringUpload)
            {
                sitecoreUiService.ClientResponse_ShowError("Error is thrown during uploading facilities, please contact to administrator.", string.Empty);
            }
            else
            {
                sitecoreUiService.ClientResponse_Alert("Facilities were uploaded successfully.");
            }

            base.PostAction(args);
        }

        /// <summary>
        /// Synchronize items from supplied file.
        /// </summary>
        /// <param name="contextItem">Context item.</param>
        /// <returns>Create or updated items.</returns>
        protected override IEnumerable<Item> ProcessItems(Item contextItem)
        {
            var fileItem = new FileField(contextItem.Fields[Constants.Fields.DestinationsFolder.FacilityUpload]).MediaItem;
            var synchronizedItems = new List<Item>();

            try
            {
                if (fileItem == null)
                {
                    return Enumerable.Empty<Item>();
                }

                IList<FacilityUpload> facilityUploadModels;

                using (var mediaStream = mediaManager.GetMedia(fileItem).GetStream())
                {
                    facilityUploadModels = csvUtilsService.ReadFromCsv<FacilityUpload>(mediaStream.Stream);
                }

                var giataCodes = facilityUploadModels.Select(model => model.HotelCode).Distinct();

                var accommodations = destinationsSearchService.GetHotelsByGiataCodes(giataCodes.ToArray())
                                                           .Select(resultItem => DatabaseProvider.GetItem(resultItem.Uri))
                                                           .ToList();

                if (accommodations.Count == 0)
                {
                    facilityUploadReportService.Warn(facilityUploadModels, Constants.ReportErrors.HotelNotExist);
                    return Enumerable.Empty<Item>();
                }

                var accommodationFacilitiesDataMapper = facilityUploadModels
                    .GroupBy(q => q.HotelCode)
                    .ToDictionary(m => m.Key, m => m.GroupBy(x => $"{x.FacilityCode}{x.FacilityGroup}")
                                                .Where(x => !string.IsNullOrEmpty(x.Key))
                                                .ToDictionary(k => k.Key, v => v.ToList()));

                CleanUpFacilitiesData(accommodationFacilitiesDataMapper, accommodations.GroupBy(x => x.Fields[Constants.Fields.AccommodationItem.GiataCode].Value).ToDictionary(x => x.Key, x => x.FirstOrDefault()?.Name));

                var facilitiesCodes = accommodationFacilitiesDataMapper.SelectMany(x => x.Value.Values.SelectMany(k => k.Select(o => o.FacilityCode)));
                var facilityTypesFolder = contextItem.Database.SelectSingleItem($"{contextItem.GetDataFolderQuery()}/*[@@templateid='{Constants.TemplateIds.FacilityTypesFolder}']");
                var facilityTypeCodesIds = GetFacilityTypesByCodes(facilityTypesFolder, facilitiesCodes)
                    .Select(x => new
                    {
                        TypeCode = x.Key,
                        FacilityTypeData = new FacilityTypeData
                        {
                            FacilityTypeId = x.Value.ID,
                            FacilityTypeGroup = x.Value.Parent.Name
                        }
                    }).ToDictionary(x => x.TypeCode, x => x.FacilityTypeData);

                using (new SecurityDisabler())
                using (new DatabaseCacheDisabler())
                using (new BulkUpdateContext())
                {
                    foreach (var accommodation in accommodations)
                    {
                        synchronizedItems.AddRange(ProcessAccommodation(contextItem, accommodation, accommodationFacilitiesDataMapper, facilityTypeCodesIds));
                    }
                }

                return synchronizedItems.Where(s => s != null);
            }
            catch (Exception ex)
            {
                var errorMessage = $"Error is thrown during processing data from file with id: {fileItem?.ID}";
                facilityUploadReportService.Warn(Constants.Common.Unknown, Constants.Common.Unknown, Constants.Common.Unknown, Constants.Common.Unknown, Constants.Common.Unknown, Constants.Common.Unknown, errorMessage);
                LogErrorMessage(ex, errorMessage);
                return Enumerable.Empty<Item>();
            }
        }

        /// <summary>
        /// Remove missed accommodations from facility upload data.
        /// </summary>
        /// <param name="mapper">Hotel Codes -> FacilitiesUploads models collection.</param>
        /// <param name="indexedHotels">Hotel Codes from Destinations.</param>
        /// <param name="missedAccommodations">Collection of missed hotels.</param>
        private static void RemoveMissedAccommodations(Dictionary<string, Dictionary<string, List<FacilityUpload>>> mapper, Dictionary<string, string> indexedHotels, out List<FacilityUpload> missedAccommodations)
        {
            var notIndexedAccommodationCodes = mapper.Keys.Where(k => !indexedHotels.Keys.Contains(k)).ToArray();
            missedAccommodations = new List<FacilityUpload>();

            // This needs for that facilities shouldn't added to hotel with empty code field.
            foreach (var accommodationCode in notIndexedAccommodationCodes)
            {
                if (mapper.TryGetValue(accommodationCode, out var accommodation))
                {
                    missedAccommodations.AddRange(
                        accommodation.Values
                            .SelectMany(facilities => facilities)
                            .Where(upload => !string.IsNullOrEmpty(upload.HotelCode)));

                    mapper.Remove(accommodationCode);
                }
            }
        }

        /// <summary>
        /// Remove duplicate facilities from facility upload data.
        /// </summary>
        /// <param name="mapper">Hotel Codes -> FacilitiesUploads models collection.</param>
        /// <param name="duplicateFacilityUploads">Collection of duplicates facility names.</param>
        private static void RemoveDuplicateFacilities(Dictionary<string, Dictionary<string, List<FacilityUpload>>> mapper, out List<FacilityUpload> duplicateFacilityUploads)
        {
            duplicateFacilityUploads = new List<FacilityUpload>();

            foreach (var hotelFacilities in mapper)
            {
                foreach (var facilities in hotelFacilities.Value)
                {
                    if (facilities.Value.Count > 1)
                    {
                        duplicateFacilityUploads.Add(facilities.Value.Last());
                    }
                }
            }

            foreach (var duplicateFacilityUpload in duplicateFacilityUploads)
            {
                mapper[duplicateFacilityUpload.HotelCode].Remove($"{duplicateFacilityUpload.FacilityCode}{duplicateFacilityUpload.FacilityGroup}");
            }
        }

        private IEnumerable<Item> ProcessAccommodation(Item contextItem, Item accommodation, Dictionary<string, Dictionary<string, List<FacilityUpload>>> accommodationFacilitiesDataMapper, Dictionary<string, FacilityTypeData> facilityTypeCodesIds)
        {
            var hotelGiataCode = accommodation.Fields[Constants.Fields.AccommodationItem.GiataCode].Value;

            if (!accommodationFacilitiesDataMapper.TryGetValue(hotelGiataCode, out var facilities) || !facilities.Any())
            {
                yield break;
            }

            var facilitiesFolder = datasourceRepository.GetOrCreateItem(Constants.Fields.AccommodationItem.Facilities, Constants.TemplateIds.AccommodationFacilitiesFolder, accommodation);
            var hotelFacilities = facilitiesFolder.GetChildren()
                .GroupBy(x => GetFacilityTypeCode(((MultilistField)x.Fields[Constants.Fields.BaseFacilityItem.FacilityType])
                    .GetItems().FirstOrDefault()))
                .Where(x => !string.IsNullOrEmpty(x.Key))
                .ToDictionary(g => g.Key, g => g.FirstOrDefault());

            foreach (var facility in facilities)
            {
                yield return ProcessFacility(contextItem, accommodation, facilityTypeCodesIds, facility, hotelFacilities, facilitiesFolder, facilities);
            }
        }

        private Item ProcessFacility(Item contextItem, Item accommodation, Dictionary<string, FacilityTypeData> facilityTypeCodesIds, KeyValuePair<string, List<FacilityUpload>> facility, Dictionary<string, Item> hotelFacilities, Item facilitiesFolder, Dictionary<string, List<FacilityUpload>> facilities)
        {
            var hotelFacility = facility.Value.First();

            try
            {
                Item facilityItem = null;
                var isExistsFacilityType = facilityTypeCodesIds.TryGetValue(facility.Key, out var facilityType);

                if (isExistsFacilityType && !hotelFacilities.TryGetValue(facility.Key, out facilityItem))
                {
                    var facilityTypeItem = contextItem.Database.GetItem(facilityType.FacilityTypeId);
                    facilityItem = datasourceRepository.GetOrCreateItem(ItemUtil.ProposeValidItemName(facilityTypeItem.Name), Constants.TemplateIds.AccommodationFacility, facilitiesFolder, false);
                }

                if (!isExistsFacilityType)
                {
                    facilityUploadReportService.Warn(hotelFacility.HotelCode, hotelFacility.FacilityCode, hotelFacility.FacilityName, hotelFacility.FacilityGroup, accommodation.Name, string.Empty, Constants.ReportErrors.FacilityNotFound);
                    return null;
                }

                facilityItem.BulkUpdate(Constants.Fields.BaseFacilityItem.FacilityType, facilityType.FacilityTypeId.ToString());
                return facilityItem;
            }
            catch (Exception ex)
            {
                var errorMessage = $"Error is thrown during updating facilities of accommodation {accommodation.Name} with id: {accommodation.ID}, for facility with name: {hotelFacility.FacilityName} and code: {hotelFacility.FacilityCode}. Error: {ex}";
                facilityUploadReportService.Warn(facilities.Values.SelectMany(x => x), errorMessage);
                LogErrorMessage(ex, errorMessage);
                return null;
            }
        }

        /// <summary>
        /// Log error message to logs.
        /// </summary>
        /// <param name="ex">Error object</param>
        /// <param name="message">Error message.</param>
        private void LogErrorMessage(Exception ex, string message)
        {
            hasErrorsDuringUpload = true;
            logger.Error(message, ex, this);
        }

        /// <summary>
        /// Clean up facility upload data.
        /// Remove missed accommodations and duplicate facilities.
        /// </summary>
        /// <param name="mapper">Hotel Codes -> FacilitiesUploads models collection.</param>
        /// <param name="indexedHotels">Accommodation codes from Destinations.</param>
        private void CleanUpFacilitiesData(Dictionary<string, Dictionary<string, List<FacilityUpload>>> mapper, Dictionary<string, string> indexedHotels)
        {
            RemoveMissedAccommodations(mapper, indexedHotels, out var missedAccommodations);
            facilityUploadReportService.Warn(missedAccommodations, Constants.ReportErrors.HotelNotExist);

            RemoveDuplicateFacilities(mapper, out var duplicateFacilityUploads);
            facilityUploadReportService.Warn(
            duplicateFacilityUploads.Select(x =>
            {
                x.HotelName = indexedHotels[x.HotelCode];
                return x;
            }), Constants.ReportErrors.DuplicateHotelFacilityCodes);
        }

        /// <summary>
        /// Get facility types by codes.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <param name="codes">Facilities types code.</param>
        /// <returns>Facilities by codes.</returns>
        private Dictionary<string, Item> GetFacilityTypesByCodes(Item item, IEnumerable<string> codes)
        {
            return item
                    .GetDescendantsByTemplate(Constants.TemplateIds.FacilityType)
                    .Where(x => IsValidFacilityTypeCode(x, codes))
                    .GroupBy(GetFacilityTypeCode)
                    .ToDictionary(x => x.Key, x => x.First());
        }

        /// <summary>
        /// Check that code is not empty and that codes collection contains faclility type code.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <param name="codes">Facility types codes.</param>
        /// <returns>True if facility type code is valid.</returns>
        private bool IsValidFacilityTypeCode(Item item, IEnumerable<string> codes)
        {
            var code = item?[Constants.Fields.DatasourceItem.Code] ?? string.Empty;
            return !string.IsNullOrEmpty(code) && codes.Contains(code);
        }

        /// <summary>
        /// Build key by facility type code and group.
        /// </summary>
        /// <param name="item">Sitecore facility type item.</param>
        /// <returns>Facility type code.</returns>
        private string GetFacilityTypeCode(Item item)
        {
            var code = item?[Constants.Fields.DatasourceItem.Code] ?? string.Empty;
            return string.IsNullOrEmpty(code) || item == null
                ? string.Empty
                : $"{code}{item.Parent.Name}";
        }
    }
}