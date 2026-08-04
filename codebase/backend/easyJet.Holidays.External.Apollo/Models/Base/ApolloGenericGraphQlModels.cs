using Newtonsoft.Json;

#nullable enable

namespace easyJet.Holidays.External.Apollo.Models.Base;

/// <summary>
/// GraphQL response wrapper for bookings search operations.
/// </summary>
public class ApolloBookingsData<T> where T : IApolloBookingsModel
{
    /// <summary>
    /// Paginated bookings connection returned by Apollo.
    /// </summary>
    [JsonProperty("bookings")]
    public ApolloBookingsConnection<T>? Bookings { get; set; }

    /// <summary>
    /// Single booking returned by reference lookup query.
    /// </summary>
    [JsonProperty("bookingByReference")]
#pragma warning disable CA2227
    public IDictionary<string, T?>? BookingByReference { get; set; }
#pragma warning restore CA2227
}

/// <summary>
/// Filter input used when querying Apollo bookings.
/// </summary>
public class ApolloBookingFilterInput
{
    /// <summary>
    /// Filter expression applied to booking reference.
    /// </summary>
    [JsonProperty("reference")]
    public ApolloStringComparisonExp? Reference { get; set; }

    /// <summary>
    /// Filter expression applied to encrypted member identifier.
    /// </summary>
    [JsonProperty("encryptedMemberId")]
    public ApolloStringComparisonExp? EncryptedMemberId { get; set; }

    /// <summary>
    /// Filter expression applied to booking status.
    /// </summary>
    [JsonProperty("status")]
    public ApolloStringComparisonExp? Status { get; set; }

    /// <summary>
    /// Logical AND group of nested filters.
    /// </summary>
    [JsonProperty("and")]
    public IEnumerable<ApolloBookingFilterInput>? And { get; set; }

    /// <summary>
    /// Logical OR group of nested filters.
    /// </summary>
    [JsonProperty("or")]
    public IEnumerable<ApolloBookingFilterInput>? Or { get; set; }
}

/// <summary>
/// Paginated bookings connection returned by Apollo.
/// </summary>
/// <typeparam name="T"></typeparam>
public class ApolloBookingsConnection<T> where T : IApolloBookingsModel
{
    /// <summary>
    /// Represents a collection of individual booking items retrieved from a GraphQL response.
    /// Each item is a dictionary containing key-value pairs describing the booking data.
    /// </summary>
    [JsonProperty("items")]
    public IEnumerable<T>? Items { get; set; }

    /// <summary>
    /// The token used to retrieve the next set of results in a paginated bookings query.
    /// This property is null or empty when there are no more pages to retrieve.
    /// </summary>
    [JsonProperty("nextToken")]
    public string? NextToken { get; set; }
}

/// <summary>
/// Normalized bookings result returned by the Apollo service layer.
/// </summary>
public class ApolloBookingConnectionResult<T>: IApolloConnectionResult<T> where T : IApolloBookingsModel, new()
{
    /// <summary>
    /// Collection of booking items projected to requested fields.
    /// </summary>
#pragma warning disable CA2227
    public IEnumerable<T>? Items { get; set; }
#pragma warning restore CA2227
    /// <summary>
    /// Pagination token for the next page, if available.
    /// </summary>
    public string? NextToken { get; set; }
}

/// <summary>
/// String comparison expression used by Apollo GraphQL filter inputs.
/// </summary>
public class ApolloStringComparisonExp
{
    /// <summary>
    /// Exact match value.
    /// </summary>
    [JsonProperty("eq")]
    public string? Eq { get; set; }

    /// <summary>
    /// Allowed set of values.
    /// </summary>
    [JsonProperty("in")]
    public IEnumerable<string>? In { get; set; }
}