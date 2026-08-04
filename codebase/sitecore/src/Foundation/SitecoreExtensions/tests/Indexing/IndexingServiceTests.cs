using System;
using System.Linq;
using easyJet.Foundation.SitecoreExtensions.Indexing;
using easyJet.Foundation.SitecoreExtensions.Logging;
using easyJet.Foundation.Testing.ContentSearch;
using NSubstitute;
using Sitecore.ContentSearch;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.SitecoreExtensions.Tests.Indexing
{
    public class IndexingServiceTests
    {
        private readonly ISitecoreExtensionsLogger logger;
        private readonly IndexingService sut;
        private readonly IProviderSearchContext provider;
        private readonly ProviderIndexConfiguration configuration;
        private readonly FakeSearchIndex index;

        public IndexingServiceTests()
        {
            logger = Substitute.For<ISitecoreExtensionsLogger>();
            sut = new IndexingService(logger);
            provider = Substitute.For<IProviderSearchContext>();
            configuration = Substitute.For<ProviderIndexConfiguration>();
            index = new FakeSearchIndex(provider, configuration, Constants.Index.CoreIndex);
        }

        [Theory]
        [InlineData(EasyjetIndexes.Core, Constants.Index.CoreIndex)]
        [InlineData(EasyjetIndexes.Master, Constants.Index.MasterIndex)]
        [InlineData(EasyjetIndexes.Web, Constants.Index.WebIndex)]
        [InlineData(EasyjetIndexes.MarketingDefinitionsMaster, Constants.Index.MarketingDefinitionsMasterIndex)]
        [InlineData(EasyjetIndexes.MarketingDefinitionsWeb, Constants.Index.MarketingDefinitionsWebIndex)]
        [InlineData(EasyjetIndexes.MarketingAssetMaster, Constants.Index.MarketingAssetMasterIndex)]
        [InlineData(EasyjetIndexes.MarketingAssetWeb, Constants.Index.MarketingAssetWebIndex)]
        [InlineData(EasyjetIndexes.Testing, Constants.Index.TestingIndex)]
        [InlineData(EasyjetIndexes.SuggestedTest, Constants.Index.SuggestedTestIndex)]
        [InlineData(EasyjetIndexes.Personalization, Constants.Index.PersonalizationIndex)]
        [InlineData(EasyjetIndexes.FxmMaster, Constants.Index.FxmMasterIndex)]
        [InlineData(EasyjetIndexes.FxmWeb, Constants.Index.FxmWebIndex)]
        [InlineData(EasyjetIndexes.DestinationMaster, Constants.Index.DestinationsMasterIndex)]
        [InlineData(EasyjetIndexes.DestinationWeb, Constants.Index.DestinationsWebIndex)]
        [InlineData(EasyjetIndexes.Publishing, Constants.Index.PublishingIndex)]
        [InlineData(EasyjetIndexes.TransferInfoMaster, Constants.Index.TransferInfoMasterIndex)]
        [InlineData(EasyjetIndexes.TransferInfoWeb, Constants.Index.TransferInfoWebIndex)]
        [InlineData(EasyjetIndexes.PromotionsMaster, Constants.Index.PromotionsMasterIndex)]
        [InlineData(EasyjetIndexes.PromotionsWeb, Constants.Index.PromotionsWebIndex)]
        [InlineData(EasyjetIndexes.ArticlesMaster, Constants.Index.ArticlesMasterIndex)]
        [InlineData(EasyjetIndexes.ArticlesWeb, Constants.Index.ArticlesWebIndex)]

        public void GetIndexName_ReturnsExpectedValue(EasyjetIndexes i, string expectedIndexName)
        {
            // Act
            var result = sut.GetIndexName(i);

            // Assert
            Assert.Equal(expectedIndexName, result);
        }

        [Fact]
        public void GetIndexName_InvalidEnum_Throws()
        {
            // Arrange
            var invalidEnum = (EasyjetIndexes)int.MaxValue;

            // Act
            // Assert
            Assert.Throws<ArgumentOutOfRangeException>(() => sut.GetIndexName(invalidEnum));
        }

        [Fact]
        public void GetIndexName_AllEnumValues_AreMapped()
        {
            // Act & Assert
            var enumValues = Enum.GetValues(typeof(EasyjetIndexes)).Cast<EasyjetIndexes>();

            foreach (var value in enumValues)
            {
                var result = sut.GetIndexName(value);

                Assert.False(string.IsNullOrWhiteSpace(result));
            }
        }

        [Theory]
        [InlineData("/sitecore/holidays")]
        [InlineData("/sitecore/holidays/test")]
        [InlineData("/sitecore/holidays/test2")]
        public void UpdateItem_LogsInfo(string path)
        {
            // Arrange
            var fakeItem = new FakeItem().WithPath(path);
            var item = fakeItem.ToSitecoreItem();
            var i = EasyjetIndexes.Core;
            var indexName = sut.GetIndexName(i);

            // Act
            using (new ContentSearchSwitcher(index))
            {
                sut.UpdateItem(fakeItem, i);
            }

            // Assert
            logger.Received(1).Info($"{nameof(IndexingService.UpdateItem)}: updating index: {indexName} - Subtree: {item.Paths.FullPath}", sut);
        }

        [Fact]
        public void UpdateItem_LogsWarn_IfIndexNullOrEmpty()
        {
            // Arrange
            // Act
            using (new ContentSearchSwitcher(index))
            {
                sut.UpdateItem(null, null);
            }

            // Assert
            logger.Received(1).Warn($"{nameof(IndexingService.UpdateItem)}: item or indexName null or empty!", sut);
        }

        [Fact]
        public void FullRebuild_LogsWarn_IfIndexNullOrEmpty()
        {
            // Arrange
            // Act
            using (new ContentSearchSwitcher(index))
            {
                sut.FullRebuild(null);
            }

            // Assert
            logger.Received(1).Warn($"{nameof(IndexingService.FullRebuild)}: indexName null or empty!", sut);
        }

        [Fact]
        public void FullRebuild_LogsInfo()
        {
            // Arrange
            var i = EasyjetIndexes.Core;
            var indexName = sut.GetIndexName(i);

            // Act
            using (new ContentSearchSwitcher(index))
            {
                sut.FullRebuild(indexName);
            }

            // Assert
            logger.Received(1).Info($"{nameof(IndexingService.FullRebuild)}: rebuild index: {indexName}", sut);
        }

        [Fact]
        public void UpdateItem_InvalidIndexName_LogsError()
        {
            // Arrange
            var fakeItem = new FakeItem().WithPath("/sitecore/holidays");
            const string invalidIndexName = "invalid_index_name";

            // Act
            sut.UpdateItem(fakeItem, invalidIndexName);

            // Assert
            logger.Received(1).Error(
                $"{nameof(IndexingService.UpdateItem)}: failed to update index '{invalidIndexName}' for item '{fakeItem.ID}'.",
                Arg.Any<Exception>(),
                sut);
        }

        [Fact]
        public void FullRebuild_InvalidIndexName_LogsError()
        {
            // Arrange
            const string invalidIndexName = "invalid_index_name";

            // Act
            sut.FullRebuild(invalidIndexName);

            // Assert
            logger.Received(1).Error(
                $"{nameof(IndexingService.FullRebuild)}: failed to rebuild index '{invalidIndexName}'.",
                Arg.Any<Exception>(),
                sut);
        }

        [Fact]
        public void UpdateItem_InvalidEnum_LogsError()
        {
            // Arrange
            var invalidEnum = (EasyjetIndexes)int.MaxValue;
            var fakeItem = new FakeItem().WithPath("/sitecore/holidays");

            // Act
            sut.UpdateItem(fakeItem, invalidEnum);

            // Assert
            logger.Received(1).Error(
                $"{nameof(IndexingService.UpdateItem)}: failed while resolving index for value '{invalidEnum}'.",
                Arg.Any<Exception>(),
                sut);
        }

        [Fact]
        public void FullRebuild_InvalidEnum_LogsError()
        {
            // Arrange
            var invalidEnum = (EasyjetIndexes)int.MaxValue;

            // Act
            sut.FullRebuild(invalidEnum);

            // Assert
            logger.Received(1).Error(
                $"{nameof(IndexingService.FullRebuild)}: failed while resolving index for value '{invalidEnum}'.",
                Arg.Any<Exception>(),
                sut);
        }
    }
}