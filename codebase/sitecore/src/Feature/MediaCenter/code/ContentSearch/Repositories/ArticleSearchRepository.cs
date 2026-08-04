using System.Linq;
using easyJet.Feature.MediaCenter.ContentSearch.Queries;
using easyJet.Feature.MediaCenter.ContentSearch.SearchTypes;
using easyJet.Feature.MediaCenter.ContentSearch.Settings;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using Sitecore.ContentSearch.Linq;
using Sitecore.ContentSearch.Linq.Utilities;
using Sitecore.Data;

namespace easyJet.Feature.MediaCenter.ContentSearch.Repositories
{
    [Service(typeof(IArticleSearchRepository), Lifetime = Lifetime.Transient)]
    public class ArticleSearchRepository : SearchRepository, IArticleSearchRepository
    {
        public ArticleSearchRepository(ISearchSettings settings)
            : base(settings)
        {
        }

        /// <inheritdoc/>
        public SearchResults<ArticleSearchResultItem> GetArticles(ArticlesQueryArgs args)
        {
            var query = Context.GetQueryable<ArticleSearchResultItem>()
                .Where(item => item.TemplateId == Constants.TemplateIds.ArticlePage);

            var predicate = PredicateBuilder.True<ArticleSearchResultItem>();
            var queryPredicate = PredicateBuilder.True<ArticleSearchResultItem>();
            var topicsPredicate = PredicateBuilder.True<ArticleSearchResultItem>();
            var datePredicate = PredicateBuilder.True<ArticleSearchResultItem>();

            if (!string.IsNullOrWhiteSpace(args.Query))
            {
                queryPredicate = queryPredicate.And(item => item.Title.Contains(args.Query) || item.TopContent.Contains(args.Query) || item.BottomContent.Contains(args.Query) || item.ShortDescription.Contains(args.Query));
                predicate = predicate.And(queryPredicate);
            }

            if (args.Topics != null && args.Topics.Any())
            {
                foreach (var topic in args.Topics)
                {
                    topicsPredicate = topicsPredicate.And(item => item.Topics.Contains(topic));
                }

                predicate = predicate.And(topicsPredicate);
            }

            datePredicate = datePredicate.And(item => item.PublicationDate.Between(args.StartDate, args.EndDate, Inclusion.Both));
            predicate = predicate.And(datePredicate);

            query = query.Where(predicate).FacetOn(item => item.Topics).OrderByDescending(x => x.IsTopArticle).ThenByDescending(item => item.PublicationDate);

            return Search(query, args.Page, args.Take, args.Offset);
        }

        /// <inheritdoc/>
        public SearchResults<ArticleSearchResultItem> GetTopArticles(Database database = null)
        {
            var context = database == null ? Context : GetContext(database);
            var query = context.GetQueryable<ArticleSearchResultItem>()
                .Where(item => item.TemplateId == Constants.TemplateIds.ArticlePage && item.IsTopArticle);

            return Search(query);
        }
    }
}