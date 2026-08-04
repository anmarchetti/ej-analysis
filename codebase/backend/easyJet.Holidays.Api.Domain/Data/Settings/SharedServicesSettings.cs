namespace easyJet.Holidays.Api.Domain.Data.Settings;

/// <summary>
/// Settings for services that orchestrator shares with other applications
/// </summary>
public class SharedServicesSettings
{
    /// <summary>
    /// Whether the controllers for exposing the services are enabled
    /// </summary>
    public bool Enabled { get; set; }

    /// <summary>
    /// Key that is used for authorization when trying to access the shared services
    /// </summary>
    public string Key { get; set; }
}