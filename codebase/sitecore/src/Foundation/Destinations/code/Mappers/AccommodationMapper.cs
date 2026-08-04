using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Models.Domain;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Type = easyJet.Foundation.Destinations.Models.Domain.Type;

namespace easyJet.Foundation.Destinations.Mappers
{
    public static class AccommodationMapper
    {
        public static Hotel MapFromSearchResultItem(string atcomCode, HotelSearchResultItem document)
        {
            return new Hotel
            {
                Code = atcomCode,
                GiataCode = document.GiataCode,
                Name = document.ItemName,
                ItemName = document.Name,
                Description = document.Description,
                Longitude = document.Longitude,
                Latitude = document.Latitude,
                StarRating = document.StarRating,
                Address = document.Address,
                City = document.City,
                PostalCode = document.PostalCode,
                Website = document.Website,
                Email = document.Email,
                BookingPhone = document.BookingPhone,
                ManagementPhone = document.ManagementPhone,
                HotelPhone = document.HotelPhone,
                FaxNumber = document.FaxNumber,
                Strapline = document.Strapline,
                Rating = document.HotelRating,
                TripAdvisorId = document.TripAdvisorId,
                NumberOfReviews = document.TotalNumberOfReviews,
                KeySellingPoint1 = document.KeySellingPoint1,
                KeySellingPoint2 = document.KeySellingPoint2,
                ImageUrl = document.ImageUrl,
                Images = JsonDeserializerHelper.TryDeserializeObject<IEnumerable<ImageData>>(document.Images, nameof(document.Images), typeof(AccommodationMapper)),
                BoardTypes = document.Boards?
                    .Select(board => JsonDeserializerHelper.TryDeserializeObject<HotelBoard>(board, nameof(document.Boards), typeof(AccommodationMapper)))
                    .Where(board => board != null)
                    .ToArray(),
                Facilities = JsonDeserializerHelper.TryDeserializeObject<IEnumerable<AccommodationFacilityVirtualGroup>>(document.Facilities, nameof(document.Facilities), typeof(AccommodationMapper)),
                RoomTypes = RoomMapper.GetHotelRoomsFromIndex(document, atcomCode),
                Country = JsonDeserializerHelper.TryDeserializeObject<DatasourceObjectWithImage>(document.HotelCountry, nameof(document.HotelCountry), typeof(AccommodationMapper)),
                Location = JsonDeserializerHelper.TryDeserializeObject<DatasourceObjectWithImage>(document.HotelLocation, nameof(document.HotelLocation), typeof(AccommodationMapper)),
                Resort = JsonDeserializerHelper.TryDeserializeObject<DatasourceObjectWithImage>(document.HotelResort, nameof(document.HotelResort), typeof(AccommodationMapper)),
                // this field is temporary workaround
                ClosestFacility = JsonDeserializerHelper.TryDeserializeObject<HotelFacility>(document.ClosestFacility, nameof(document.ClosestFacility), typeof(AccommodationMapper)),
                ClosestFacilities = JsonDeserializerHelper.TryDeserializeObject<Dictionary<string, HotelFacility>>(document.ClosestFacilities, nameof(document.ClosestFacilities), typeof(AccommodationMapper)),
                EcoFacility = JsonDeserializerHelper.TryDeserializeObject<HotelFacility>(document.EcoFacility, nameof(document.EcoFacility), typeof(AccommodationMapper)),
                Transfers = MapTransfersFromSearchResultItem(document),
                HotelTheme = JsonDeserializerHelper.TryDeserializeObject<HotelTheme>(document.HotelTheme, nameof(document.HotelTheme), typeof(AccommodationMapper)),
                HighestPriorityType = document.Types?
                    .Select(type => JsonDeserializerHelper.TryDeserializeObject<Type>(type, nameof(document.Types), typeof(AccommodationMapper)))
                    .FirstOrDefault(type => type != null),
                AirportCodes = document.AirportCodes,
                ErrataFacilities = document.ErrataFacilities?
                    .Select(facility => JsonDeserializerHelper.TryDeserializeObject<HotelFacility>(facility, nameof(document.ErrataFacilities), typeof(AccommodationMapper)))
                    .Where(facility => facility != null),
                IsGreatDeal = document.IsGreatDeal,
                LanguageOfHotel = document.Language,
                Url = document.Url,
                YoutubeVideoId = document.YoutubeVideoId,
                VideoPlaceholder = document.VideoPlaceholder,
                CloudinaryVideoSrc = document.CloudinaryVideoSrc,
                VirtualRegions = JsonDeserializerHelper.TryDeserializeObject<List<VirtualRegion>>(document.VirtualRegions, nameof(document.VirtualRegions), typeof(AccommodationMapper)),
                VirtualResorts = JsonDeserializerHelper.TryDeserializeObject<List<VirtualResort>>(document.VirtualResorts, nameof(document.VirtualResorts), typeof(AccommodationMapper)),
                IsMatrixOverriden = document.IsMatrixOverriden,
                MatrixOverride = document.MatrixOverride,
                FacilitiesFiltered = MapFacilityFilteredTypes(document),
                PromoCollections = document.PromoCollections
            };
        }

