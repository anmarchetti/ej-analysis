using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class PromoCollection
    {
        public PromoCollection()
        {
            // required for deserialization
        }

        public PromoCollection(Item item)
        {
            Key = item?.Fields[Constants.Fields.PromotionCollectionItem.Key]?.Value;
            PromotionCodes = item?.Fields[Constants.Fields.PromotionCollectionItem.PromotionCodes]?.Value ?? string.Empty;

            Name = item?.Fields[Constants.Fields.PromotionCollectionItem.Title]?.Value ?? item?.Name;
        }

        /// <summary>
        /// Gets or sets Key of the promo collection. e.g. "lux"
        /// </summary>
        public string Key { get; set; }

        /// <summary>
        /// Gets or sets Atcom promo codes.
        /// </summary>
        public string PromotionCodes { get; set; }

        /// <summary>
        /// Gets or sets Name.
        /// </summary>
        public string Name { get; set; }

        public override string ToString()
        {
            return Name;
        }
    }
}