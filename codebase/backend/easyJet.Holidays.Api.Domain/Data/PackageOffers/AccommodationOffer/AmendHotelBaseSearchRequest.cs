namespace easyJet.Holidays.Api.Domain.Data.PackageOffers.AccommodationOffer;

/// <summary>
/// Base search to Atcom cache. Using in search type 23 and 26
/// </summary>
public class AmendHotelBaseSearchRequest
{
    /// <summary>
    /// Dictionary present of offer room composition.
    /// </summary>
    public Dictionary<int, string> RoomComposition { get; init; }

    /// <summary>
    /// Adults amount
    /// </summary>
    public int Adults { get; init; }

    /// <summary>
    /// Children amount
    /// </summary>
    public int Children { get; init; }

    /// <summary>
    /// Infants amount
    /// </summary>
    public int Infants { get; init; }

    /// <summary>
    /// Child ages list. Array length should equal children amount.
    /// </summary>
    public IEnumerable<string> ChildAges { get; init; }

    /// <summary>
    /// Departure airport code for outbound flight.
    /// </summary>
    public string DepartureAirportCode { get; init; }

    /// <summary>
    /// Arrival airport code for outbound flight.
    /// </summary>
    public string ArrivalAirportCode { get; init; }

    /// <summary>
    /// Departure date for outbound flight.
    /// </summary>
    public string OutboundDepartureDate { get; init; }

    /// <summary>
    /// Arrival date for outbound flight.
    /// </summary>
    public string OutboundArrivalDate { get; init; }

    /// <summary>
    /// Departure date for inbound flight.
    /// </summary>
    public string InboundDepartureDate { get; init; }

    /// <summary>
    /// Arrival date for inbound flight.
    /// </summary>
    public string InboundArrivalDate { get; init; }

    /// <summary>
    /// Outbound flight number with car.
    /// </summary>
    public string OutboundFlightNumber { get; init; }

    /// <summary>
    /// Inbound flight number with car.
    /// </summary>
    public string InboundFlightNumber { get; init; }

    /// <summary>
    /// Market code.
    /// </summary>
    public string MarketCode { get; init; }
}