using System.Linq;
using System.Runtime.CompilerServices;
using easyJet.Foundation.SitecoreExtensions.ContentSearch.Fields;
using easyJet.Foundation.SitecoreExtensions.Utils;
using Sitecore.ContentSearch;
using Sitecore.Data.Items;

[assembly: InternalsVisibleTo("easyJet.Foundation.Multisite.Tests")]
[assembly: InternalsVisibleTo("DynamicProxyGenAssembly2")]

namespace easyJet.Foundation.Voucherify.ContentSearch.Fields
{
    public class MarketCodeComputedField : BaseComputedIndexField
    {
        internal virtual Item[] GetMultilistTargetItemFromUtils(Item item) => FieldUtils.GetMultilistTargetItems(Templates.PromotionMarketFolder.Fields.Markets, item);

        /// <inheritdoc />
        protected override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            var parent = indexableItem.Item.Parent;
            if (parent.TemplateID == Templates.PromotionMarketFolder.Id)
            {
                return GetMultilistTargetItemFromUtils(parent).Select(item => item.Fields[Multisite.Templates.Market.Fields.Code]?.ToString());
            }

            return null;
        }

        /// <inheritdoc />
        protected override bool IsValid(SitecoreIndexableItem indexableItem)
        {
            return indexableItem.Item.TemplateID.Equals(Templates.Promotion.Id);
        }
    }
}