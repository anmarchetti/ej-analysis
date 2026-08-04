using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.ContentSearch.Settings;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Multisite;
using easyjet.Foundation.Testing.Attributes;
using easyJet.Foundation.Testing.ContentSearch;
using FluentAssertions;
using NSubstitute;
using Sitecore.Collections;
using Sitecore.ContentSearch;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Repositories
{
    public class BoardTypesRepositoryTests
    {
        private readonly IDestinationSearchSettings settings;
        private readonly IProviderSearchContext provider;
        private readonly ProviderIndexConfiguration configuration;
        private readonly FakeSearchIndex index;
        private readonly IDestinationsLogger logger;

        public BoardTypesRepositoryTests()
        {
            settings = Substitute.For<IDestinationSearchSettings>();
            settings.IndexName.Returns("sitecore_test_index");
            provider = Substitute.For<IProviderSearchContext>();
            configuration = Substitute.For<ProviderIndexConfiguration>();
            logger = Substitute.For<IDestinationsLogger>();
            index = new FakeSearchIndex(provider, configuration, settings.IndexName);
        }

        [Theory]
        [AutoData]
        public void GetAll_ShouldGetAllBoardTypeItems_IfBoardTypesExist(Db db, string code)
        {
            // Arrange
            var dataFolderItem = new DbItem("Data");
            dataFolderItem.TemplateID = Templates.Data.Id;

            var boardTypesFolder = new DbItem("BoardTypesFolder");
            boardTypesFolder.TemplateID = Constants.TemplateIds.BoardTypesFolder;

            dataFolderItem.Children.Add(boardTypesFolder);

            var boardTypeItem = new DbItem("BoardTypeItem");
            boardTypeItem.Add(new DbField(Constants.Fields.DatasourceItem.Code)
            {
                Value = code
            });

            boardTypeItem.TemplateID = Constants.TemplateIds.BoardType;

            boardTypesFolder.Children.Add(boardTypeItem);

            db.Add(dataFolderItem);

            var fakeSiteContext = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "fake" },
                    { "database", "master" },
                    { "language", "en" },
                    { "rootPath", "/sitecore/content" }
                });

            using (new FakeSiteContextSwitcher(fakeSiteContext))
            {
                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new BoardTypesRepository(settings, logger).GetAllBoardTypeItems();

                    // Assert
                    result.Should().HaveCount(1);
                    result.FirstOrDefault()[Constants.Fields.DatasourceItem.Code].Should().Be(code);
                    result.FirstOrDefault().TemplateID.Should().Be(Constants.TemplateIds.BoardType);
                }
            }
        }

        [Theory]
        [InlineData("code1")]
        public void SearchByCodes_ShouldSearchByCode_IfBoardTypesExists(string code)
        {
            // Arrange
            var fakeSiteContext = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "fake" },
                    { "database", "master" },
                    { "language", "en" },
                    { "rootPath", "/sitecore/content" }
                });

            using (new FakeSiteContextSwitcher(fakeSiteContext))
            {
                var queryable = new SearchProviderQueryableCollection<BaseDatasourceSearchResultItem>(new BaseDatasourceSearchResultItem[]
                {
                    new BaseDatasourceSearchResultItem()
                        {
                            TemplateId = Constants.TemplateIds.BoardType,
                            Code = code,
                            IsLatestVersion = true,
                            Language = "en",
                            Path = "/sitecore/content"
                        }
                });

                provider.GetQueryable<BaseDatasourceSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new BoardTypesRepository(settings, logger).SearchByCodes(new string[] { "code1" });

                    // Assert
                    result.Hits.Should().HaveCount(1);
                    result.Hits.FirstOrDefault().Document.Code.Should().Be(code);
                    result.Hits.FirstOrDefault().Document.TemplateId.Should().Be(Constants.TemplateIds.BoardType);
                }
            }
        }

        [Theory]
        [AutoDbData]
        public void GetAllBoadTypeItems_ShouldReturnItems_IfItemsExist(Db db)
        {
            // Arrange
            var dataFolderDbItem = new DbItem("Data");
            dataFolderDbItem.TemplateID = Templates.Data.Id;

            var boardTypesFolderDbItem = new DbItem("BoardTypesFolder");
            boardTypesFolderDbItem.TemplateID = Constants.TemplateIds.BoardTypesFolder;

            var boardTypeDbItem = new DbItem("BoardType");
            boardTypeDbItem.TemplateID = Constants.TemplateIds.BoardType;

            boardTypesFolderDbItem.Children.Add(boardTypeDbItem);
            dataFolderDbItem.Children.Add(boardTypesFolderDbItem);

            db.Add(dataFolderDbItem);

            var fakeSiteContext = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "fake" },
                    { "database", "master" },
                    { "language", "en" },
                    { "rootPath", "/sitecore/content" }
                });

            using (new FakeSiteContextSwitcher(fakeSiteContext))
            {
                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var actual = new BoardTypesRepository(settings, logger).GetAllBoardTypeItems().Count();

                    // Assert
                    actual.Should().Be(1);
                }
            }
        }
    }
}
