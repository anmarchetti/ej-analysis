using Sitecore.Data.Items;
using Sitecore.Globalization;

namespace easyJet.Foundation.Voucherify.ContentSearch.Repositories
{
    public interface IPromotionRepository
    {
        /// <summary>
        /// Get promotions by customer promo code and from specific market.
        /// </summary>
        /// <param name="promoCode">Customer promo code.</param>
        /// <param name="marketCode">Market code.</param>
        /// <param name="lang">Language.</param>
        /// <returns>Collection of promotions.</returns>
        Item[] GetPromotions(string promoCode, string marketCode, Language lang);

        /// <summary>
        /// Get promotions from specific market.
        /// </summary>
        /// <param name="marketCode">Market code.</param>
        /// <returns>Collection of promotions.</returns>
        Item[] GetAll(string marketCode);

        /// <summary>
        /// Get the promotion by atcom code from specific market.
        /// </summary>
        /// <param name="atcomCode">Atcom promo code.</param>
        /// <param name="marketCode">Market code.</param>
        /// <returns>Collection of promotions.</returns>
        Item GetPromotionByAtcomCode(string atcomCode, string marketCode);
    }
}
