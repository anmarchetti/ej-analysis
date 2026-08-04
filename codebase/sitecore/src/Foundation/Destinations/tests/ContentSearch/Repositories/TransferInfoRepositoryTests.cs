using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.ContentSearch.Settings;
using easyJet.Foundation.Testing.ContentSearch;
using FluentAssertions;
using NSubstitute;
using Sitecore.ContentSearch;
using Sitecore.FakeDb.Sites;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Repositories
{
    public class TransferInfoRepositoryTests
    {
        private readonly ITransferInfoSearchSettings settings;
        private readonly IProviderSearchContext provider;
        private readonly ProviderIndexConfiguration configuration;
        private readonly FakeSearchIndex index;

        public TransferInfoRepositoryTests()
        {
            settings = new TransferInfoSearchSettings() { IndexName = "sitecore_test_index" };
            provider = Substitute.For<IProviderSearchContext>();
            configuration = Substitute.For<ProviderIndexConfiguration>();
            index = new FakeSearchIndex(provider, configuration, settings.IndexName);
        }

        [Theory]
        [AutoData]
        public void GetTransfersByProductIds_ShouldGetTransfersByProductIds_IfDataExist(string name, string productId)
        {
            // Arrange
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<BaseTransferInfoSearchResultItem>(new BaseTransferInfoSearchResultItem[]
                {
                    new BaseTransferInfoSearchResultItem()
                        {
                            TemplateId = Constants.TemplateIds.TransferInfo,
                            ProductId = productId,
                            Name = name,
                            IsLatestVersion = true,
                            Language = "en",
                            Path = "/sitecore/content",
                        }
                });
                queryable.DefaultValues.Add(new BaseTransferInfoSearchResultItem()
                {
                    Language = "en",
                    Path = "/sitecore/content",
                    IsLatestVersion = true
                });

                provider.GetQueryable<BaseTransferInfoSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new TransferInfoRepository(settings).GetTransfersByProductIds(new string[] { productId });

                    // Assert
                    result.Should().HaveCount(1);
                    result.ElementAt(0).Document.ProductId.Should().Be(productId);
                }
            }
        }

        [Fact]
        public void GetAllTransferDurations_ShouldReturnDictionary()
        {
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<TransferInfoDurationResultItem>(new TransferInfoDurationResultItem[0]);
                queryable.DefaultValues.Add(new TransferInfoDurationResultItem()
                {
                    Language = "en",
                    IsLatestVersion = true,
                    Duration = 1,
                    ProductId = "default"
                });

                provider.GetQueryable<TransferInfoDurationResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new TransferInfoRepository(settings).GetAllTransferDurations();

                    // Assert
                    result.Should().NotBeNull();
                    result.Should().BeOfType<System.Collections.Generic.Dictionary<string, int>>();
                }
            }
        }

        private FakeSiteContext GetFakeSiteContext()
        {
            return new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "fake" },
                    { "database", "master" },
                    { "language", "en" },
                    { "rootPath", "/sitecore/content" }
                });
        }
    }
}
