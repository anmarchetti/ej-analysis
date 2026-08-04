using easyJet.Feature.MediaCenter.ContentSearch.Queries;
using easyJet.Feature.MediaCenter.ContentSearch.SearchTypes;
using Sitecore.ContentSearch.Linq;
using Sitecore.Data;

namespace easyJet.Feature.MediaCenter.ContentSearch.Repositories
{
    public interface IArticleSearchRepository
    {
        /// <summary>
        /// Get articles by topics, query and order by publiccation date.
        /// </summary>
        /// <param name="args">Topics query args for filtring articles.</param>
        /// <returns>Array of articles.</returns>
        SearchResults<ArticleSearchResultItem> GetArticles(ArticlesQueryArgs args);

        /// <summary>
        /// Get articles which marked as top article.
        /// </summary>
        /// <param name="database">Sitecore database.</param>
        /// <returns>Top articles.</returns>
        SearchResults<ArticleSearchResultItem> GetTopArticles(Database database = null);
    }
}