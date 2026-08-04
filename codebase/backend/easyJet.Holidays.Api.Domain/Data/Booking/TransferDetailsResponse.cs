#nullable enable
namespace easyJet.Holidays.Api.Domain.Data.Booking;

/// <summary>
/// Transfer details response
/// </summary>
public sealed record TransferDetailsResponse
{
    /// <summary>
    /// Booking reference
    /// </summary>
    public string BookingReference { get; init; } = string.Empty;

    /// <summary>
    /// Inbound transfer details
    /// </summary>
    public TransferDirection? InboundTransferDetails { get; init; }

    /// <summary>
    /// Outbound transfer details
    /// </summary>
    public TransferDirection? OutboundTransferDetails { get; init; }
}

/// <summary>
/// Transfer direction details
/// </summary>
public sealed record TransferDirection
{
    /// <summary>
    /// Transfer type
    /// </summary>
    public TransferItemType TransferType { get; init; } = TransferItemType.Unknown;

    /// <summary>
    /// Airport code
    /// </summary>
    public string Airport { get; init; } = string.Empty;

    /// <summary>
    /// Pickup date
    /// </summary>
    public DateTimeOffset? PickupDate { get; init; }

    /// <summary>
    /// Pickup time
    /// </summary>
    public DateTimeOffset? PickupTime { get; init; }

    /// <summary>
    /// Dropoff date
    /// </summary>
    public DateTimeOffset? DropoffDate { get; init; }

    /// <summary>
    /// Dropoff time
    /// </summary>
    public DateTimeOffset? DropoffTime { get; init; }

    /// <summary>
    /// Transfer duration in minutes
    /// </summary>
    public int TransferMinutes { get; init; }

    /// <summary>
    /// Location point for pickup
    /// </summary>
    public LocationPoint? PickupLocation { get; init; }

    /// <summary>
    /// Pickup location instructions
    /// </summary>
    public string? PickupLocationInstructions { get; init; }

    /// <summary>
    /// Pickup location name
    /// </summary>
    public string? PickupLocationName { get; init; }

    /// <summary>
    /// Vehicle details
    /// </summary>
    public Vehicle Vehicle { get; init; } = null!;

    /// <summary>
    /// What3Words location
    /// </summary>
    public string? What3WordsLocation { get; init; }
}

/// <summary>
/// Vehicle details
/// </summary>
public sealed record Vehicle
{
    /// <summary>
    /// Vehicle registration
    /// </summary>
    public string VehicleRegistration { get; init; } = string.Empty;

    /// <summary>
    /// Vehicle driver name
    /// </summary>
    public string VehicleDriverName { get; init; } = string.Empty;

    /// <summary>
    /// Vehicle driver contact phone number
    /// </summary>
    public string? VehicleDriverPhone { get; init; }

    /// <summary>
    /// Vehicle type
    /// </summary>
    public string? VehicleType { get; init; }

    /// <summary>
    /// Vehicle colour
    /// </summary>
    public string? VehicleColour { get; init; }

    /// <summary>
    /// Provider
    /// </summary>
    public string Provider { get; init; } = string.Empty;
}