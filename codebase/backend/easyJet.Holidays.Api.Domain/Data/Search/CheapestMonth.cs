namespace easyJet.Holidays.Api.Domain.Data.Search;

/// <summary>
/// CheapestMonth
/// </summary>
public class CheapestMonth
{
    /// <summary>
    /// Airport
    /// </summary>
    public string Airport { get; init; }
    /// <summary>
    /// Destination
    /// </summary>
    public string Destination { get; init; }
    /// <summary>
    /// Prices
    /// </summary>
    public IList<Price> Prices { get; init; }
}

/// <summary>
/// Price
/// </summary>
public class Price
{
    /// <summary>
    /// Month
    /// </summary>
    public int Month { get; set; }
    /// <summary>
    /// Year
    /// </summary>
    public int Year { get; set; }
    /// <summary>
    /// TotalPrice
    /// </summary>
    public decimal TotalPrice { get; set; }
    /// <summary>
    /// PricePP
    /// </summary>
    public decimal PricePP { get; set; }
}
