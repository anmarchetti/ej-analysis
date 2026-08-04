using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holiday.IntegrationTests.Shared.Models.Offer;

public class GetRoomVariantsResponse
{
    public IEnumerable<IEnumerable<Unit>> Rooms { get; set; }
    public IEnumerable<AltBoardType> AltBoards { get; init; }
}