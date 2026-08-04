using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Mappers;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Models.Requests;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Newtonsoft.Json;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Diagnostics;

namespace easyJet.Foundation.Destinations.Services
{
    [Service(typeof(IHotelFacilitiesService), Lifetime = DependencyInjection.Lifetime.Transient)]
    public class HotelFacilitiesService : BatchSearchService, IHotelFacilitiesService
    {
        // Expedia property-level facility type groups use codes like EXP-P-1, EXP-P-2, etc.
        private const string ExpediaPropertyFacilityGroupCodePrefix = "EXP-P";
        // Expedia room-level facility type groups use codes like EXP-R-1, EXP-R-2, etc.
        private const string ExpediaRoomFacilityGroupCodePrefix = "EXP-R";
        private readonly IDestinationsRepository repository;
        private readonly IDatasourceRepository datasourceRepository;
        private readonly ISearchDatasourceRepository searchDatasourceRepository;
        private readonly IDestinationsLogger logger;
        private readonly int sizeOfSubset;

        public HotelFacilitiesService(
            BaseSettings settings,
            IDestinationsRepository repository,
            IDatasourceRepository datasourceRepository,
            ISearchDatasourceRepository searchDatasourceRepository,
            IDestinationsLogger logger)
        {
            this.repository = repository;
            this.datasourceRepository = datasourceRepository;
            this.searchDatasourceRepository = searchDatasourceRepository;
            this.logger = logger;
            sizeOfSubset = settings.GetIntSetting("Destinations.ChunkSize", 50);
        }

        /// <inheritdoc/>
        public Dictionary<string, List<FacilityType>> GetHotelsFacilities(string[] ids)
        {
            // Remove duplicate codes
            ids = ids.Distinct().ToArray();

            var chunks = ids.Chunk(sizeOfSubset).ToList();
            var searchResultItems = BatchProcess(chunks, chunk => repository.SearchHotelsFacilitiesByIds(chunk.ToList())).Select(x => x.Document);
            var hotelFacilities = SourcesSearchResultMapper.MapSourcesSearchResultByAtcomCodes(ids, searchResultItems, MapFacility);

            var result = GetFacilitiesDictionary(hotelFacilities);
            return result;
        }

        public void Create(Item parentItem, List<FacilityContent> facilities, ID facilitiesFolderTemplateId, ID facilityItemTemplateId)
        {
            ProcessFacilities(parentItem, facilities, facilitiesFolderTemplateId, facilityItemTemplateId, updateExisting: false);
        }

        public void Upsert(Item parentItem, List<FacilityContent> facilities, ID facilitiesFolderTemplateId, ID facilityItemTemplateId)
        {
            ProcessFacilities(parentItem, facilities, facilitiesFolderTemplateId, facilityItemTemplateId, updateExisting: true);
        }

        private static Dictionary<string, Item> GetExistingFacilities(Item folder, ID templateId)
        {
            return folder.Children
                .Where(x => x.TemplateID == templateId)
                .Where(x => !string.IsNullOrWhiteSpace(x[Constants.Fields.BaseFacilityItem.FacilityType]))
                .GroupBy(
                    x => x[Constants.Fields.BaseFacilityItem.FacilityType],
                    StringComparer.InvariantCultureIgnoreCase)
                .ToDictionary(
                    x => x.Key,
                    x => x.First(),
                    StringComparer.InvariantCultureIgnoreCase);
        }

        private static void PopulateFacilityItem(Item facilityItem, Item facilityType, FacilityContent facility, bool createNewVersion)
        {
            var changes = new Dictionary<string, string>
            {
                { Constants.Fields.BaseFacilityItem.FacilityType, facilityType.ID.ToString() },
                { Constants.Fields.BaseFacilityItem.Name, facility.Name },
                { Constants.Fields.AccommodationFacilityItem.TextValue, facility.Value }
            };

            facilityItem.BulkUpdate(changes, allowEmptyValues: false, createNewVersion: createNewVersion);
        }

        private static Item ResolveExpediaFacilityType(IEnumerable<Item> facilityTypes, string expediaFacilityGroupPrefix)
        {
            if (facilityTypes == null)
            {
                return null;
            }

            return facilityTypes.FirstOrDefault(x => IsFacilityTypeInGroup(x, expediaFacilityGroupPrefix))
                ?? facilityTypes.FirstOrDefault(x => x != null);
        }

        private static bool IsFacilityTypeInGroup(Item facilityType, string facilityGroupCodePrefix)
        {
            if (facilityType == null || string.IsNullOrWhiteSpace(facilityGroupCodePrefix))
            {
                return false;
            }

            var facilityGroupCode = facilityType.Parent?[Constants.Fields.DatasourceItem.Code];

            return !string.IsNullOrWhiteSpace(facilityGroupCode) &&
                   facilityGroupCode.StartsWith(facilityGroupCodePrefix, StringComparison.InvariantCultureIgnoreCase);
        }

        private static string GetExpectedExpediaFacilityGroupPrefix(ID facilityItemTemplateId)
        {
            if (facilityItemTemplateId == Constants.TemplateIds.AccommodationFacility)
            {
                return ExpediaPropertyFacilityGroupCodePrefix;
            }

            if (facilityItemTemplateId == Constants.TemplateIds.RoomFacility)
            {
                return ExpediaRoomFacilityGroupCodePrefix;
            }

            return null;
        }

