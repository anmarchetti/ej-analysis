using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.Api.Domain.Extensions;

public static class RoomExtensions
{
    public static RoomAllocation MapToRoomAllocation(this Unit unit)
    {
        var result = new RoomAllocation()
        {
            Adults = unit.Occupation.Adults,
            Children = unit.Occupation.Children,
            Infants = unit.Occupation.Infants,
            RoomCode = unit.Code
        };

        return result;
    }
}