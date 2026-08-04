using System;
using System.Linq;
using easyJet.Feature.MediaCenter.ContentSearch.Queries;
using easyJet.Feature.MediaCenter.ContentSearch.Repositories;
using easyJet.Feature.MediaCenter.ContentSearch.SearchTypes;
using easyJet.Feature.MediaCenter.ContentSearch.Settings;
using easyJet.Foundation.Testing.ContentSearch;
using FluentAssertions;
using NSubstitute;
using Sitecore.Configuration;
using Sitecore.ContentSearch;
using Sitecore.FakeDb.Sites;
using Xunit;

namespace easyJet.Feature.MediaCenter.Tests.ContentSearch.Repositories
{
    public class ArticleSearchRepositoryTests
    {
        private readonly ISearchSettings settings;
        private readonly IProviderSearchContext provider;
        private readonly ProviderIndexConfiguration configuration;
        private readonly FakeSearchIndex index;

        public ArticleSearchRepositoryTests()
        {
            settings = new SearchSettings() { IndexName = "sitecore_test_index" };
            provider = Substitute.For<IProviderSearchContext>();
            configuration = Substitute.For<ProviderIndexConfiguration>();
            index = new FakeSearchIndex(provider, configuration, settings.IndexName);
        }

        [Theory(Skip = "IOrderedQueryable interface not supported yet.")]
        [InlineData("Article 1", "en", true, "Topic 1")]
        public void GetArticles_ShouldReturnArticle_IfArticleExists(string title, string language, bool isLatestVersion, params string[] topics)
        {
            // Arrange
            var date = DateTime.Now;

            var fakeSiteContext = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "fake" },
                    { "database", "master" },
                    { "language", "en" }
                });

            using (new FakeSiteContextSwitcher(fakeSiteContext))
            {
                var queryable = new SearchProviderQueryableCollection<ArticleSearchResultItem>(new ArticleSearchResultItem[]
                {
                    new ArticleSearchResultItem()
                        {
                            TemplateId = Constants.TemplateIds.ArticlePage,
                            Title = title,
                            Topics = topics,
                            PublicationDate = date,
                            IsLatestVersion = isLatestVersion,
                            IsTopArticle = true,
                            Language = language
                        }
                });

                provider.GetQueryable<ArticleSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                using (new SettingsSwitcher("ContentSearch.Articles.IndexName", "sitecore_test_index"))
                {
                    var repository = new ArticleSearchRepository(settings);

                    // Act
                    var result = repository.GetArticles(new ArticlesQueryArgs(1, 1, 0, date, date, "Article 1", new string[] { "Topic 1" }));

                    // Assert
                    result.Hits.Should().HaveCount(1);
                    result.Hits.FirstOrDefault().Document.Title.Should().Be(title);
                    result.Hits.FirstOrDefault().Document.Language.Should().Be(language);
                    result.Hits.FirstOrDefault().Document.TemplateId.Should().Be(Constants.TemplateIds.ArticlePage);
                    result.Hits.FirstOrDefault().Document.Topics.Should().HaveCount(topics.Length);
                }
            }
        }

        [Theory]
        [InlineData("Article 1", "en", true, "Topic 1")]
        public void GetTopArticle_ShouldReturnTopArticle_IfArticleExists(string title, string language, bool isLatestVersion, params string[] topics)
        {
            // Arrange
            var date = DateTime.Now;

            var fakeSiteContext = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "fake" },
                    { "database", "master" },
                    { "language", "en" }
                });

            using (new FakeSiteContextSwitcher(fakeSiteContext))
            {
                var queryable = new SearchProviderQueryableCollection<ArticleSearchResultItem>(new ArticleSearchResultItem[]
                {
                    new ArticleSearchResultItem()
                        {
                            TemplateId = Constants.TemplateIds.ArticlePage,
                            Title = title,
                            Topics = topics,
                            PublicationDate = date,
                            IsLatestVersion = isLatestVersion,
                            IsTopArticle = true,
                            Language = language
                        }
                });

                provider.GetQueryable<ArticleSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                using (new SettingsSwitcher("ContentSearch.Articles.IndexName", "sitecore_test_index"))
                {
                    // Act
                    var result = new ArticleSearchRepository(settings).GetTopArticles();

                    var topArticle = result.Hits.Select(x => x.Document).FirstOrDefault();
                    // Assert
                    topArticle.Title.Should().Be(title);
                    topArticle.IsTopArticle.Should().BeTrue();
                    topArticle.Language.Should().Be(language);
                    topArticle.TemplateId.Should().Be(Constants.TemplateIds.ArticlePage);
                    topArticle.Topics.Should().HaveCount(topics.Length);
                }
            }
        }
    }
}
