using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class ThemeTypeIds
    {
        public ThemeTypeIds(Item item)
        {
            if (item == null)
            {
                return;
            }

            ThemeId = item.Parent.ID;
            TypeId = item.ID;
        }

        /// <summary>
        /// Gets or sets theme id.
        /// </summary>
        public ID ThemeId { get; set; }

        /// <summary>
        /// Gets or sets type id.
        /// </summary>
        public ID TypeId { get; set; }
    }
}