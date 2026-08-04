namespace easyJet.Holidays.Api.Domain.Data.AmendBooking.Hotel;

/// <summary>
/// Sorting field and direction parameter.
/// </summary>
public enum SortParameter
{
    /// <summary>
    /// Order by tripAdvisor rating from high to low
    /// </summary>
    TripAdvisorDesc,
    
    /// <summary>
    /// Order by price from low to high
    /// </summary>
    PriceAsc,
    
    /// <summary>
    /// Order by price from high to low
    /// </summary>
    PriceDesc
}