        public static IEnumerable<FacilityFilteredType> MapFacilityFilteredTypes(HotelSearchResultItem document)
        {
            return document.FilteredFacilities?
                .Where(x => !string.IsNullOrEmpty(x))
                .Select(facility => JsonDeserializerHelper.TryDeserializeObject<FacilityHeader>(facility, nameof(document.FilteredFacilities), typeof(AccommodationMapper)))
                .Where(facility => facility != null)
                .SelectMany(x => x.FacilityFilteredTypes);
        }

        public static IEnumerable<HotelTransfer> MapTransfersFromSearchResultItem(HotelSearchResultItem document)
        {
            return document.Transfers?
                .Where(x => !string.IsNullOrEmpty(x))
                .Select(transfer => JsonDeserializerHelper.TryDeserializeObject<HotelTransfer>(transfer, nameof(document.Transfers), typeof(AccommodationMapper)))
                .Where(transfer => transfer != null)
                .ToList()
                ?? new List<HotelTransfer>();
        }

        public static HotelFilters MapFiltersFromSearchResultItem(string atcomCode, HotelSearchResultItem document)
        {
            return new HotelFilters
            {
                Code = atcomCode,
                Name = document.ItemName,
                StarRating = document.StarRating,
                TripAdvisorRating = document.HotelRating,
                Boards = document.Boards?
                    .Select(board => JsonDeserializerHelper.TryDeserializeObject<BoardTypeFilter>(board, nameof(document.Boards), typeof(AccommodationMapper)))
                    .Where(board => board != null)
                    .ToArray(),
                FacilityGroups = document.FilteredFacilities?
                    .Select(facility => JsonDeserializerHelper.TryDeserializeObject<FacilityHeader>(facility, nameof(document.FilteredFacilities), typeof(AccommodationMapper)))
                    .Where(facility => facility != null)
                    .ToArray(),
                FacilitiesFiltered = MapFacilityFilteredTypes(document),
                Facilities = JsonDeserializerHelper.TryDeserializeObject<IEnumerable<AccommodationFacilityVirtualGroup>>(document.Facilities, nameof(document.Facilities), typeof(AccommodationMapper)),
                IsMatrixOverriden = document.IsMatrixOverriden,
                MatrixOverride = document.MatrixOverride,
            };
        }

        /// <summary>
        /// Map hotel faciltity from Sitecore Item.
        /// </summary>
        /// <param name="item">Hotel facility item.</param>
        /// <returns>Hotel facility.</returns>
        public static HotelFacility MapHotelFacilityFromItem(Item item)
        {
            LookupField typeField = item?.Fields[Constants.Fields.BaseFacilityItem.FacilityType];
            var type = typeField?.TargetItem;

            if (type == null || (type[Constants.Fields.BaseAppearance.ShowOnSite] != Constants.Common.CheckboxTrueValue)
                             || (item[Constants.Fields.BaseAppearance.ShowOnSite] != Constants.Common.CheckboxTrueValue))
            {
                return null;
            }

            return new HotelFacility(type, item);
        }

        /// <summary>
        /// Map all hotel faciltities from Sitecore Item.
        /// </summary>
        /// <param name="item">Hotel facility item.</param>
        /// <returns>Hotel facility.</returns>
        public static HotelFacility MapExpediaHotelFacilityFromItem(Item item)
        {
            LookupField typeField = item?.Fields[Constants.Fields.BaseFacilityItem.FacilityType];
            var type = typeField?.TargetItem;

            if (type == null)
            {
                return null;
            }

            return new HotelFacility(type, item);
        }
    }
}