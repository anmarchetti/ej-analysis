using System.Collections.Generic;

namespace easyJet.Foundation.Destinations.Models.Requests
{
    public class UpsertHotelRequest
    {
        public string ExpediaCode { get; set; }

        public string GiataCode { get; set; }

        public string TripAdvisorId { get; set; }

        public string Name { get; set; }

        public string Subtitle { get; set; }

        public string HotelDescription { get; set; }

        public string StrapLine { get; set; }

        public string KeySellingPoint1 { get; set; }

        public List<string> HotelCarouselImages { get; set; } = new List<string>();

        public List<FacilityContent> Facilities { get; set; } = new List<FacilityContent>();

        public List<RoomContent> Rooms { get; set; } = new List<RoomContent>();

        public string Address { get; set; }

        public string City { get; set; }

        public string PostalCode { get; set; }

        public decimal? Latitude { get; set; }

        public decimal? Longitude { get; set; }

        public string Email { get; set; }

        public string Phone { get; set; }

        public string Code { get; set; }

        public string SitecoreId { get; set; }

        public int? StarRating { get; set; }

        public string Website { get; set; }

        public string BookingPhone { get; set; }

        public string HotelPhone { get; set; }

        public string FaxNumber { get; set; }

        public string ResortName { get; set; }

        public string HotelType { get; set; }

        public List<string> AirportCodes { get; set; } = new List<string>();

        public DestinationBase Country { get; set; }

        public DestinationBase Resort { get; set; }

        public DestinationBase Location { get; set; }

        public string TrackingPageTitle { get; set; }
    }
}
