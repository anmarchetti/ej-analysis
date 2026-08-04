using System;
using System.Linq;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Models.Domain;

namespace easyJet.Foundation.Destinations.Mappers
{
    public static class DestinationsMapper
    {
        private const string RegionCityTemplateName = "Region - City";
        private const string RegionTemplateName = "Region";

        public static ChildDestination MapFromDestinationSearchResultItem(string atcomCode, DestinationSearchResultItem document)
        {
            return new ChildDestination()
            {
                Code = atcomCode,
                GiataCode = document.GiataCode,
                Name = document.ItemName,
                ItemName = document.Name,
                Type = MapRegionTemplateName(document.TemplateName),
                AirportCodes = document.AirportCodes,
                ShowOnSearchPod = document.ShowOnSearchPod,
                Parents = document.Parents?
                    .Select(parent => JsonDeserializerHelper.TryDeserializeObject<Destination>(parent, nameof(document.Parents), typeof(DestinationsMapper)))
                    .Where(parent => parent != null)
                    .ToArray(),
                RelatedRegions = document.RelatedRegions,
                RelatedResorts = document.RelatedResorts,
                PromoCollections = document.PromoCollections,
                TrackingHotelTheme = MapTrackingHotelTheme(document.HotelTheme),
                TrackingId = document.TrackingId
            };
        }

        public static ChildDestination MapFromBaseDestinationSearchResultItem(string atcomCode, BaseDestinationsSearchResultItem document)
        {
            return new ChildDestination()
            {
                Code = atcomCode,
                GiataCode = document.GiataCode,
                Name = document.ItemName,
                ItemName = document.ItemName,
                Type = MapRegionTemplateName(document.TemplateName),
                AirportCodes = document.AirportCodes,
                ShowOnSearchPod = document.ShowOnSearchPod,
                ShowInAutocomplete = document.ShowInAutocomplete,
                ShowOnDropdown = document.ShowOnDropdown,
                Parents = document.Parents?
                    .Select(parent => JsonDeserializerHelper.TryDeserializeObject<Destination>(parent, nameof(document.Parents), typeof(DestinationsMapper)))
                    .Where(parent => parent != null)
                    .ToArray(),
                Children = document.Children?
                    .Select(child => JsonDeserializerHelper.TryDeserializeObject<ChildDestination>(child, nameof(document.Children), typeof(DestinationsMapper)))
                    .Where(child => child != null),
                RelatedRegions = document.RelatedRegions,
                RelatedResorts = document.RelatedResorts,
                PromoCollections = document.PromoCollections,
                TrackingHotelTheme = MapTrackingHotelTheme(document.HotelTheme),
                TrackingId = document.TrackingId
            };
        }

        public static string MapRegionTemplateName(string templateName)
            => RegionCityTemplateName.Equals(templateName, StringComparison.OrdinalIgnoreCase) ? RegionTemplateName : templateName;

        public static string MapRegionTemplateId(string templateId)
            => Constants.TemplateIds.RegionCityPage.ToString().Equals(templateId, StringComparison.OrdinalIgnoreCase) ? Constants.TemplateIds.RegionPage.ToString() : templateId;

        public static string MapTrackingHotelTheme(string hotelTheme)
            => JsonDeserializerHelper
                .TryDeserializeObject<HotelTheme>(hotelTheme, "HotelTheme", typeof(DestinationsMapper))
                ?.ItemName;
    }
}