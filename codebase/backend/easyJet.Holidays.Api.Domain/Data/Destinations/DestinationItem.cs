using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Destinations
{
    /// <summary>
    /// Base destination item model
    /// </summary>
    [DataContract]
    public class DestinationItem
    {
        public DestinationItem()
        {
            Available = true;
        }

        /// <summary>
        /// Item code
        /// </summary>
        [DataMember]
        public string Code { get; set; }

        /// <summary>
        /// Item name
        /// </summary>
        [DataMember]
        public string Name { get; set; }

        /// <summary>
        /// object itemName
        /// </summary>
        [DataMember]
        public string ItemName { get; set; }

        /// <summary>
        /// Item name
        /// </summary>
        [DataMember]
        public bool Available { get; set; }

        /// <summary>
        /// Item name
        /// </summary>
        [DataMember]
        public IReadOnlyCollection<string> AirportCodes { get; set; }

        /// <summary>
        /// Item type: country, location, resort, hotel
        /// </summary>
        [DataMember]
        public DestinationItemType? Type { get; set; }

        /// <summary>
        /// Parent destination items
        /// </summary>
        [DataMember]
        public List<DestinationItem> Parents { get; set; }

        /// <summary>
        /// Child destination items
        /// </summary>
        [DataMember]
        public List<DestinationItem> Children { get; set; }

        /// <summary>
        /// Whether item should be shown on search pod
        /// </summary>
        [DataMember]
        public bool ShowOnSearchPod { get; set; }
        
        /// <summary>
        /// Hotel Type Icon from promo collections setup
        /// </summary>
        [DataMember]
        public string HotelTypeIcon => PromoCollections?.FirstOrDefault();
        
        /// <summary>
        /// Promo Collections
        /// </summary>
        [DataMember]
        public IEnumerable<string> PromoCollections { get; set; }

        /// <summary>
        /// Gets or sets tracking hotel theme
        /// </summary>
        [DataMember]
        public string TrackingHotelTheme { get; set; }

        /// <summary>
        /// RelatedRegions code of virtual region item
        /// </summary>
        [DataMember]
        public IReadOnlyCollection<string> RelatedRegions { get; set; }

        /// <summary>
        /// RelatedResorts code of virtual resort item
        /// </summary>
        [DataMember]
        public IReadOnlyCollection<string> RelatedResorts { get; set; }

        /// <summary>
        /// Giata code for hotel
        /// </summary>
        [DataMember]
        public string GiataCode { get; set; }

        /// <summary>
        /// Gets or sets tracking id
        /// </summary>
        [DataMember]
        public string TrackingId { get; set; }
    }
}
