using System.Linq;
using easyJet.Foundation.SitecoreExtensions.ContentSearch.Fields;
using Sitecore.ContentSearch;

namespace easyJet.Foundation.Voucherify.ContentSearch.Fields
{
    public class PromotionCodesComputedField : BaseComputedIndexField
    {
        protected override bool IsValid(SitecoreIndexableItem indexableItem) => indexableItem.Item.TemplateID.Equals(Templates.Promotion.Id);

        protected override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            var promoCodes = indexableItem.Item.Children
                .Where(i => i != null && i.TemplateID.Equals(Templates.PromotionCodeConfiguration.Id))
                .Select(i => i.Fields[Templates.PromotionCodeConfiguration.Fields.AtcomPromoCode].Value).ToArray();
            return promoCodes;
        }
    }
}