namespace easyJet.Holidays.External.Apollo.Models;

/// <summary>
/// Upcoming bookings model
/// </summary>
public class UpcomingBookingsModel
{
    /// <summary>
    /// List of upcoming bookings
    /// </summary>
    public IEnumerable<UpcomingBookingModel> Bookings { get; set; }
}

/// <summary>
/// Upcoming booking model
/// </summary>
public class UpcomingBookingModel
{
    /// <summary>
    /// Booking reference
    /// </summary>
    public string BookingReference { get; set; }
    
    /// <summary>
    /// Hotel code
    /// </summary>
    public string HotelCode { get; set; }
    
    /// <summary>
    /// Hotel name
    /// </summary>
    public string HotelName { get; set; }
    
    /// <summary>
    /// Hotel location
    /// </summary>
    public string HotelLocation { get; set; }
    
    /// <summary>
    /// Resort code
    /// </summary>
    /// <returns></returns>
    public string ResortCode { get; set; }
    
    /// <summary>
    /// Holiday start date
    /// </summary>
    public DateTime HolidayDateStartLocal { get; set; }
    
    /// <summary>
    /// Holiday end date
    /// </summary>
    public DateTime HolidayDateEndLocal { get; set; }
    
    /// <summary>
    /// Holiday nights count
    /// </summary>
    public int HolidayNightsCount { get; set;}
    
    /// <summary>
    /// Flight departure datetime local
    /// </summary>
    public DateTime DepartureDatetimeLocal { get; set; }
    
    /// <summary>
    /// Flight departure datetime utc
    /// </summary>
    public DateTime DepartureDatetimeUtc { get; set; }
}