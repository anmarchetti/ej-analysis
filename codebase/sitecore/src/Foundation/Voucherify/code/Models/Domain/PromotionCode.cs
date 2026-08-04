using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.Voucherify.Mappers;
using easyJet.Foundation.Voucherify.Models.Domain.Validation;
using Sitecore;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Voucherify.Models.Domain
{
    public class PromotionCode : PromocodeDiscounts
    {
        public PromotionCode()
        {
        }

        public PromotionCode(Item item, Item parent)
        {
            Id = item.ID.ToString();
            AtcomPromoCode = item.Fields[Templates.PromotionCodeConfiguration.Fields.AtcomPromoCode].Value;
            MinimumSpend = item.GetDecimal(Templates.PromotionCodeConfiguration.Fields.MinimumSpend) ?? 0;
            MinimumSpendPerPerson = item.GetDecimal(Templates.PromotionCodeConfiguration.Fields.MinimumSpendPerPerson) ?? 0;
            DiscountAmountPerBooking = item.GetDecimal(Templates.PromotionCodeConfiguration.Fields.DiscountAmountPerBooking) ?? 0;
            PercentageDiscountPerBooking = item.GetDecimal(Templates.PromotionCodeConfiguration.Fields.PercentageDiscountPerBooking) ?? 0;
            AdultDiscountAmountPerPerson = item.GetDecimal(Templates.PromotionCodeConfiguration.Fields.AdultDiscountAmountPerPerson) ?? 0;
            AdultPercentageAmountPerPerson = item.GetDecimal(Templates.PromotionCodeConfiguration.Fields.AdultPercentageAmountPerPerson) ?? 0;
            ChildDiscountAmountPerPerson = item.GetDecimal(Templates.PromotionCodeConfiguration.Fields.ChildDiscountAmountPerPerson) ?? 0;
            ChildPercentageAmountPerPerson = item.GetDecimal(Templates.PromotionCodeConfiguration.Fields.ChildPercentageAmountPerPerson) ?? 0;
            HideOnPromoBanner = MainUtil.GetBool(item.Fields[Templates.PromotionCodeConfiguration.Fields.HideOnPromoBanner]?.Value, false);

            ValidationRules = PromotionCodeValidationRulesMapper.BuildValidationRules(item, parent);
        }

        /// <summary>
        /// Gets or sets Item Id.
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Gets or sets Promotion Atcom Code.
        /// </summary>
        public string AtcomPromoCode { get; set; }

        /// <summary>
        /// Gets or sets Minimum Spend.
        /// </summary>
        public decimal MinimumSpend { get; set; }

        /// <summary>
        /// Gets or sets Minimum Spend Per Person
        /// </summary>
        public decimal MinimumSpendPerPerson { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether this promo tier should be hidden on promotion banner.
        /// </summary>
        public bool HideOnPromoBanner { get; set; }

        /// <summary>
        /// Gets or sets validation rules for booking pricing and discount.
        /// </summary>
        public PromotionCodeValidationRules ValidationRules { get; set; }
    }
}