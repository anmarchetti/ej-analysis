using easyJet.Holidays.Api.Domain.Data.Hotels.Facilities;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Themes;
using System.Collections.ObjectModel;

namespace easyJet.Holidays.Api.Domain.Data.Hotels
{
    /// <summary>
    /// Response model for sitecore api/DestinationsSearch/GetHotels endpoint
    /// </summary>
    public class Hotel
    {
        /// <summary>
        /// Hotel code
        /// </summary>
        public string Code { get; set; }

        /// <summary>
        /// Hotel Giata code.
        /// </summary>
        public string GiataCode { get; set; }

        /// <summary>
        /// Description of the hotel
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Short description for hotel
        /// </summary>
        public string Strapline { get; set; }

        /// <summary>
        /// Description of the hotel
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Longitude of the hotel
        /// </summary>
        public string Longitude { get; set; }

        /// <summary>
        /// Latitude of the hotel
        /// </summary>
        public string Latitude { get; set; }

        /// <summary>
        /// Address of the hotel
        /// </summary>
        public string Address { get; set; }

        /// <summary>
        /// City of the hotel
        /// </summary>
        public string City { get; set; }

        /// <summary>
        /// Hotel post code
        /// </summary>
        public string PostalCode { get; set; }

        /// <summary>
        /// Website URL of the hotel or the chain
        /// </summary>
        public string Website { get; set; }

        /// <summary>
        /// Hotel contact email
        /// </summary>
        public string Email { get; set; }

        /// <summary>
        /// Hotel rating based on the information provided by the hotel
        /// </summary>
        public string StarRating { get; set; }

        /// <summary>
        /// TripAdvisor rating
        /// </summary>
        public double Rating { get; set; }

        /// <summary>
        /// TripAdvisor reviews count
        /// </summary>
        public int NumberOfReviews { get; set; }

        /// <summary>
        /// Hotel booking phone
        /// </summary>
        public string BookingPhone { get; set; }

        /// <summary>
        /// Hotel management phone
        /// </summary>
        public string ManagementPhone { get; set; }

        /// <summary>
        /// Hotel contact phone
        /// </summary>
        public string HotelPhone { get; set; }

        /// <summary>
        /// Hotel fax number
        /// </summary>
        public string FaxNumber { get; set; }

        /// <summary>
        /// Collection of hotel images
        /// </summary>
        public IEnumerable<HotelImage> Images { get; set; }

        /// <summary>
        /// Hotel background image
        /// </summary>
        public string ImageUrl { get; set; }

        /// <summary>
        /// List of facilities, amenities and installations in the room of the hotel
        /// </summary>
        public IEnumerable<AccommodationFacilityGroup> Facilities { get; set; }

        /// <summary>
        /// List of errata facilities
        /// </summary>
        public IEnumerable<AccommodationFacility> ErrataFacilities { get; set; }

        /// <summary>
        /// Closest facility
        /// </summary>
        public AccommodationFacility ClosestFacility { get; set; }

        /// <summary>
        /// Eco facility
        /// </summary>
        public HotelFacility EcoFacility { get; set; }

        /// <summary>
        /// Closest facilities grouped by theme
        /// </summary>
        public Dictionary<string, AccommodationFacility> ClosestFacilities { get; set; }

        /// <summary>
        /// Room Types availbale at this hotel
        /// </summary>
        public IEnumerable<RoomType> RoomTypes { get; set; }

        /// <summary>
        /// List of the board types offered at the hotel
        /// </summary>
        public IEnumerable<BoardType> BoardTypes { get; set; }

        /// <summary>
        /// Hotel Country
        /// </summary>
        public Country Country { get; set; }

        /// <summary>
        /// Hotel Location
        /// </summary>
        public Location Location { get; set; }

        /// <summary>
        /// Hotel Resort
        /// </summary>
        public Resort Resort { get; set; }

        /// <summary>
        /// Virtual regions codes that hotel is part of
        /// </summary>
        public IEnumerable<VirtualRegion> VirtualRegions { get; set; }

        /// <summary>
        /// First key selling point
        /// </summary>
        public string KeySellingPoint1 { get; set; }

        /// <summary>
        /// Second key selling point
        /// </summary>
        public string KeySellingPoint2 { get; set; }

        /// <summary>
        /// Hotel transfers
        /// </summary>
        public IEnumerable<HotelTransfer> Transfers { get; set; }

        /// <summary>
        /// Hotel theme (based on atcom prom code)
        /// </summary>
        public PackageTheme HotelTheme { get; set; }

        /// <summary>
        /// Hotel type (based on atcom prom code)
        /// </summary>
        public ThemeType HighestPriorityType { get; set; }

        /// <summary>
        /// Hotel types applicable to this hotel according to facility matrix from sitecore
        /// </summary>
        public HotelType[] FacilityMatrix { get; set; }

        /// <summary>
        /// Hotel TripAdvisor id
        /// </summary>
        public string TripAdvisorId { get; set; }

        /// <summary>
        /// Gets array of Hotel(s)'s airport codes.
        /// </summary>
        public List<string> AirportCodes { get; set; }

        /// <summary>
        /// Is hotel Great Deal
        /// </summary>
        public bool IsGreatDeal { get; set; }

        /// <summary>
        /// Hotel Theme Type
        /// </summary>
        public string SmartSeerThemeTypeCode { get; set; }

        /// <summary>
        /// fallback-sensitive Language of the CMS hotel
        /// </summary>
        public string LanguageOfHotel { get; set; }

        /// <summary>
        /// Hotel Url of the CMS hotel
        /// </summary>
        public string Url { get; set; }

        /// <summary>
        /// Hotel Youtube Video Id
        /// </summary>
        public string YoutubeVideoId { get; set; }

        /// <summary>
        /// Hotel Video Placeholder Url
        /// </summary>
        public string VideoPlaceholder { get; set; }
        
        /// <summary>
        /// Hotel Cloudinary Video Source
        /// </summary>
        public string CloudinaryVideoSrc { get; set; }
        
        /// <summary>
        /// Hotel's assigned Promo Collections
        /// </summary>
#pragma warning disable CA2227
        public Collection<string> PromoCollections { get; set; }
#pragma warning restore CA2227
    }
}