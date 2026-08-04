#nullable enable
using System.Text.Json.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Booking;

/// <summary>
/// Transfer details API payload
/// </summary>
public sealed class TransferDetailsPayload
{
    /// <summary>
    /// Booking reference
    /// </summary>
    [JsonPropertyName("bookingReference")]
    public string BookingReference { get; set; } = string.Empty;

    /// <summary>
    /// Number of passengers
    /// </summary>
    [JsonPropertyName("noOfPax")]
    public int NoOfPax { get; set; }

    /// <summary>
    /// Resort ID
    /// </summary>
    [JsonPropertyName("resortId")]
    public string ResortId { get; set; } = string.Empty;

    /// <summary>
    /// Created at timestamp
    /// </summary>
    [JsonPropertyName("createdAt")]
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>
    /// Updated at timestamp
    /// </summary>
    [JsonPropertyName("updatedAt")]
    public DateTimeOffset UpdatedAt { get; set; }

    /// <summary>
    /// Inbound transfer details
    /// </summary>
    [JsonPropertyName("inbound")]
    public TransferDirectionPayload? Inbound { get; set; }

    /// <summary>
    /// Outbound transfer details
    /// </summary>
    [JsonPropertyName("outbound")]
    public TransferDirectionPayload? Outbound { get; set; }
}

/// <summary>
/// Transfer direction details from API
/// </summary>
public sealed class TransferDirectionPayload
{
    /// <summary>
    /// Transfer type (e.g., shared, private)
    /// </summary>
    [JsonPropertyName("transferType")]
    public string TransferType { get; set; } = string.Empty;

    /// <summary>
    /// Airport code
    /// </summary>
    [JsonPropertyName("airport")]
    public string Airport { get; set; } = string.Empty;

    /// <summary>
    /// Flight number
    /// </summary>
    [JsonPropertyName("flightNo")]
    public string FlightNo { get; set; } = string.Empty;

    /// <summary>
    /// Flight arrival time
    /// </summary>
    [JsonPropertyName("flightArrival")]
    public DateTimeOffset? FlightArrival { get; set; }

    /// <summary>
    /// Flight departure time
    /// </summary>
    [JsonPropertyName("flightDeparture")]
    public DateTimeOffset? FlightDeparture { get; set; }

    /// <summary>
    /// Pickup time
    /// </summary>
    [JsonPropertyName("pickupTime")]
    public DateTimeOffset? PickupTime { get; set; }

    /// <summary>
    /// Dropoff time
    /// </summary>
    [JsonPropertyName("dropoffTime")]
    public DateTimeOffset? DropoffTime { get; set; }

    /// <summary>
    /// Transfer duration in minutes
    /// </summary>
    [JsonPropertyName("transferMinutes")]
    public int? TransferMinutes { get; set; }

    /// <summary>
    /// Pickup location description
    /// </summary>
    [JsonPropertyName("pickupLocationDescription")]
    public string PickupLocationDescription { get; set; } = string.Empty;

    /// <summary>
    /// Pickup latitude
    /// </summary>
    [JsonPropertyName("pickupLatitude")]
    public float? PickupLatitude { get; set; }

    /// <summary>
    /// Pickup longitude
    /// </summary>
    [JsonPropertyName("pickupLongitude")]
    public float? PickupLongitude { get; set; }

    /// <summary>
    /// Desk latitude
    /// </summary>
    [JsonPropertyName("deskLatitude")]
    public float? DeskLatitude { get; set; }

    /// <summary>
    /// Desk longitude
    /// </summary>
    [JsonPropertyName("deskLongitude")]
    public float? DeskLongitude { get; set; }

    /// <summary>
    /// Desk name
    /// </summary>
    [JsonPropertyName("deskName")]
    public string DeskName { get; set; } = string.Empty;

    /// <summary>
    /// Desk description
    /// </summary>
    [JsonPropertyName("deskDescription")]
    public string DeskDescription { get; set; } = string.Empty;

    /// <summary>
    /// Terminal
    /// </summary>
    [JsonPropertyName("terminal")]
    public string Terminal { get; set; } = string.Empty;

    /// <summary>
    /// Instructions for pickup/dropoff
    /// </summary>
    [JsonPropertyName("instructions")]
    public string Instructions { get; set; } = string.Empty;

    /// <summary>
    /// Vehicle registration
    /// </summary>
    [JsonPropertyName("vehicleRego")]
    public string VehicleRego { get; set; } = string.Empty;

    /// <summary>
    /// Vehicle driver name
    /// </summary>
    [JsonPropertyName("vehicleDriver")]
    public string VehicleDriver { get; set; } = string.Empty;

    /// <summary>
    /// Driver contact phone number
    /// </summary>
    [JsonPropertyName("driverContact")]
    public string DriverContact { get; set; } = string.Empty;

    /// <summary>
    /// Vehicle type
    /// </summary>
    [JsonPropertyName("vehicleType")]
    public string VehicleType { get; set; } = string.Empty;

    /// <summary>
    /// Vehicle colour
    /// </summary>
    [JsonPropertyName("vehicleColor")]
    public string VehicleColor { get; set; } = string.Empty;

    /// <summary>
    /// Provider name
    /// </summary>
    [JsonPropertyName("providerName")]
    public string ProviderName { get; set; } = string.Empty;
    

    /// <summary>
    /// What3Words location
    /// </summary>
    [JsonPropertyName("whatThreeWords")]
    public string WhatThreeWords { get; set; } = string.Empty;

    /// <summary>
    /// Status
    /// </summary>
    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;
}
