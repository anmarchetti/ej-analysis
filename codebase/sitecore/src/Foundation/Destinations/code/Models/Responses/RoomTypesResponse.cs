using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain;

namespace easyJet.Foundation.Destinations.Models.Responses
{
    public class RoomTypesResponse
    {
        public IEnumerable<RoomType> RoomTypes { get; set; }

        public int Total { get; set; }

        public int Take { get; set; }

        public int Page { get; set; }
    }
}