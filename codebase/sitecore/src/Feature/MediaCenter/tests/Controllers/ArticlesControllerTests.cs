using System;
using System.Collections.Generic;
using System.Web.Mvc;
using AutoFixture.Xunit2;
using easyJet.Feature.MediaCenter.ContentSearch.Queries;
using easyJet.Feature.MediaCenter.ContentSearch.Repositories;
using easyJet.Feature.MediaCenter.ContentSearch.SearchTypes;
using easyJet.Feature.MediaCenter.Controllers;
using easyJet.Feature.MediaCenter.Models.Requests;
using easyJet.Feature.MediaCenter.Models.Responses;
using easyJet.Feature.MediaCenter.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.ContentSearch.Linq;
using Xunit;

namespace easyJet.Feature.MediaCenter.Tests.Controllers
{
    public class ArticlesControllerTests
    {
        private readonly IArticleSearchRepository articleSearchRepository;
        private readonly ITopicsService topicsService;
        private readonly ArticleController articleController;

        public ArticlesControllerTests()
        {
            articleSearchRepository = Substitute.For<IArticleSearchRepository>();
            topicsService = Substitute.For<ITopicsService>();
            articleController = new ArticleController(articleSearchRepository, topicsService);
        }

        [Theory]
        [AutoData]
        public void Articles_ShouldReturnArticlesAndFacets_IfRequsetContainsValidData(ArticlesByTopicsRequest request)
        {
            // Arrange
            var hints = new List<SearchHit<ArticleSearchResultItem>>()
            {
                {
                    new SearchHit<ArticleSearchResultItem>(1, new ArticleSearchResultItem()
                    {
                        Title = "Title",
                        TopContent = "TopContent",
                        BottomContent = "BottomContent",
                        PublicationDate = DateTime.Now,
                        Image = "image",
                        Topics = new string[] { "Topic 1" }
                    })
                }
            };
            var facetResults = new FacetResults();
            facetResults.Categories.Add(new FacetCategory("topics", new FacetValue[] { new FacetValue("Topic 1", 1) }));
            var results = new SearchResults<ArticleSearchResultItem>(hints, 1, facetResults);

            articleSearchRepository.GetArticles(Arg.Any<ArticlesQueryArgs>()).Returns(results);

            // Act
            var actual = (ArticlesResponse)(articleController.Search(request) as JsonResult).Data;

            // Assert
            actual.Total.Should().Be(1);
            actual.Articles.Should().NotBeNull();
            actual.TopicsFilter.Should().NotBeNull();
        }

        [Theory]
        [AutoData]
        public void GetTopics_ShouldReturnAllTopics_IfDataExisting(string topicName)
        {
            // Arrange
            topicsService.GetTopics().Returns(new string[] { topicName });
            // Act
            var actual = (IEnumerable<string>)(articleController.GetTopics() as JsonResult).Data;
            // Assert
            actual.Should().HaveCount(1);
        }
    }
}
