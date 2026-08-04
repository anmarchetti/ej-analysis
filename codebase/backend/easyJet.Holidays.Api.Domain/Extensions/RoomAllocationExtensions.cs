using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using Force.DeepCloner;

namespace easyJet.Holidays.Api.Domain.Extensions
{
    public static class RoomAllocationExtensions
    {
        public static RoomAllocation CloneWithEmptyRoomCode(this RoomAllocation room)
        {
            var clone = room.DeepClone();
            clone.RoomCode = string.Empty;

            return clone;
        }
    }
}
