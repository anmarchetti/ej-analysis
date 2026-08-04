using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.Voucherify.Models.Domain.Validation;
using Sitecore;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Voucherify.Mappers
{
    public class PromotionCodeValidationRulesMapper : ValidationBaseMapper
    {
        public static PromotionCodeValidationRules BuildValidationRules(Item promotionCode, Item parent)
        {
            return new PromotionCodeValidationRules
            {
                DateRangeOfValidity = GetValidationRule(
                    BuildDateTimeRange(promotionCode, Templates.Promotion.Fields.DateValidityFrom, Templates.Promotion.Fields.DateValidityTo),
                    parent[Templates.Promotion.Fields.DateRangeOfValidityErrorCode]),
                TotalPrice = GetValidationRule(
                    promotionCode.GetDecimal(Templates.PromotionCodeConfiguration.Fields.MinimumSpend),
                    parent[Templates.Promotion.Fields.MinimumPriceErrorCode],
                    Constants.Placeholdres.MinPricePlaceholder),
                PerPersonPrice = GetValidationRule(
                    promotionCode.GetDecimal(Templates.PromotionCodeConfiguration.Fields.MinimumSpendPerPerson),
                    parent[Templates.Promotion.Fields.PerPersonPriceErrorCode],
                    Constants.Placeholdres.MinPricePlaceholder),
            };
        }
    }
}