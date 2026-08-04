using Sitecore.Data.Items;

namespace easyJet.Foundation.Multisite.Services
{
    public interface IDelegatedAreaService
    {
        /// <summary>
        /// Checks if the item is in Delegated Area.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <returns>True if the item is in Delegated Area.</returns>
        bool CheckForDelegatedArea(Item item);

        bool AddToDelegatedArea(Item sharedItem, Item targetItem);
    }
}