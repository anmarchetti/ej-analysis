namespace easyJet.Holidays.Api.Domain.Data.Luggage;

/// <summary>
/// Flight ID record 
/// </summary>
public record FlightId(
    string RouteId,
    string FlightNumber,
    string DepartureAirportCode,
    string ArrivalAirportCode,
    DateTime DepartureDate
);