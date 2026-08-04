using easyJet.Feature.MediaCenter.ContentSearch.Repositories;
using easyJet.Feature.MediaCenter.ContentSearch.SearchTypes;
using easyJet.Feature.MediaCenter.Events;
using easyJet.Feature.MediaCenter.Tests.Infrastructure;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using NSubstitute;
using Sitecore.ContentSearch.Linq;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Events;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Feature.MediaCenter.Tests.Events
{
    public class TopArticleEventHandlerTests
    {
        private readonly IArticleSearchRepository repository;
        private readonly TopArticleEventHandler handler;
        private readonly IDatabaseProvider databaseProvider;

        public TopArticleEventHandlerTests()
        {
            repository = Substitute.For<IArticleSearchRepository>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            handler = new TopArticleEventHandler(repository, databaseProvider);
        }

        [Theory]
        [AutoDbData]
        public void OnItemSaved_ShouldNotUncheckTopActicles_IfItemIsNotArticle(Item item)
        {
            // Arrange
            var args = new SitecoreEventArgs(
                "onsave",
                new object[] { item },
                new EventResult());

            // Act
            handler.OnItemSaved(null, args);

            // Assert
            repository.DidNotReceive().GetTopArticles(Arg.Any<Database>());
        }

        [Theory]
        [AutoDbData]
        public void OnItemSaved_ShouldUncheckTopActicles_IfArgsItemIsArticlePage(Db db, ArticalPageDbItem articalPageDbItem1, ArticalPageDbItem articalPageDbItem2)
        {
            // Arrange
            var articleItem = db.GetItem(articalPageDbItem1.ID);
            articleItem.Editing.BeginEdit();
            articleItem[Constants.FieldsIds.ArticlePageItem.IsTopArticle] = "1";
            articleItem.Editing.EndEdit();

            var args = new SitecoreEventArgs(
                "onsave",
                new object[] { articleItem },
                new EventResult());

            var acticle1 = Substitute.For<ArticleSearchResultItem>();
            acticle1.ItemId.Returns(articalPageDbItem1.ID);
            acticle1.Uri.Returns(db.GetItem(articalPageDbItem1.ID).Uri);

            var acticle2 = Substitute.For<ArticleSearchResultItem>();
            acticle2.ItemId.Returns(articalPageDbItem2.ID);
            acticle2.Uri.Returns(db.GetItem(articalPageDbItem2.ID).Uri);

            var hits = new SearchHit<ArticleSearchResultItem>[]
            {
                new SearchHit<ArticleSearchResultItem>(1, acticle1),
                new SearchHit<ArticleSearchResultItem>(1, acticle2),
            };

            var result = new SearchResults<ArticleSearchResultItem>(hits, 2);
            repository.GetTopArticles(Arg.Any<Database>()).Returns(result);

            var item1 = db.GetItem(articalPageDbItem1.ID);
            databaseProvider.GetItem(item1.Uri).Returns(item1);

            var item2 = db.GetItem(articalPageDbItem2.ID);
            databaseProvider.GetItem(item2.Uri).Returns(item2);

            // Act
            handler.OnItemSaved(null, args);

            // Assert
            var article = db.GetItem(articalPageDbItem2.ID);
            article.Fields[Constants.Fields.ArticlePageItem.IsTopArticle].Value.Should().Be("0");
            repository.Received().GetTopArticles(Arg.Any<Database>());
        }
    }
}