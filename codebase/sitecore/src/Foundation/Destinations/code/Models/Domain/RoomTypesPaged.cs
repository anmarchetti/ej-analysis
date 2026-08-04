using System.Collections.Generic;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class RoomTypesPaged
    {
        /// <summary>
        /// Gets or sets rooms collection.
        /// </summary>
        public IEnumerable<RoomType> Rooms { get; set; }

        /// <summary>
        /// Gets or sets number of Total Search Results.
        /// </summary>
        public int TotalSearchResults { get; set; }
    }
}