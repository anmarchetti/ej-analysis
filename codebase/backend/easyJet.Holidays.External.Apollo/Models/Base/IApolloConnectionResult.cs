namespace easyJet.Holidays.External.Apollo.Models.Base;

#nullable enable

/// <summary>
/// Marker interface for Apollo connection results.
/// </summary>
public interface IApolloConnectionResult<T> where T : IApolloBookingsModel
{
    /// <summary>
    /// Collection of booking items projected to requested fields.
    /// </summary>
    IEnumerable<T>? Items { get; set; }

    /// <summary>
    /// Pagination token for the next page, if available.
    /// </summary>
    string? NextToken { get; set; }
}