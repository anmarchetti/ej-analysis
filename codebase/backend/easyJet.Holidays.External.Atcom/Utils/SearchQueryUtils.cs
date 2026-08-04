using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using System.Web;

namespace easyJet.Holidays.External.Atcom.Utils
{
    public static class SearchQueryUtils
    {
        /// <summary>
        /// Build pax room allocation query string: rm_1=1,2&rm_2=3,4,5
        /// </summary>
        /// <param name="allocations">Passengers allocationRequest data</param>
        /// <returns>Allocation query
        /// 
        public static string BuildRoomAllocationQuery(List<RoomAllocation> allocations, string boardType = null)
        {
            if (allocations == null || !allocations.Any())
            {
                return string.Empty;
            }

            var result = new List<string>();
            var guestIds = BuildGuestIds(allocations);

            for (var i = 0; i < guestIds.Count; i++)
            {
                var roomCode = allocations[i].RoomCode;
                var roomIndex = i + 1;

                if (!string.IsNullOrWhiteSpace(roomCode))
                {
                    result.Add($"rmtp_{roomIndex}={HttpUtility.UrlEncode(roomCode)}");
                }

                if (!string.IsNullOrEmpty(boardType))
                {
                    result.Add($"rmbb_{roomIndex}={HttpUtility.UrlEncode(boardType)}");
                }

                var paxIds = guestIds[i];
                var paxIdsStr = string.Join(",", paxIds);

                result.Add($"rm_{roomIndex}={paxIdsStr}");
            }

            return string.Join('&', result.ToArray());
        }

        /// <summary>
        /// Updates occupation in collection of units to make sure that passenger IDs are in order of adults, then children, then infants
        /// </summary>
        /// <param name="rooms">Collection of room allocations</param>
        /// <returns>Guest ids</returns>
        public static List<List<int>> BuildGuestIds(List<RoomAllocation> rooms)
        {
            var result = new List<List<int>>();

            if (rooms == null || !rooms.Any())
            {
                return result;
            }

            rooms.ForEach(u => result.Add(new List<int>()));

            Func<int, Func<RoomAllocation, int>, int> recalculateGuestId = (startIndex, guestsFunc) =>
            {
                var nextId = startIndex;
                for (var i = 0; i < rooms.Count; i++)
                {
                    var unit = rooms[i];
                    var item = result[i];

                    item.AddRange(Enumerable.Range(nextId + 1, guestsFunc(unit)));
                    nextId += guestsFunc(unit);
                }

                return nextId;
            };

            var nextGuestId = 0;
            nextGuestId = recalculateGuestId(nextGuestId, x => x.Adults);
            nextGuestId = recalculateGuestId(nextGuestId, x => x.Children);
            recalculateGuestId(nextGuestId, x => x.Infants);

            return result;
        }
    }
}
