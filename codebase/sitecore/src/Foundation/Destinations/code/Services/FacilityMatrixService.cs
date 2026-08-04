using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Multisite;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Utils;
using Sitecore;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Services
{
    [Service(typeof(IFacilityMatrixService), Lifetime = Lifetime.Transient)]
    public class FacilityMatrixService : IFacilityMatrixService
    {
        private const string CacheKey = "Destinations.Cache.FacilitiesMatrix";

        private readonly ISitecoreContext context;
        private readonly IHtmlCacheRepository htmlCacheRepository;

        private static string ConfigurationPath => Sitecore.Configuration.Settings.GetSetting("ContentSearch.FacilityMatrix.Configuration");

        public FacilityMatrixService(ISitecoreContext context, IHtmlCacheRepository htmlCacheRepository)
        {
            this.context = context;
            this.htmlCacheRepository = htmlCacheRepository;
        }

        public List<FacilityMatrixConfiguration> GetFacilityMatrix()
        {
            var cacheKey = $"{CacheKey}-{context.Language.Name}";
            var matrix = htmlCacheRepository.GetItem<List<FacilityMatrixConfiguration>>(cacheKey);
            if (matrix != null)
            {
                return matrix;
            }

            matrix = new List<FacilityMatrixConfiguration>();
            var facilityMatrixFolder = context.Database.GetItem(ConfigurationPath, context.Language);

            if (facilityMatrixFolder == null)
            {
                return matrix;
            }

            foreach (Item facilityMatrixConfigurationItem in facilityMatrixFolder.Children.Where(fm => fm.Versions.Count > 0))
            {
                var facilityMatrixConfiguration = MapFacilityMatrixConfiguration(facilityMatrixConfigurationItem);

                foreach (Item facilityMatrixValueItem in facilityMatrixConfigurationItem.Children.Where(fm => fm.Versions.Count > 0))
                {
                    var value = MainUtil.GetInt(facilityMatrixValueItem[Constants.Fields.SitecoreProperty.Value], 0);
                    var mustHaveFacilities = facilityMatrixValueItem[Constants.Fields.FacilityMatrixConfiguration.MustHaveCheckbox] == Constants.Common.CheckboxTrueValue;

                    var facilities = facilityMatrixValueItem.GetItems(Constants.Fields.FacilityMatrixConfiguration.Facilities).Select(x => new FacilityType(x));
                    facilityMatrixConfiguration.Values.AddRange(facilities.Select(x => new FacilityMatrixConfigurationValue { Code = x.Code, Value = value, MustHave = mustHaveFacilities }));
                }

                matrix.Add(facilityMatrixConfiguration);
            }

            if (matrix.Any())
            {
                htmlCacheRepository.StoreItem(cacheKey, matrix);
            }

            return matrix;
        }

        public void EnrichHotelFacilityMatrix(List<Hotel> hotels) => EnrichHotelFacilitiesDatasource(hotels);

        public void EnrichHotelFiltersFacilityMatrix(List<HotelFilters> filters) => EnrichHotelFacilitiesDatasource(filters);

        private static FacilityMatrixConfiguration MapFacilityMatrixConfiguration(Item facilityMatrixConfigurationItem)
            => new FacilityMatrixConfiguration
            {
                Code = facilityMatrixConfigurationItem[Constants.Fields.DatasourceItem.Code],
                Name = facilityMatrixConfigurationItem[Constants.Fields.DatasourceItem.Name],
                ItemName = facilityMatrixConfigurationItem.Name,
                TrackingId = ItemUtils.GetTrackingId(facilityMatrixConfigurationItem),
                TypeTitle = facilityMatrixConfigurationItem[Constants.Fields.FacilityMatrixItem.TypeTitle],
                Description = facilityMatrixConfigurationItem[Constants.Fields.DatasourceItem.Description],
                Icon = facilityMatrixConfigurationItem.GetMediaUrl(Constants.Fields.SitecoreIconItem.Icon),
                FilledIcon = facilityMatrixConfigurationItem.GetMediaUrl(Constants.Fields.FacilityMatrixItem.FilledIcon),
                TooltipText = facilityMatrixConfigurationItem[Constants.Fields.FacilityMatrixItem.TooltipText],
                IsExclusive = MainUtil.GetBool(facilityMatrixConfigurationItem[Constants.Fields.FacilityMatrixItem.IsExclusive], false),
                Id = facilityMatrixConfigurationItem.ID,
            };

        private static FacilityMatrix[] CalculateFilters(List<FacilityMatrixConfiguration> matrix, ICollection<string> facilitiesCodes)
        {
            var filters = new List<FacilityMatrix>();
            foreach (var facilityMatrix in matrix.Where(x => x.Values.Any()))
            {
                var mustHaveFacilities = facilityMatrix.Values.Where(x => x.MustHave).ToList();
                var mustHaveFacilitiesSet = mustHaveFacilities.Select(x => x.Code).ToHashSet();

                if (!mustHaveFacilitiesSet.IsSubsetOf(facilitiesCodes))
                {
                    continue;
                }

                var otherFacilitiesValue = facilityMatrix.Values
                    .Where(x => !x.MustHave)
                    .Where(f => facilitiesCodes.Contains(f.Code))
                    .Sum(f => f.Value);

                var matrixValue = otherFacilitiesValue + mustHaveFacilities.Sum(x => x.Value);

                if (matrixValue > 0)
                {
                    filters.Add(new FacilityMatrix(facilityMatrix.Code, matrixValue));
                }
            }

            return filters.ToArray();
        }

        private static FacilityMatrix[] ApplyOverride(Dictionary<string, string> overrideMatrix, string[] appliedThemes, int value = 99)
            => appliedThemes
                .Where(overrideMatrix.ContainsKey)
                .Select(theme => new FacilityMatrix(overrideMatrix[theme], value--))
                .ToArray();

        private static bool TryApplyMatrixOverride(HotelFacilitiesDatasource hotel, Dictionary<string, string> overrideMapping)
        {
            if (hotel.IsMatrixOverriden && hotel.MatrixOverride != null)
            {
                var matrixOverride = ApplyOverride(overrideMapping, hotel.MatrixOverride);
                if (matrixOverride.Length > 0)
                {
                    hotel.FacilityMatrix = matrixOverride;
                }

                return true;
            }

            return hotel.IsMatrixOverriden;
        }

        private static HashSet<string> CollectFacilityCodes(HotelFacilitiesDatasource hotel)
        {
            var codes = new HashSet<string>();

            var hotelFacilities = hotel.Facilities?.SelectMany(x => x.Items);
            if (hotelFacilities != null)
            {
                var hotelFacilityCodes = hotelFacilities.Select(x => x.GetFacilityTypeCode()).ToHashSet();
                codes.UnionWith(hotelFacilityCodes);
            }

            var filteredFacilities = hotel.FacilitiesFiltered;
            if (filteredFacilities != null)
            {
                var filteredFacilityCodes = filteredFacilities.Select(x => x.Code).ToHashSet();
                codes.UnionWith(filteredFacilityCodes);
            }

            return codes;
        }

        private void EnrichHotelFacilitiesDatasource(IEnumerable<HotelFacilitiesDatasource> data)
        {
            var facilityMatrix = GetFacilityMatrix();

            if (facilityMatrix == null)
            {
                return;
            }

            var overrideMapping = facilityMatrix.ToDictionary(x => x.Id.ToShortID().ToString().ToLowerInvariant(), x => x.Code);

            foreach (var hotel in data)
            {
                if (TryApplyMatrixOverride(hotel, overrideMapping))
                {
                    continue;
                }

                var codes = CollectFacilityCodes(hotel);

                if (codes.Count == 0)
                {
                    continue;
                }

                hotel.FacilityMatrix = CalculateFilters(facilityMatrix, codes);
            }
        }
    }
}
