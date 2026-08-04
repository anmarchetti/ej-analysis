using System.Collections.Generic;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class Hotel : HotelFacilitiesDatasource
    {
        public string Code { get; set; }

        public string GiataCode { get; set; }

        public string Name { get; set; }

        public string ItemName { get; set; }

        public string Description { get; set; }

        public float Longitude { get; set; }

        public float Latitude { get; set; }

        public string Address { get; set; }

        public string City { get; set; }

        public string PostalCode { get; set; }

        public string Website { get; set; }

        public string Email { get; set; }

        public int StarRating { get; set; }

        public string BookingPhone { get; set; }

        public string ManagementPhone { get; set; }

        public string HotelPhone { get; set; }

        public string FaxNumber { get; set; }

        public string Strapline { get; set; }

        public float Rating { get; set; }

        public int NumberOfReviews { get; set; }

        public string TripAdvisorId { get; set; }

        public string ImageUrl { get; set; }

        public IEnumerable<ImageData> Images { get; set; }

        public HotelBoard[] BoardTypes { get; set; }

        public HotelRoom[] RoomTypes { get; set; }

        public bool IsGreatDeal { get; set; }

        // this field is temporrary workaround
        public HotelFacility ClosestFacility { get; set; }

        public Dictionary<string, HotelFacility> ClosestFacilities { get; set; }

        public HotelFacility EcoFacility { get; set; }

        public DatasourceObject Country { get; set; }

        public DatasourceObject Location { get; set; }

        public DatasourceObject Resort { get; set; }

        public string KeySellingPoint1 { get; set; }

        public string KeySellingPoint2 { get; set; }

        public IEnumerable<HotelTransfer> Transfers { get; set; }

        public HotelTheme HotelTheme { get; set; }

        public Type HighestPriorityType { get; set; }

        /// <summary>
        /// Gets or sets array of Hotel(s)'s airport codes.
        /// </summary>
        public IEnumerable<string> AirportCodes { get; set; }

        /// <summary>
        /// Gets or sets errata facilities.
        /// </summary>
        public IEnumerable<HotelFacility> ErrataFacilities { get; set; }

        public string LanguageOfHotel { get; set; }

        public string Url { get; set; }

        /// <summary>
        /// Gets or sets Hotel Youtube Video Id.
        /// </summary>
        public string YoutubeVideoId { get; set; }

        /// <summary>
        /// Gets or sets Hotel Video Placeholder image url.
        /// </summary>
        public string VideoPlaceholder { get; set; }

        /// <summary>
        /// Gets or sets Source for the Cloudinary video.
        /// </summary>
        public string CloudinaryVideoSrc { get; set; }

        /// <summary>
        /// Gets or sets Promo Collections.
        /// </summary>
        public string[] PromoCollections { get; set; }

        public List<VirtualRegion> VirtualRegions { get; set; }

        /// <summary>
        /// Gets or sets Virtual Resorts.
        /// </summary>
        public List<VirtualResort> VirtualResorts { get; set; }

        /// <summary>
        /// Gets or sets facilities.
        /// </summary>
        public override IEnumerable<AccommodationFacilityVirtualGroup> Facilities { get; set; }
    }
}