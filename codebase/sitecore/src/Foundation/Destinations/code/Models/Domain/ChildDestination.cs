using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Mappers;
using Newtonsoft.Json;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    /// <summary>
    /// Extends <see cref="Destination"/>.
    /// </summary>
    public class ChildDestination : Destination
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="ChildDestination"/> class.
        /// Ctor for JSON serialize.
        /// </summary>
        public ChildDestination()
        {
        }

        public ChildDestination(BaseDestinationsSearchResultItem document, bool includeRelatedItems = true)
        {
            Code = document.Code;
            GiataCode = document.GiataCode;
            Name = document.ItemName;
            ItemName = document.Name ?? document.ItemName;
            Type = DestinationsMapper.MapRegionTemplateName(document.TemplateName);
            AirportCodes = document.AirportCodes;
            ShowOnSearchPod = document.ShowOnSearchPod;
            ShowInAutocomplete = document.ShowInAutocomplete;
            ShowOnDropdown = document.ShowOnDropdown;
            PromoCollections = document.PromoCollections;
            TrackingId = document.TrackingId;
            TrackingHotelTheme = DestinationsMapper.MapTrackingHotelTheme(document.HotelTheme);

            if (includeRelatedItems)
            {
                Parents = document.Parents?.Select(JsonConvert.DeserializeObject<Destination>).ToArray();
                Children = document.Children?.Select(JsonConvert.DeserializeObject<ChildDestination>);
                RelatedRegions = document.RelatedRegions;
                RelatedResorts = document.RelatedResorts;
            }
        }

        /// <summary>
        /// Gets or sets GIATA code.
        /// </summary>
        public string GiataCode { get; set; }

        /// <summary>
        /// Gets or sets array of Item's parents.
        /// </summary>
        public IEnumerable<Destination> Parents { get; set; }

        /// <summary>
        /// Gets or sets array of Hotel(s)'s airport codes.
        /// </summary>
        public IEnumerable<string> AirportCodes { get; set; }

        /// <summary>
        /// Gets or sets array of first level Item's children.
        /// </summary>
        public IEnumerable<ChildDestination> Children { get; set; }
    }
}