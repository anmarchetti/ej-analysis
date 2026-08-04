using System.Linq;
using easyJet.Foundation.SitecoreExtensions.ContentSearch.Fields;
using easyJet.Foundation.SitecoreExtensions.Utils;
using Sitecore.ContentSearch;
using Sitecore.Data.Fields;

namespace easyJet.Feature.MediaCenter.ContentSearch.Fields
{
    public class TopicsComputedField : BaseComputedIndexField
    {
        /// <inheritdoc />
        protected override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            var items = FieldUtils.GetMultilistTargetItems(Constants.Fields.ArticlePageItem.Topics, indexableItem);

            return (items == null || items?.Length == 0)
                ? null
                : items.Select(x => x.Fields[Constants.Fields.TopicItem.Name].Value);
        }

        /// <inheritdoc />
        protected override bool IsValid(SitecoreIndexableItem indexableItem)
        {
            return indexableItem.Item.TemplateID.Equals(Constants.TemplateIds.ArticlePage);
        }
    }
}