using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.Api.Domain.Mappers.Builders
{
    /// <summary>
    /// Room Allocation Builder
    /// </summary>
    public static class RoomAllocationBuilder
    {

        /// <summary>
        /// Creates an object based on Unit object
        /// </summary>
        /// <param name="unit">Unit details</param>
        /// <param name="withRoomAllcoation">Determine if we want to include room code from unit</param>
        /// <returns></returns>
        public static RoomAllocation Create(Unit unit, bool withRoomAllcoation = true)
        {
            return new RoomAllocation()
            {
                Adults = unit.Occupation.Adults,
                Children = unit.Occupation.Children,
                Infants = unit.Occupation.Infants,
                RoomCode = withRoomAllcoation ? unit.Code : null
            };
        }
    }
}
