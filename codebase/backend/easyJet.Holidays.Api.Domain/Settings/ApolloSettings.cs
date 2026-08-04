namespace easyJet.Holidays.Api.Domain.Settings;

/// <summary>
/// Apollo settings
/// </summary>
public class ApolloSettings
{
    /// <summary>
    /// Base host URL for Apollo endpoints.
    /// </summary>
    public string Host { get; set; }

    /// <summary>
    /// AppSync domain used for SigV4 signed requests.
    /// </summary>
    public string AppSyncDomain { get; set; }

    /// <summary>
    /// Relative API paths used by Apollo integration.
    /// </summary>
    public ApolloApiSettings Api { get; set; }

    /// <summary>
    /// Timeout for Apollo HTTP calls in milliseconds.
    /// </summary>
    public int TimeoutMilliSeconds { get; set; }

    /// <summary>
    /// Default booking fields requested by Apollo booking queries.
    /// </summary>
    public IReadOnlyCollection<string> DefaultBookingFields { get; set; }

    /// <summary>
    /// Configuration settings for Apollo Booking using AWS integration.
    /// </summary>
    public ApolloBookingAwsSettings AwsBooking { get; set; }
}

/// <summary>
/// Represents the API settings required for Apollo integration.
/// </summary>
public class ApolloApiSettings
{
    /// <summary>
    /// GraphQL endpoint path.
    /// </summary>
    public string GraphQl { get; set; }
}

/// <summary>
/// Represents the AWS configuration settings required for Apollo Booking operations.
/// </summary>
public class ApolloBookingAwsSettings
{
    /// <summary>
    /// Encryption algorithm used for securing AWS Apollo Booking operations.
    /// </summary>
    public string Algorithm { get; set; }

    /// <summary>
    /// The AWS region associated with Apollo Booking operations.
    /// </summary>
    public string Region { get; set; }

    /// <summary>
    /// The name of the AWS service used for Apollo booking operations integration.
    /// </summary>
    public string Service { get; set; }
}