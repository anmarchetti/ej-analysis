using Sitecore.ContentSearch;

namespace easyJet.Foundation.Destinations.ContentSearch.SearchTypes
{
    public class HotelSearchResultItem : BaseHotelSearchResultItem
    {
        [IndexField("hoteldescription")]
        public string Description { get; set; }

        [IndexField("longitude")]
        public float Longitude { get; set; }

        [IndexField("latitude")]
        public float Latitude { get; set; }

        [IndexField("address")]
        public string Address { get; set; }

        [IndexField("city")]
        public string City { get; set; }

        [IndexField("postalcode")]
        public string PostalCode { get; set; }

        [IndexField("website")]
        public string Website { get; set; }

        [IndexField("email")]
        public string Email { get; set; }

        [IndexField("starrating")]
        public int StarRating { get; set; }

        [IndexField("bookingphone")]
        public string BookingPhone { get; set; }

        [IndexField("managementphone")]
        public string ManagementPhone { get; set; }

        [IndexField("hotelphone")]
        public string HotelPhone { get; set; }

        [IndexField("faxnumber")]
        public string FaxNumber { get; set; }

        [IndexField("images_list")]
        public string Images { get; set; }

        [IndexField("boards_list")]
        public string[] Boards { get; set; }

        [IndexField("rooms_list")]
        public string Rooms { get; set; }

        // this field is temporrary workaround
        [IndexField("closest_facility")]
        public string ClosestFacility { get; set; }

        [IndexField("closest_facility_list")]
        public string ClosestFacilities { get; set; }

        [IndexField("eco_facility")]
        public string EcoFacility { get; set; }

        // todo: get rid of either facilities_list or filtered_facility in the future
        [IndexField("facilities_list")]
        public string Facilities { get; set; }

        [IndexField("filtered_facility")]
        public string[] FilteredFacilities { get; set; }

        [IndexField("country")]
        public string HotelCountry { get; set; }

        [IndexField("location")]
        public string HotelLocation { get; set; }

        [IndexField("resort")]
        public string HotelResort { get; set; }

        [IndexField("strapline")]
        public string Strapline { get; set; }

        [IndexField("hotelrating")]
        public float HotelRating { get; set; }

        [IndexField("tripadvisorid")]
        public string TripAdvisorId { get; set; }

        [IndexField("totalnumberofreviews")]
        public int TotalNumberOfReviews { get; set; }

        [IndexField("keysellingpoint1")]
        public string KeySellingPoint1 { get; set; }

        [IndexField("keysellingpoint2")]
        public string KeySellingPoint2 { get; set; }

        [IndexField("transfers_list")]
        public string[] Transfers { get; set; }

        [IndexField("hotel_theme")]
        public string HotelTheme { get; set; }

        [IndexField("types_list")]
        public string[] Types { get; set; }

        [IndexField("resort_image_url")]
        public string ResortImageUrl { get; set; }

        [IndexField("resort_description")]
        public string ResortDescription { get; set; }

        [IndexField("errata_facilities")]
        public string[] ErrataFacilities { get; set; }

        [IndexField("greatdeal")]
        public bool IsGreatDeal { get; set; }

        [IndexField("hotel_url")]
        public string Url { get; set; }

        [IndexField("youtubevideoid")]
        public string YoutubeVideoId { get; set; }

        [IndexField("videoplaceholder")]
        public string VideoPlaceholder { get; set; }

        [IndexField("cloudinaryvideosrc")]
        public string CloudinaryVideoSrc { get; set; }

        [IndexField("promo_collections")]
        public string[] PromoCollections { get; set; }

        [IndexField("virtual_regions")]
        public string VirtualRegions { get; set; }

        [IndexField("virtual_resorts")]
        public string VirtualResorts { get; set; }

        [IndexField("applymatrixoverride")]
        public bool IsMatrixOverriden { get; set; }

        [IndexField("MatrixOverride")]
        public string[] MatrixOverride { get; set; }
    }
}