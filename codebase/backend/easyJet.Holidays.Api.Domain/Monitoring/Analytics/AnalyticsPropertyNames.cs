namespace easyJet.Holidays.Api.Domain.Monitoring.Analytics;

/// <summary>
/// Constant property names for analytics events to ensure consistency
/// </summary>
public static class AnalyticsPropertyNames
{
    #region Common Properties
    
    /// <summary>
    /// User IP address property
    /// </summary>
    public const string UserIp = "user_ip";
    
    /// <summary>
    /// HTTP referer property
    /// </summary>
    public const string Referer = "referer";
    
    /// <summary>
    /// User agent property
    /// </summary>
    public const string UserAgent = "user_agent";
    
    
    /// <summary>
    /// Device type property (mobile, desktop, tablet)
    /// </summary>
    public const string DeviceType = "device_type";
    
    /// <summary>
    /// Session ID property
    /// </summary>
    public const string SessionId = "session_id";
    
    /// <summary>
    /// Market code property
    /// </summary>
    public const string MarketCode = "market_code";

    #endregion

    #region Hotel/Accommodation Properties
    
    /// <summary>
    /// Hotel name property
    /// </summary>
    public const string HotelName = "hotel_name";
    
    /// <summary>
    /// Accommodation code property
    /// </summary>
    public const string AccommodationCode = "accom_code";
    
    /// <summary>
    /// Is direct accommodation property
    /// </summary>
    public const string AccommodationSource = "accom_source";
    
    /// <summary>
    /// Country property
    /// </summary>
    public const string Country = "country";
    
    /// <summary>
    /// Region property
    /// </summary>
    public const string Region = "region";
    

    #endregion

    #region Booking Properties
    
    /// <summary>
    /// Booking reference property
    /// </summary>
    public const string BookingReference = "booking_reference";

    /// <summary>
    /// Amendment type property (hotel, dates, transfer, seats, room, flight, name)
    /// </summary>
    public const string AmendmentType = "amendment_type";
    
    /// <summary>
    /// Start date property
    /// </summary>
    public const string StartDate = "start_date";
    
    /// <summary>
    /// Duration property
    /// </summary>
    public const string Duration = "duration";
    
    /// <summary>
    /// Room types property
    /// </summary>
    public const string RoomTypes = "room_types";
    
    /// <summary>
    /// Board types property
    /// </summary>
    public const string BoardTypes = "board_types";
    
    /// <summary>
    /// Departure airport property
    /// </summary>
    public const string DepartureAirport = "departure_airport";
    
    /// <summary>
    /// Arrival airport property
    /// </summary>
    public const string ArrivalAirport = "arrival_airport";
    
    /// <summary>
    /// Adults count property
    /// </summary>
    public const string AdultsCount = "adults_count";
    
    /// <summary>
    /// Children count property
    /// </summary>
    public const string ChildrenCount = "children_count";
    
    /// <summary>
    /// Infants count property
    /// </summary>
    public const string InfantsCount = "infants_count";
    
    #endregion

    #region Price Properties
    
    /// <summary>
    /// Total price property
    /// </summary>
    public const string TotalPrice = "total_price";
    
    /// <summary>
    /// Payment amount property
    /// </summary>
    public const string PaymentAmount = "payment_amount";
    
    /// <summary>
    /// Currency property
    /// </summary>
    public const string Currency = "currency";
    
    /// <summary>
    /// Payment method property
    /// </summary>
    public const string PaymentMethod = "payment_method";
    
    /// <summary>
    /// Price difference property
    /// </summary>
    public const string PriceDifference = "price_difference";
    
    /// <summary>
    /// Price change direction property (increase/decrease)
    /// </summary>
    public const string PriceChangeDirection = "price_change_direction";
    
    /// <summary>
    /// Old price property
    /// </summary>
    public const string OldPrice = "old_price";
    
    /// <summary>
    /// New price property
    /// </summary>
    public const string NewPrice = "new_price";
    
    /// <summary>
    /// Percentage change property
    /// </summary>
    public const string PercentageChange = "percentage_change";
    
    /// <summary>
    /// Previous price property (for price jump tracking in availability checks)
    /// </summary>
    public const string PreviousPrice = "previous_price";
    
    /// <summary>
    /// Price jump amount property (absolute difference in availability checks)
    /// </summary>
    public const string PriceJumpAmount = "price_jump_amount";

    #endregion

    #region Search Properties
    
    /// <summary>
    /// Search type property
    /// </summary>
    public const string SearchType = "search_type";
    
    /// <summary>
    /// Result count property
    /// </summary>
    public const string ResultCount = "result_count";
    
    /// <summary>
    /// Destination country property
    /// </summary>
    public const string DestinationCountry = "destination_country";
    
    /// <summary>
    /// Destination region property
    /// </summary>
    public const string DestinationRegion = "destination_region";
    
    /// <summary>
    /// Destination resort property
    /// </summary>
    public const string DestinationResort = "destination_resort";
    
    /// <summary>
    /// Minimum price property
    /// </summary>
    public const string MinPrice = "min_price";
    
    /// <summary>
    /// Maximum price property
    /// </summary>
    public const string MaxPrice = "max_price";
    
    /// <summary>
    /// Average price property
    /// </summary>
    public const string AvgPrice = "avg_price";
    
    /// <summary>
    /// Search filters property
    /// </summary>
    public const string SearchFilters = "search_filters";
    
    /// <summary>
    /// Search price property
    /// </summary>
    public const string SearchPrice = "search_price";

    #endregion
    
    #region Promo Code Properties
    
    /// <summary>
    /// Promo code property
    /// </summary>
    public const string PromoCode = "promo_code";
    
    /// <summary>
    /// Error code property for failed validations
    /// </summary>
    public const string ErrorCode = "error_code";
    
    /// <summary>
    /// Error reason property
    /// </summary>
    public const string ErrorReason = "error_reason";
    
    /// <summary>
    /// Validation status property
    /// </summary>
    public const string ValidationStatus = "validation_status";
    
    /// <summary>
    /// Error source property (SITECORE, VOUCHERIFY, ATCOM)
    /// </summary>
    public const string ErrorSource = "error_source";
    
    #endregion
    
}
