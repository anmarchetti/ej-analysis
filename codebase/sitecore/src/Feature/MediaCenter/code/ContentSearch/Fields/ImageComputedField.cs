using easyJet.Foundation.SitecoreExtensions.ContentSearch.Fields;
using Sitecore.ContentSearch;

namespace easyJet.Feature.MediaCenter.ContentSearch.Fields
{
    public class ImageComputedField : BaseImageComputedField
    {
        protected override string ItemFieldName => Constants.Fields.ArticlePageItem.Image;

        /// <inheritdoc/>
        protected override bool IsValid(SitecoreIndexableItem indexableItem)
        {
            return indexableItem.Item.TemplateID.Equals(Constants.TemplateIds.ArticlePage);
        }
    }
}