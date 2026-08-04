namespace easyJet.Holidays.Api.Domain.Data.Search;
/// <summary>
/// CheapestMonthRequest
/// </summary>
public class CheapestMonthRequest
{
    /// <summary>
    /// Gets or sets the airport code.
    /// </summary>
    public string Airports { get; init; }

    /// <summary>
    /// Gets or sets the destination.
    /// </summary>
    public string Destinations { get; init; }
}
