using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Search;
/// <summary>
/// CheapestMonthDetails
/// </summary>
[ExcludeFromCodeCoverage]
public class CheapestMonthDetails
{
    /// <summary>
    /// Gets or sets the airport code.
    /// </summary>
    public string AirportCode { get; set; }

    /// <summary>
    /// Gets or sets the destination.
    /// </summary>
    public string Destination { get; set; }

    /// <summary>
    /// Gets or sets the search start date.
    /// </summary>
    public string SearchStartDate { get; set; }

    /// <summary>
    /// Gets or sets the month.
    /// </summary>
    public int Month { get; set; }

    /// <summary>
    /// Gets or sets the year.
    /// </summary>
    public int Year { get; set; }

    /// <summary>
    /// Gets or sets the price.
    /// </summary>
    public decimal Price { get; set; }

    /// <summary>
    /// Gets or sets the price per person
    /// </summary>
    public decimal PricePP { get; set; }

    /// <summary>
    /// Gets or sets the expires at.
    /// </summary>
    [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
    public long ExpiresAt { get; set; }

    /// <summary>
    /// Tos the string.
    /// </summary>
    /// <returns>A string.</returns>
    public override string ToString() => $"Airport={AirportCode}, Destination={Destination}, SearchStartDate={SearchStartDate}, Month={Month}, Year={Year}, Price={Price}";
}
