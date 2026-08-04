using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants;
using Force.DeepCloner;

namespace easyJet.Holidays.Api.Domain.Mappers.Builders
{
    /// <summary>
    /// Alternative rooms request/response builder
    /// </summary>
    public class AlternativeRoomsBuilder
    {
        /// <summary>
        /// Converts response to reduce response size and reorganise structure
        /// </summary>
        /// <param name="responses">Search responses</param>
        /// <param name="request">Search room variants request</param>
        /// <returns></returns>
        public static RoomVariantsSearchResponse BuildResponse(RoomVariantsResponse response,
            RoomVariantsSearchRequest request)
        {
            //Preferable room codes (if multiple rooms have the same price)
            var preferableRooms = request.Room.Select(x => x.RoomCode).ToHashSet();

            // It's safe to get first Unit because we request the data for single room
            // Also clone collection because we want to modify it later
            List<IEnumerable<Unit>> roomUnits = response.SearchOffersResponses
                .Select(x => x.Offers.Select(o => o.Accom.Unit.FirstOrDefault()))
                .DeepClone()
                .ToList();

            // Remove duplicates
            roomUnits = roomUnits.Select(chunk =>
            {
                var withoutDupplicates = chunk
                    .GroupBy(u => OfferHotelMapper.ParseRoomCode(u.Code))
                    .Select(g =>
                    {
                        var cheapest = g.OrderBy(it => it.Price).FirstOrDefault();
                        if (preferableRooms.Any())
                        {
                            // get all offers with the same price
                            var allCheapest = g.Where(x => x.Price == cheapest.Price);

                            var cheapsetFromList = allCheapest.FirstOrDefault(x => preferableRooms.Contains(x.Code));
                            if (cheapsetFromList != null)
                            {
                                cheapest = cheapsetFromList;
                            }
                        }

                        return cheapest;
                    });

                return withoutDupplicates;
            }).ToList();

            // Clear roomtypes from response units
            foreach (var roomUnit in roomUnits.SelectMany(x => x))
            {
                roomUnit.RequireMoreRoomAlteration = request.AccommodationId != roomUnit.AccommodationId ||
                                                     request.PackageId != roomUnit.PackageId;
            }

            return new RoomVariantsSearchResponse
            {
                Rooms = roomUnits,
                AltBoards = response.AltBoards,
            };
        }
    }
}
