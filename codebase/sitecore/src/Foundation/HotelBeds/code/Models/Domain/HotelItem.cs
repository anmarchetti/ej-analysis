using System.Collections.Generic;
using Sitecore.Data.Items;

namespace easyJet.Foundation.HotelBeds.Models.Domain
{
    public class HotelItem
    {
        /// <summary>
        /// Gets or sets Hotel Item.
        /// </summary>
        public Item Item { get; set; }

        /// <summary>
        /// Gets or sets Hotel's images.
        /// </summary>
        public List<Item> Images { get; set; }

        /// <summary>
        /// Gets or sets Hotel's facilities.
        /// </summary>
        public IEnumerable<Item> Facilities { get; set; }
    }
}