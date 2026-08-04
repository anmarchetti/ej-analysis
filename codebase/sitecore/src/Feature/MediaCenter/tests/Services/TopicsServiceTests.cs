using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Feature.MediaCenter.Services;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Xunit;

namespace easyJet.Feature.MediaCenter.Tests.Services
{
    public class TopicsServiceTests
    {
        private readonly IHtmlCacheRepository cacheRepository;
        private readonly TopicsService topicsService;

        public TopicsServiceTests()
        {
            cacheRepository = Substitute.For<IHtmlCacheRepository>();
            topicsService = new TopicsService(cacheRepository);
        }

        [Theory]
        [AutoData]
        public void TopicsService_ShouldReturnTopics_IfTopicsExisting(Db db)
        {
            // Arrange
            var dataFolder = new DbItem("Data");
            var topicsFolder = new DbItem("Topics", ID.NewID, Constants.TemplateIds.TopicsFolder);
            var topicItem = new DbItem("Topic 1", ID.NewID, Constants.TemplateIds.Topic);
            topicsFolder.Add(topicItem);
            dataFolder.Add(topicsFolder);
            db.Add(dataFolder);

            cacheRepository.GetItem<IEnumerable<string>>(Arg.Any<string>()).Returns<object>(null);

            var fakeSite = new FakeSiteContext(
                    new Sitecore.Collections.StringDictionary
                    {
                        { "name", "website" }, { "database", "master" }, { "rootPath", "/sitecore/content" }
                    });
            using (new FakeSiteContextSwitcher(fakeSite))
            {
                // Act
                var actual = topicsService.GetTopics();
                // Assert
                actual.Should().HaveCount(1);
            }
        }

        [Fact]
        public void TopicsService_ShouldReturnTopicsFromCahche_IfTopicsExistingInCache()
        {
            // Arrange
            cacheRepository.GetItem<IEnumerable<string>>(Arg.Any<string>()).Returns(new string[] { "Topic 1" });

            var fakeSite = new FakeSiteContext(
                    new Sitecore.Collections.StringDictionary
                    {
                        { "name", "website" }, { "database", "master" }, { "rootPath", "/sitecore/content" }
                    });

            using (new FakeSiteContextSwitcher(fakeSite))
            {
                // Act
                var actual = topicsService.GetTopics();

                // Assert
                actual.Should().HaveCount(1);
            }
        }
    }
}
