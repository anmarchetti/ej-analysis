using Sitecore.Data;
using Sitecore.FakeDb;

namespace easyJet.Feature.MediaCenter.Tests.Infrastructure
{
    public class ArticalPageDbItem : DbItem
    {
        public ArticalPageDbItem(string name, ID id)
            : base(name, id, Constants.TemplateIds.ArticlePage)
        {
            Add(new DbField(Constants.Fields.ArticlePageItem.IsTopArticle, Constants.FieldsIds.ArticlePageItem.IsTopArticle));
        }
    }
}
