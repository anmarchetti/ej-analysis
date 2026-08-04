using Newtonsoft.Json;

namespace easyJet.Holidays.External.AWS.DatahubSync.Models;

/// <summary>
/// Represents an SQS message for booking data with properties mapped to the reservation ID and version number.
/// </summary>
public class SqsBooking
{
    /// <summary>
    /// Gets or sets the booking identifier associated with the reservation.
    /// </summary>
    /// <remarks>
    /// This property maps to the "RES_ID" field in the SQS message and is used
    /// to uniquely identify a specific booking within the reservation data.
    /// </remarks>
    [JsonProperty("RES_ID")]
    public string BookingId { get; set; } = null!;

    /// <summary>
    /// Gets or sets the version number of the booking data.
    /// </summary>
    /// <remarks>
    /// This property corresponds to the "VER_NUM" field in the SQS message
    /// and is used to identify the version of the reservation data.
    /// </remarks>
    [JsonProperty("VER_NUM")]
    public string VersionNumber { get; set; } = null!;
}