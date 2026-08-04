using easyJet.Holidays.Api.Domain.Data.PackageOffers.AlternativeFlights;
using Refit;

namespace easyJet.Holiday.IntegrationTests.Shared.Decorators;

public class AlternativeFlightsSearchRequestDecorator : AlternativeFlightsSearchRequest
{
    [AliasAs("room[0].adults")]
    public required new int Adults { get; init; }

    [AliasAs("room[0].children")]
    public required new int Children { get; init; }

    [AliasAs("room[0].infants")]
    public required new int Infants { get; init; }

    [AliasAs("room[0].roomCode")]
    public required string RoomCode { get; init; }
}
