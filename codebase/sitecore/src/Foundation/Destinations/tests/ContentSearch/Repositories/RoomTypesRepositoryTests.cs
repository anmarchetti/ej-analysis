using System.Linq;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.ContentSearch.Settings;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Testing.ContentSearch;
using FluentAssertions;
using NSubstitute;
using Sitecore.ContentSearch;
using Sitecore.FakeDb.Sites;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Repositories
{
    public class RoomTypesRepositoryTests
    {
        private readonly IDestinationSearchSettings settings;
        private readonly IProviderSearchContext provider;
        private readonly ProviderIndexConfiguration configuration;
        private readonly FakeSearchIndex index;
        private readonly IDestinationsLogger logger;

        public RoomTypesRepositoryTests()
        {
            settings = Substitute.For<IDestinationSearchSettings>();
            settings.IndexName.Returns("sitecore_test_index");
            provider = Substitute.For<IProviderSearchContext>();
            configuration = Substitute.For<ProviderIndexConfiguration>();
            logger = Substitute.For<IDestinationsLogger>();
            index = new FakeSearchIndex(provider, configuration, settings.IndexName);
        }

        [Theory]
        [InlineData("name1")]
        public void GetAll_ShouldGetAllRoomTypes_IfRoomTypesExist(string name)
        {
            // Arrange
            var fakeSiteContext = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "fake" },
                    { "database", "master" },
                    { "language", "en" },
                    { "rootPath", "/sitecore/content" }
                });

            using (new FakeSiteContextSwitcher(fakeSiteContext))
            {
                var queryable = new SearchProviderQueryableCollection<RoomTypeSearchResultItem>(new RoomTypeSearchResultItem[]
                {
                    new RoomTypeSearchResultItem()
                        {
                            TemplateId = Constants.TemplateIds.RoomType,
                            Name = name,
                            IsLatestVersion = true,
                            Language = "en",
                            Path = "/sitecore/content"
                        }
                });

                provider.GetQueryable<RoomTypeSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new RoomTypesRepository(settings, logger).GetAll();

                    // Assert
                    result.Hits.Should().HaveCount(1);
                    result.Hits.FirstOrDefault().Document.TemplateId.Should().Be(Constants.TemplateIds.RoomType);
                    result.Hits.FirstOrDefault().Document.Name.Should().Be(name);
                }
            }
        }

        [Theory]
        [InlineData("name1", "code1")]
        public void GetByCodes_ShouldGetRoomTypesByCodes_IfRoomTypesExist(string name, string code)
        {
            // Arrange
            var fakeSiteContext = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "fake" },
                    { "database", "master" },
                    { "language", "en" },
                    { "rootPath", "/sitecore/content" }
                });

            using (new FakeSiteContextSwitcher(fakeSiteContext))
            {
                var queryable = new SearchProviderQueryableCollection<RoomTypeSearchResultItem>(new RoomTypeSearchResultItem[]
                {
                    new RoomTypeSearchResultItem()
                        {
                            TemplateId = Constants.TemplateIds.RoomType,
                            Name = name,
                            Code = code,
                            IsLatestVersion = true,
                            Language = "en",
                            Path = "/sitecore/content"
                        }
                });

                provider.GetQueryable<RoomTypeSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new RoomTypesRepository(settings, logger).GetByCodes(new string[] { code });

                    // Assert
                    result.Hits.Should().HaveCount(1);
                    result.Hits.FirstOrDefault().Document.TemplateId.Should().Be(Constants.TemplateIds.RoomType);
                    result.Hits.FirstOrDefault().Document.Name.Should().Be(name);
                    result.Hits.FirstOrDefault().Document.Code.Should().Be(code);
                }
            }
        }

        [Theory]
        [InlineData("name1", 1, 1)]
        public void Get_ShouldGetRoomType_IfRoomTypeExists(string name, int page, int take)
        {
            // Arrange
            var fakeSiteContext = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "fake" },
                    { "database", "master" },
                    { "language", "en" },
                    { "rootPath", "/sitecore/content" }
                });

            using (new FakeSiteContextSwitcher(fakeSiteContext))
            {
                var queryable = new SearchProviderQueryableCollection<RoomTypeSearchResultItem>(new RoomTypeSearchResultItem[]
                {
                    new RoomTypeSearchResultItem()
                        {
                            TemplateId = Constants.TemplateIds.RoomType,
                            Name = name,
                            IsLatestVersion = true,
                            Language = "en",
                            Path = "/sitecore/content"
                        }
                });

                provider.GetQueryable<RoomTypeSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new RoomTypesRepository(settings, logger).Get(page, take);

                    // Assert
                    result.Hits.Should().HaveCount(1);
                    result.Hits.FirstOrDefault().Document.TemplateId.Should().Be(Constants.TemplateIds.RoomType);
                    result.Hits.FirstOrDefault().Document.Name.Should().Be(name);
                }
            }
        }
    }
}
