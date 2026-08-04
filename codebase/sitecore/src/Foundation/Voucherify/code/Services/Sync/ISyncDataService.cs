using Sitecore.Data.Items;

namespace easyJet.Foundation.Voucherify.Services
{
    public interface ISyncDataService
    {
        /// <summary>
        /// Sync Promotion Item To Voucherify.
        /// </summary>
        /// <param name="item">Context Item.</param>
        /// <returns>Updated Context Item.</returns>
        Item[] SyncPromotionToVoucherifyAndEnforceSortOrder(Item item);
    }
}