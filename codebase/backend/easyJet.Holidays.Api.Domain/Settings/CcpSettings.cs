namespace easyJet.Holidays.Api.Domain.Settings;

/// <summary>
/// Represents the settings for the CCP service, including the URL and API key used to access the CCP API.
/// </summary>
public class CcpSettings
{
    /// <summary>
    /// Gets or sets the URL for the CCP API.
    /// </summary>
    /// <remarks>
    /// This property should be initialized with a valid <see cref="Uri"/> representing the endpoint for the CCP service.
    /// </remarks>
    public Uri CcpUrl { get; set; }

    /// <summary>
    /// Gets or sets the API key for the CCP API.
    /// </summary>
    public string ApiKey { get; set; }

    /// <summary>
    /// Gets or sets the endpoint path for document retrieval.
    /// </summary>
    public string DocumentRetrievalEndpoint { get; set; }

    /// <summary>
    /// Gets or sets the endpoint path for VAT invoice PDF retrieval.
    /// </summary>
    public string VatInvoicePdfEndpoint { get; set; }
}