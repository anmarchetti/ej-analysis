using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Filters
{
    /// <summary>
    /// Availalbe offers filters
    /// </summary>
    public enum AvailableFilters
    {
        [EnumMember(Value = "noFilters")]
        NoFilters = 0,

        [EnumMember(Value = "boardType")]
        Board = 1,

        [EnumMember(Value = "facilities")]
        Facilities = 2,

        [EnumMember(Value = "departureAirport")]
        Departure = 3,

        [EnumMember(Value = "starRating")]
        StarRating = 4,

        [EnumMember(Value = "tripAdvisorRating")]
        TripadvisorRating = 5,

        [EnumMember(Value = "price")]
        Price = 6,

        [EnumMember(Value = "packageTheme")]
        Theme = 7,

        [EnumMember(Value = "destination")]
        Destination = 8,

        [EnumMember(Value = "duration")]
        Duration = 9,

        [EnumMember(Value = "distressedFlights")]
        DistressedFlights = 10,

        [EnumMember(Value = "discount")]
        Discount = 11,

        [EnumMember(Value = "sitecorePrice")]
        SitecorePrice = 12,

        [EnumMember(Value = "initialThemes")]
        InitialThemes = 13,

        [EnumMember(Value = "timeSlots")]
        TimeSlot = 14,

        [EnumMember(Value = "offers")]
        Offers = 15,

        [EnumMember(Value = "hotelTypes")]
        HotelType = 16,

        [EnumMember(Value = "flightDuration")]
        FlightDuration = 17,

        /// <summary>
        /// PaxMixAdultsOnly filter
        /// </summary>
        [EnumMember(Value = "paxMixAdultsOnly")]
        PaxMixAdultsOnly = 18,
        
        /// <summary>
        /// Filter search results by temperature
        /// </summary>
        [EnumMember(Value = "weather")]
        Weather = 19,
        
        /// <summary>
        /// Luxury Holidays filter
        /// </summary>
        [EnumMember(Value = "promoCollection")]
        PromotionCollection = 20,

        /// <summary>
        /// Transfer duration filter
        /// </summary>
        [EnumMember(Value = "transferDuration")]
        TransferDuration = 21,

        /// <summary>
        /// Sitecore Price Range mapping
        /// </summary>
        [EnumMember(Value = "priceRange")]
        SitecorePriceRange = 22,

        /// <summary>
        /// Recommended filter
        /// </summary>
        [EnumMember(Value = "recommended")]
        Recommended = 23
    }
}
