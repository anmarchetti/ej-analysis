using easyJet.Holidays.Api.Domain.Data.FlightPriceStore;
using easyJet.Holidays.External.AWS.FPSSync.Models;

namespace easyJet.Holidays.External.AWS.FPSSync.Mappers;

public static class FlightPriceMapper
{
    public static IEnumerable<FlightPriceStoreModel> MapMessageToModels(FlightPriceMessagePayload message)
    {
        var models = new List<FlightPriceStoreModel>();
        var flight = message.Detail.Data;
        var updateTimeUtc = DateTime.UtcNow;

        if (!message.Detail.Data.Fares.Any())
            return models;

        var adultFares = flight.Fares.Where(x => x.Adults > 0).SelectMany(x => x.FareTypes);
        var childFares = flight.Fares.Where(x => x.Children > 0).SelectMany(x => x.FareTypes).ToArray();

        foreach (var fareType in adultFares)
        {
            var fareTypeName = fareType.FareType;

            foreach (var price in fareType.Prices)
            {
                var currency = price.Currency;
                var childPrice = childFares.FirstOrDefault(c => c.FareType == fareTypeName)
                    ?.Prices.FirstOrDefault(p => p.Currency == price.Currency);

                models.Add(new FlightPriceStoreModel
                {
                    ID = $"{flight.FlightKey}{currency}{flight.Departure.Time}{fareTypeName}",
                    UpdateDateTime = updateTimeUtc,
                    QueuedDateTime = message.Time,
                    LastUpdateType = message.DetailType,
                    FlightKey = flight.FlightKey,
                    Departure = flight.Departure.AirportCode,
                    Arrival = flight.Arrival.AirportCode,
                    FlightNumber = flight.FlightNumber,
                    CarrierCode = flight.CarrierCode,
                    LocalDepartureDateTime = flight.Departure.Time,
                    LocalArrivalDateTime = flight.Arrival.Time,
                    Currency = currency,
                    FareType = fareTypeName,
                    AvailableInventory = flight.AvailableSeats,
                    BookingAdminFee = price.BookingFee,
                    InboundAdultFlightPrice = price.ReturnPrice,
                    OutboundAdultFlightPrice = price.OutboundPrice,
                    InboundChildFlightPrice = childPrice?.ReturnPrice ?? 0,
                    OutboundChildFlightPrice = childPrice?.OutboundPrice ?? 0
                });
            }
        }

        return models;
    }
}
