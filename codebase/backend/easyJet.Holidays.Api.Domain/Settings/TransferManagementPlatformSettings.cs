namespace easyJet.Holidays.Api.Domain.Settings;

/// <summary>
/// Settings related to transfer management API
/// </summary>
public class TransferManagementPlatformSettings
{
    /// <summary>
    /// Transfer management API host
    /// </summary>
    public string Host { get; set; }
    
    /// <summary>
    /// Secret key for authenticating with the transfer management API
    /// </summary>
    public string SecretKey { get; set; }
    
    /// <summary>
    /// Transfer management API endpoints
    /// </summary>
    public TransferManagementApiSettings Api { get; set; }
}

/// <summary>
/// Transfer management API endpoints
/// </summary>
public class TransferManagementApiSettings
{
    /// <summary>
    /// Booking transfer details endpoint
    /// </summary>
    public string BookingTransferDetails { get; set; }
}