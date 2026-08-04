using easyJet.Foundation.SitecoreExtensions.ContentSearch.Fields;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore;
using Sitecore.ContentSearch;

namespace easyJet.Feature.MediaCenter.ContentSearch.Fields
{
    public class ArticleUrlComputedField : BaseComputedIndexField
    {
        /// <inheritdoc/>
        protected override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            var siteContextName = Sitecore.Configuration.Settings.GetSetting("MediaCenter.SiteContextName");
            return !string.IsNullOrWhiteSpace(indexableItem.Item.Fields[FieldIDs.LayoutField].Value) ? indexableItem.Item.GetItemUrl(siteContextName) : null;
        }

        /// <inheritdoc/>
        protected override bool IsValid(SitecoreIndexableItem indexableItem)
        {
            return indexableItem.Item.TemplateID.Equals(Constants.TemplateIds.ArticlePage);
        }
    }
}