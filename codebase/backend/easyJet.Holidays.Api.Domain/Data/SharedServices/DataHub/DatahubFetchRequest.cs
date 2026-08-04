namespace easyJet.Holidays.Api.Domain.Data.SharedServices.DataHub;

/// <summary>
/// Request model for fetching version data from DataHub
/// </summary>
public class DatahubFetchRequest
{
    /// <summary>
    /// The reservation ID to fetch data
    /// </summary>
    public string ReservationId { get; set; }
    
    /// <summary>
    /// The version number to fetch
    /// </summary>
    public string Version { get; set; }
}