        private void ProcessFacilities(Item parentItem, List<FacilityContent> facilities, ID facilitiesFolderTemplateId, ID facilityItemTemplateId, bool updateExisting)
        {
            if (parentItem == null)
            {
                throw new ArgumentNullException(nameof(parentItem));
            }

            if (facilities == null || !facilities.Any())
            {
                logger.Info($"No facilities found for item '{parentItem.Paths.FullPath}'. Operation skipped.", this);
                return;
            }

            var facilityTypesByCode = ResolveFacilityTypes(facilities, facilityItemTemplateId);

            if (!facilityTypesByCode.Any())
            {
                logger.Warn($"No matching facility types found for item '{parentItem.Paths.FullPath}'. Operation skipped.", this);
                return;
            }

            var facilitiesFolder = datasourceRepository.GetOrCreateFolderItem(parentItem, Constants.Fields.AccommodationItem.Facilities, facilitiesFolderTemplateId);

            var existingFacilities = GetExistingFacilities(facilitiesFolder, facilityItemTemplateId);

            foreach (var facility in facilities)
            {
                if (string.IsNullOrWhiteSpace(facility?.Code))
                {
                    logger.Warn($"Facility code is missing. Item: '{parentItem.Paths.FullPath}'. Facility skipped.", this);
                    continue;
                }

                var facilityCode = facility.Code.Trim();

                if (!facilityTypesByCode.TryGetValue(facilityCode, out var facilityType))
                {
                    logger.Warn($"Facility type '{facility.Code}' not found. Item: '{parentItem.Paths.FullPath}'. Skipped.", this);
                    continue;
                }

                var facilityTypeId = facilityType.ID.ToString();

                if (existingFacilities.TryGetValue(facilityTypeId, out var existingItem))
                {
                    if (updateExisting)
                    {
                        UpdateFacilityValue(existingItem, facility);
                    }
                    else
                    {
                        logger.Info($"Facility '{facilityCode}' already exists for item '{parentItem.Paths.FullPath}'. Create skipped.", this);
                    }

                    continue;
                }

                var facilityItem = datasourceRepository.GetOrCreateItem(facilityType.Name, facilityItemTemplateId, facilitiesFolder, true);

                PopulateFacilityItem(facilityItem, facilityType, facility, createNewVersion: updateExisting);

                // Track the newly created item so later duplicates in the same batch are skipped
                existingFacilities[facilityTypeId] = facilityItem;
            }
        }

        private Dictionary<string, Item> ResolveFacilityTypes(IEnumerable<FacilityContent> facilities, ID facilityItemTemplateId)
        {
            var facilityCodes = facilities
                .Where(x => !string.IsNullOrWhiteSpace(x?.Code))
                .Select(x => x.Code.Trim())
                .Distinct(StringComparer.InvariantCultureIgnoreCase)
                .ToList();

            if (!facilityCodes.Any())
            {
                return new Dictionary<string, Item>(StringComparer.InvariantCultureIgnoreCase);
            }

            var expectedExpediaFacilityGroupPrefix = GetExpectedExpediaFacilityGroupPrefix(facilityItemTemplateId);

            var facilityTypes = searchDatasourceRepository.GetAllItemsByCodes(
                facilityCodes, Constants.TemplateIds.FacilityType)
                ?? Enumerable.Empty<Item>();

            return facilityTypes
                .Where(x => x != null)
                .Where(x =>
                    !string.IsNullOrWhiteSpace(x[Constants.Fields.DatasourceItem.Code]))
                .GroupBy(
                    x => x[Constants.Fields.DatasourceItem.Code].Trim(),
                    StringComparer.InvariantCultureIgnoreCase)
                .ToDictionary(
                    x => x.Key,
                    x => ResolveExpediaFacilityType(x, expectedExpediaFacilityGroupPrefix),
                    StringComparer.InvariantCultureIgnoreCase);
        }

        private void UpdateFacilityValue(Item facilityItem, FacilityContent facility)
        {
            if (string.IsNullOrWhiteSpace(facility?.Value))
            {
                logger.Info($"Facility value is null for item '{facilityItem.Paths.FullPath}'. Update skipped.", this);
                return;
            }

            var changes = new Dictionary<string, string> { { Constants.Fields.AccommodationFacilityItem.TextValue, facility.Value } };

            facilityItem.BulkUpdate(changes, allowEmptyValues: false, createNewVersion: true);

            logger.Info($"Updated facility value for item '{facilityItem.Paths.FullPath}'.", this);
        }

        private KeyValuePair<string, List<FacilityType>> MapFacility(string code, HotelFacilitiesSearchResultItem data)
        {
            return new KeyValuePair<string, List<FacilityType>>(code, data.FilteredFacilities?.Select(JsonConvert.DeserializeObject<FacilityType>).ToList());
        }

        private Dictionary<string, List<FacilityType>> GetFacilitiesDictionary(IEnumerable<KeyValuePair<string, List<FacilityType>>> hotelFacilities)
        {
            var result = new Dictionary<string, List<FacilityType>>();
            foreach (var hotelFacility in hotelFacilities)
            {
                if (!result.ContainsKey(hotelFacility.Key))
                {
                    result.Add(hotelFacility.Key, hotelFacility.Value);
                }
                else
                {
                    Log.Warn($"Has duplicate accommodation with code {hotelFacility.Key}", this);
                }
            }

            return result;
        }
    }
}