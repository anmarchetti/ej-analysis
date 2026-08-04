using System;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.ContentSearch.Extensions
{
    [Flags]
    public enum VirtualDestinationTypes
    {
        Country = 1,
        Region = 2,
        Resort = 4,
        All = Country | Region | Resort
    }

    public static class ItemExtensions
    {
        /// <summary>
        /// Checks in current item has Country, Location,
        /// Resort or Accommodation TemplateID.
        /// </summary>
        /// <param name="item">Sitecore Item.</param>
        /// <returns>True or False.</returns>
        public static bool IsDestinationItem(this Item item)
        {
            if (item == null)
            {
                return false;
            }

            return item.TemplateID.Equals(Constants.TemplateIds.Country) ||
                   item.TemplateID.Equals(Constants.TemplateIds.Location) ||
                   item.TemplateID.Equals(Constants.TemplateIds.LocationCity) ||
                   item.TemplateID.Equals(Constants.TemplateIds.Resort) ||
                   item.TemplateID.Equals(Constants.TemplateIds.Accommodation);
        }

        /// <summary>
        /// Checks in current item has VirtualCountry, VirtualRegion
        /// or VirtualResort TemplateID.
        /// </summary>
        /// <param name="item">Sitecore Item.</param>
        /// <param name="types">Flags indicating which virtual destination types to check for.</param>
        /// <returns>True or False.</returns>
        public static bool IsVirtualDestinationItem(this Item item, VirtualDestinationTypes types = VirtualDestinationTypes.All)
        {
            if (item == null)
            {
                return false;
            }

            return (types.HasFlag(VirtualDestinationTypes.Country) && item.TemplateID.Equals(Constants.TemplateIds.VirtualCountry)) ||
                   (types.HasFlag(VirtualDestinationTypes.Region) && item.TemplateID.Equals(Constants.TemplateIds.VirtualRegion)) ||
                   (types.HasFlag(VirtualDestinationTypes.Resort) && item.TemplateID.Equals(Constants.TemplateIds.VirtualResort));
        }

        /// <summary>
        /// Check if item is accommodation child item.
        /// </summary>
        /// <param name="item">Item to check.</param>
        /// <returns>True if item is accommodation child item, False otherwise.</returns>
        public static bool IsAccommodationChildItem(this Item item)
        {
            if (item == null)
            {
                return false;
            }

            return item.TemplateID.Equals(Constants.TemplateIds.AccommodationRoom) ||
                   item.TemplateID.Equals(Constants.TemplateIds.SitecoreImage) ||
                   item.TemplateID.Equals(Constants.TemplateIds.ExternalImage) ||
                   item.TemplateID.Equals(Constants.TemplateIds.AccommodationFacility) ||
                   item.TemplateID.Equals(Constants.TemplateIds.AccommodationBoard) ||
                   item.TemplateID.Equals(Constants.TemplateIds.RoomFacility);
        }

        /// <summary>
        /// Check if item is hotel (accommodation) item.
        /// </summary>
        /// <param name="item">Item to check.</param>
        /// <returns>True if item is accommodation, False otherwise.</returns>
        public static bool IsHotelItem(this Item item)
        {
            return item != null && item.TemplateID.Equals(Constants.TemplateIds.Accommodation);
        }
    }
}
