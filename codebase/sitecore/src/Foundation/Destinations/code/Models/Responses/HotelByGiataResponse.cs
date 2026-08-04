using easyJet.Foundation.Destinations.Models.Domain;

namespace easyJet.Foundation.Destinations.Models.Responses
{
    public class HotelByGiataResponse : Hotel
    {
        public string SitecoreId { get; set; }

        public string HotelType { get; set; }

        public HotelByGiataResponse(Hotel hotel)
        {
            if (hotel == null)
            {
                return;
            }

            Code = hotel.Code;
            GiataCode = hotel.GiataCode;
            Name = hotel.Name;
            ItemName = hotel.ItemName;
            Description = hotel.Description;
            Longitude = hotel.Longitude;
            Latitude = hotel.Latitude;
            Address = hotel.Address;
            City = hotel.City;
            PostalCode = hotel.PostalCode;
            Website = hotel.Website;
            Email = hotel.Email;
            StarRating = hotel.StarRating;
            BookingPhone = hotel.BookingPhone;
            ManagementPhone = hotel.ManagementPhone;
            HotelPhone = hotel.HotelPhone;
            FaxNumber = hotel.FaxNumber;
            Strapline = hotel.Strapline;
            Rating = hotel.Rating;
            NumberOfReviews = hotel.NumberOfReviews;
            TripAdvisorId = hotel.TripAdvisorId;
            ImageUrl = hotel.ImageUrl;
            Images = hotel.Images;
            BoardTypes = hotel.BoardTypes;
            RoomTypes = hotel.RoomTypes;
            IsGreatDeal = hotel.IsGreatDeal;
            ClosestFacility = hotel.ClosestFacility;
            ClosestFacilities = hotel.ClosestFacilities;
            EcoFacility = hotel.EcoFacility;
            Country = hotel.Country;
            Location = hotel.Location;
            Resort = hotel.Resort;
            KeySellingPoint1 = hotel.KeySellingPoint1;
            KeySellingPoint2 = hotel.KeySellingPoint2;
            Transfers = hotel.Transfers;
            HotelTheme = hotel.HotelTheme;
            HighestPriorityType = hotel.HighestPriorityType;
            AirportCodes = hotel.AirportCodes;
            ErrataFacilities = hotel.ErrataFacilities;
            LanguageOfHotel = hotel.LanguageOfHotel;
            Url = hotel.Url;
            YoutubeVideoId = hotel.YoutubeVideoId;
            VideoPlaceholder = hotel.VideoPlaceholder;
            CloudinaryVideoSrc = hotel.CloudinaryVideoSrc;
            PromoCollections = hotel.PromoCollections;
            VirtualRegions = hotel.VirtualRegions;
            VirtualResorts = hotel.VirtualResorts;
            Facilities = hotel.Facilities;
            IsMatrixOverriden = hotel.IsMatrixOverriden;
            MatrixOverride = hotel.MatrixOverride;
            FacilitiesFiltered = hotel.FacilitiesFiltered;
        }
    }
}
