using easyJet.Holidays.External.Apollo.Models.Base;
using Newtonsoft.Json;

#nullable enable

namespace easyJet.Holidays.External.Apollo.Models;

/// <summary>
/// Represents a GraphQL connection object for paginated bookings data.
/// Contains the list of booking items and the token to fetch the next page of results.
/// </summary>
public class ApolloUpcomingBookingsConnection : ApolloBookingsConnection<ApolloUpcomingBooking>
{
}

/// <summary>
/// Normalized bookings result returned by the Apollo service layer.
/// </summary>
public class ApolloUpcomingBookingConnectionResult : ApolloBookingConnectionResult<ApolloUpcomingBooking>
{
}

/// <summary>
/// Represents a single booking item in the Apollo response.
/// </summary>
public class ApolloUpcomingBooking : IApolloBookingsModel
{
    /// <summary>
    /// Booking reference
    /// </summary>
    [JsonProperty( "reference" )]
    public string? Reference { get; set; }
   
    /// <summary>
    /// Booking destinations
    /// </summary>
    [JsonProperty( "destinations" )]
    public IEnumerable<ApolloBookingDestination>? Destinations { get; set; }
    /// <summary>
    /// Holiday details
    /// </summary>
    [JsonProperty( "holiday" )]
    public ApolloBookingHoliday? Holiday { get; set; }
    
    /// <summary>
    /// Outbound flight details
    /// </summary>
    [JsonProperty( "outbound" )]
    public ApolloOutboundFlight? Outbound { get; set; }

    /// <summary>
    /// Request type name
    /// </summary>
    public string RequestType => nameof(ApolloUpcomingBooking);
}

/// <summary>
/// Holiday details
/// </summary>
public class ApolloBookingHoliday
{
    /// <summary>
    /// Holiday start date
    /// </summary>
    [JsonProperty( "holidayStartDateLocal" )]
    public DateTime HolidayStartDateLocal { get; set; }
    
    /// <summary>
    /// Holiday end date
    /// </summary>
    [JsonProperty( "holidayEndDateLocal" )]
    public DateTime HolidayEndDateLocal { get; set; }
    
    /// <summary>
    /// Holiday nights count
    /// </summary>
    [JsonProperty( "holidayNightsCount" )]
    public int HolidayNightsCount { get; set; }
}

/// <summary>
/// Destination details
/// </summary>
public class ApolloBookingDestination
{
    /// <summary>
    /// Location details
    /// </summary>
    [JsonProperty( "location")]
    public ApolloBookingLocation? Location { get; set; }
    
    /// <summary>
    /// Hotel details
    /// </summary>
    [JsonProperty( "hotel")]
    public ApolloBookingHotel? Hotel { get; set; }
}

/// <summary>
/// Hotel details
/// </summary>
public class ApolloBookingHotel
{
    /// <summary>
    /// Hotel code
    /// </summary>
    [JsonProperty( "hotelCode" )]
    public string? HotelCode { get; set; }
    
    /// <summary>
    /// Hotel name
    /// </summary>
    [JsonProperty( "hotelName" )]
    public string? HotelName { get; set; }
    
    /// <summary>
    /// Hotel location
    /// </summary>
    [JsonProperty( "hotelLocation" )]
    public string? HotelLocation { get; set; }
}

/// <summary>
/// Hotel details
/// </summary>
public class ApolloBookingLocation
{
    /// <summary>
    /// Country name
    /// </summary>
    [JsonProperty( "countryName")]
    public string? CountryName { get; set; }
    
    /// <summary>
    /// Region name
    /// </summary>
    [JsonProperty( "regionName")]
    public string? RegionName { get; set; }
    
    /// <summary>
    /// Resort name
    /// </summary>
    [JsonProperty( "resortName")]
    public string? ResortName { get; set; }
    
    /// <summary>
    /// Resort code
    /// </summary>
    [JsonProperty( "resortCode")]
    public string? ResortCode { get; set; }
}

/// <summary>
/// Hotel details
/// </summary>
public class ApolloOutboundFlight
{
    /// <summary>
    /// Country name
    /// </summary>
    [JsonProperty( "flightDepartureDatetimeLocal")]
    public DateTime FlightDepartureDatetimeLocal { get; set; }
    
    /// <summary>
    /// Region name
    /// </summary>
    [JsonProperty( "flightDepartureDatetimeUtc")]
    public DateTime FlightDepartureDatetimeUtc { get; set; }
}
