using System.Linq;
using easyJet.Foundation.AmazonS3.ContentSearch.Repositories;
using easyJet.Foundation.AmazonS3.ContentSearch.SearchTypes;
using easyJet.Foundation.AmazonS3.ContentSearch.Settings;
using easyJet.Foundation.Testing.ContentSearch;
using FluentAssertions;
using NSubstitute;
using Sitecore.ContentSearch;
using Sitecore.FakeDb.Sites;
using Xunit;
using DestinationsConstants = easyJet.Foundation.Destinations.Constants;

namespace easyJet.Foundation.AmazonS3.Tests.ContentSearch.Repositories
{
    public class ExternaImagesRepositoryTests
    {
        private readonly ISearchSettings settings;
        private readonly IProviderSearchContext provider;
        private readonly ProviderIndexConfiguration configuration;
        private readonly FakeSearchIndex index;

        public ExternaImagesRepositoryTests()
        {
            settings = Substitute.For<ISearchSettings>();
            settings.IndexName.Returns("sitecore_test_index");
            provider = Substitute.For<IProviderSearchContext>();
            configuration = Substitute.For<ProviderIndexConfiguration>();
            index = new FakeSearchIndex(provider, configuration, settings.IndexName);
        }

        [Theory]
        [InlineData("https://simple.url.for.large.image")]
        public void SearchHotelsByIds_ShouldSearchHotelsByIds_IfHotelsExists(string url)
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
                var queryable = new SearchProviderQueryableCollection<BaseExternalImageSearchResultItem>(new BaseExternalImageSearchResultItem[]
                {
                    new BaseExternalImageSearchResultItem()
                        {
                            TemplateId = DestinationsConstants.TemplateIds.ExternalImage,
                            LargeImageUrl = url,
                            IsLatestVersion = true,
                            Language = "en",
                            Path = "/sitecore/content"
                        }
                });

                provider.GetQueryable<BaseExternalImageSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new ExternaImagesRepository(settings).GetDuplicates(url);

                    // Assert
                    result.Hits.Should().HaveCount(1);
                    result.Hits.FirstOrDefault().Document.LargeImageUrl.Should().Be(url);
                    result.Hits.FirstOrDefault().Document.TemplateId.Should().Be(DestinationsConstants.TemplateIds.ExternalImage);
                }
            }
        }
    }
}
