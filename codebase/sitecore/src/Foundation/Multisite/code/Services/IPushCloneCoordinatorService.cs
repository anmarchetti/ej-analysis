using Sitecore.Data.Items;

namespace easyJet.Foundation.Multisite.Services
{
    public interface IPushCloneCoordinatorService
    {
        /// <summary>
        /// If clone item should be procceded.
        /// </summary>
        /// <param name="clone">Clone item.</param>
        /// <returns>True if item should be procceded.</returns>
        bool ShouldProcess(Item clone);

        /// <summary>
        /// Check if item is a Page Item.
        /// </summary>
        /// <param name="item">Item.</param>
        /// <returns>True if the item is a Page Item.</returns>
        bool IsPage(Item item);
    }
}
