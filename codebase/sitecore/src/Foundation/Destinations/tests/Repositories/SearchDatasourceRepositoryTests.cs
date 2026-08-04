using System.Collections.Generic;
using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.ContentSearch.Settings;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyjet.Foundation.Testing.Attributes;
using easyJet.Foundation.Testing.ContentSearch;
using FluentAssertions;
using NSubstitute;
using Sitecore.Collections;
using Sitecore.ContentSearch;
using Sitecore.Data;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Services
{
    public class SearchDatasourceRepositoryTests
    {
        private readonly IDestinationSearchSettings settings;
        private readonly IProviderSearchContext provider;
        private readonly ProviderIndexConfiguration configuration;
        private readonly FakeSearchIndex index;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IDestinationsLogger logger;

        public SearchDatasourceRepositoryTests()
        {
            settings = Substitute.For<IDestinationSearchSettings>();
            settings.IndexName.Returns("sitecore_test_index");
            provider = Substitute.For<IProviderSearchContext>();
            configuration = Substitute.For<ProviderIndexConfiguration>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            logger = Substitute.For<IDestinationsLogger>();
            index = new FakeSearchIndex(provider, configuration, settings.IndexName);
        }

        [Theory]
        [AutoData]
        public void GetOrCreateItem_ShouldGetItem_IfItemExists(Db db, TemplateID templateID, string itemName, ID itemID, string code)
        {
            // Arrange
            var parentDbItem = new DbItem("Parent");

            var dbItem = new DbItem(itemName, itemID, templateID);
            dbItem.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Code) { Value = code });
            parentDbItem.Children.Add(dbItem);
            db.Add(parentDbItem);

            var fakeSiteContext = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "fake" },
                    { "database", "master" },
                    { "language", "en" },
                    { "rootPath", "/sitecore/content" }
                });

            // Act
            using (new FakeSiteContextSwitcher(fakeSiteContext))
            using (new ContentSearchSwitcher(index))
            {
                var item = db.GetItem(itemID);
                var queryable = new SearchProviderQueryableCollection<BaseDatasourceSearchResultItem>(new BaseDatasourceSearchResultItem[]
                {
                    new BaseDatasourceSearchResultItem()
                        {
                            ItemId = itemID,
                            Name = itemName,
                            TemplateId = templateID,
                            Code = code,
                            IsLatestVersion = true,
                            Language = "en",
                            Uri = new ItemUri(item),
                            Path = $"{parentDbItem.FullPath}/{itemName}"
                        }
                });
                queryable.DefaultValues.Add(new BaseDatasourceSearchResultItem()
                {
                    ItemId = itemID,
                    Language = "en",
                    IsLatestVersion = true
                });

                databaseProvider.GetItem(item.Uri).Returns(item);
                provider.GetQueryable<BaseDatasourceSearchResultItem>().Returns(queryable);
                var actual = new SearchDatasourceRepository(databaseProvider, settings, logger).GetOrCreateItem(itemName, code, templateID, db.GetItem(parentDbItem.ID), out var _, false);

                // Assert
                actual.ID.Should().Be(itemID);
                actual.TemplateID.Should().Be(templateID.ID);
            }
        }

        [Theory]
        [AutoDbData]
        public void GetOrCreateItem_ShouldCreateItem_IfItemIsNotExists(Db db, DbTemplate templateID, string itemName, string code)
        {
            // Arrange
            var parentDbItem = new DbItem("Parent");
            db.Add(parentDbItem);

            var fakeSiteContext = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "fake" },
                    { "database", "master" },
                    { "language", "en" },
                    { "rootPath", "/sitecore/content" }
                });

            // Act
            using (new FakeSiteContextSwitcher(fakeSiteContext))
            using (new ContentSearchSwitcher(index))
            {
                var queryable = new SearchProviderQueryableCollection<BaseDatasourceSearchResultItem>(new BaseDatasourceSearchResultItem[] { });

                provider.GetQueryable<BaseDatasourceSearchResultItem>().Returns(queryable);
                var actual = new SearchDatasourceRepository(databaseProvider, settings, logger).GetOrCreateItem(itemName, code, templateID.ID, db.GetItem(parentDbItem.ID), out var _, true);

                // Assert
                actual.TemplateID.Should().Be(templateID.ID);
                actual.Name.Should().Be(itemName);
                parentDbItem.Children.Should().HaveCount(1);
            }
        }

        [Theory]
        [AutoDbData]
        public void GetOrCreateItem_ShouldCreateItem_IfItemNotExistsAndDisableEventIsFalse(Db db, DbTemplate templateID, string itemName, string code)
        {
            // Arrange
            var parentDbItem = new DbItem("Parent");
            db.Add(parentDbItem);

            var fakeSiteContext = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "fake" },
                    { "database", "master" },
                    { "language", "en" },
                    { "rootPath", "/sitecore/content" }
                });

            // Act
            using (new FakeSiteContextSwitcher(fakeSiteContext))
            using (new ContentSearchSwitcher(index))
            {
                var queryable = new SearchProviderQueryableCollection<BaseDatasourceSearchResultItem>(new BaseDatasourceSearchResultItem[] { });

                provider.GetQueryable<BaseDatasourceSearchResultItem>().Returns(queryable);
                var actual = new SearchDatasourceRepository(databaseProvider, settings, logger).GetOrCreateItem(itemName, code, templateID.ID, db.GetItem(parentDbItem.ID), out var _, false);

                // Assert
                actual.TemplateID.Should().Be(templateID.ID);
                actual.Name.Should().Be(itemName);
                parentDbItem.Children.Should().HaveCount(1);
            }
        }

        [Theory]
        [AutoData]
        public void GetItemByCode_ShouldGetItemByCode_IfItemExists(Db db, TemplateID templateID, string itemName, ID itemID, string code)
        {
            // Arrange
            var parentDbItem = new DbItem("Parent");

            var dbItem = new DbItem(itemName, itemID, templateID);
            dbItem.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Code) { Value = code });
            parentDbItem.Children.Add(dbItem);
            db.Add(parentDbItem);

            var fakeSiteContext = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "fake" },
                    { "database", "master" },
                    { "language", "en" },
                    { "rootPath", "/sitecore/content" }
                });

            // Act
            using (new FakeSiteContextSwitcher(fakeSiteContext))
            using (new ContentSearchSwitcher(index))
            {
                var item = db.GetItem(itemID);
                var queryable = new SearchProviderQueryableCollection<BaseDatasourceSearchResultItem>(new[]
                {
                    new BaseDatasourceSearchResultItem()
                    {
                        ItemId = itemID,
                        Name = itemName,
                        TemplateId = templateID,
                        Code = code,
                        IsLatestVersion = true,
                        Language = "en",
                        Uri = new ItemUri(item),
                        Path = $"{parentDbItem.FullPath}/{itemName}"
                    }
                });
                queryable.DefaultValues.Add(new BaseDatasourceSearchResultItem()
                {
                    ItemId = itemID,
                    Language = "en",
                    IsLatestVersion = true
                });
                databaseProvider.GetItem(Arg.Any<ItemUri>()).Returns(item);
                provider.GetQueryable<BaseDatasourceSearchResultItem>().Returns(queryable);
                var actual = new SearchDatasourceRepository(databaseProvider, settings, logger).GetItemByCode(code, templateID, false);

                // Assert
                actual.ID.Should().Be(itemID);
                actual.Name.Should().Be(itemName);
                actual.TemplateID.Should().Be(templateID.ID);
            }
        }

        [Theory]
        [AutoData]
        public void GetItemsByCodes_ShouldGetItemsByCodes_IfItemsExist(Db db, TemplateID templateID, string[] itemsNames, ID[] itemsIDs, string[] codes)
        {
            // Arrange
            var parentDbItem = new DbItem("Parent");
            var dbItems = new List<DbItem>();

            for (int i = 0; i < codes.Length; i++)
            {
                var dbItem = new DbItem(itemsNames[i], itemsIDs[i], templateID);
                dbItem.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Code) { Value = codes[i] });
                dbItems.Add(dbItem);
                parentDbItem.Children.Add(dbItem);
            }

            db.Add(parentDbItem);

            var fakeSiteContext = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "fake" },
                    { "database", "master" },
                    { "language", "en" },
                    { "rootPath", "/sitecore/content" }
                });

            // Act
            using (new FakeSiteContextSwitcher(fakeSiteContext))
            using (new ContentSearchSwitcher(index))
            {
                var searchResultItems = new List<BaseDatasourceSearchResultItem>();
                foreach (var dbItem in dbItems)
                {
                    var item = db.GetItem(dbItem.ID);
                    searchResultItems.Add(
                        new BaseDatasourceSearchResultItem()
                        {
                            ItemId = item.ID,
                            Name = item.Name,
                            TemplateId = templateID,
                            Code = item.Fields[Constants.Fields.DatasourceItem.Code].Value,
                            IsLatestVersion = true,
                            Language = "en",
                            Uri = new ItemUri(item),
                            Path = $"{parentDbItem.FullPath}/{item.Name}"
                        });
                }

                var queryable = new SearchProviderQueryableCollection<BaseDatasourceSearchResultItem>(searchResultItems);
                queryable.DefaultValues.Add(new BaseDatasourceSearchResultItem()
                {
                    TemplateId = templateID,
                    Language = "en",
                    IsLatestVersion = true
                });

                provider.GetQueryable<BaseDatasourceSearchResultItem>().Returns(queryable);
                for (int i = 0; i < dbItems.Count; i++)
                {
                    var item = db.GetItem(dbItems[i].ID);
                    databaseProvider.GetItem(item.Uri).Returns(item);
                }

                var actual = new SearchDatasourceRepository(databaseProvider, settings, logger).GetItemsByCodes(codes.ToList(), templateID);

                // Assert
                for (int i = 0; i < dbItems.Count; i++)
                {
                    var item = db.GetItem(dbItems[i].ID);
                    actual[item.Fields[Constants.Fields.DatasourceItem.Code].Value].Should().Be(item);
                }
            }
        }

        [Theory]
        [AutoData]
        public void GetItemIdsByCodes_ShouldGetItemIdsByCodes_IfItemsExist(Db db, TemplateID templateID, string[] itemsNames, ID[] itemsIDs, string[] codes)
        {
            // Arrange
            var parentDbItem = new DbItem("Parent");
            var dbItems = new List<DbItem>();

            for (int i = 0; i < codes.Length; i++)
            {
                var dbItem = new DbItem(itemsNames[i], itemsIDs[i], templateID);
                dbItem.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Code) { Value = codes[i] });
                dbItems.Add(dbItem);
                parentDbItem.Children.Add(dbItem);
            }

            db.Add(parentDbItem);

            var fakeSiteContext = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "fake" },
                    { "database", "master" },
                    { "language", "en" },
                    { "rootPath", "/sitecore/content" }
                });

            // Act
            using (new FakeSiteContextSwitcher(fakeSiteContext))
            using (new ContentSearchSwitcher(index))
            {
                var searchResultItems = new List<BaseDatasourceSearchResultItem>();
                foreach (var dbItem in dbItems)
                {
                    var item = db.GetItem(dbItem.ID);
                    searchResultItems.Add(
                        new BaseDatasourceSearchResultItem()
                        {
                            ItemId = item.ID,
                            Name = item.Name,
                            TemplateId = templateID,
                            Code = item.Fields[Constants.Fields.DatasourceItem.Code].Value,
                            IsLatestVersion = true,
                            Language = "en",
                            Uri = new ItemUri(item),
                            Path = $"{parentDbItem.FullPath}/{item.Name}"
                        });
                }

                var queryable = new SearchProviderQueryableCollection<BaseDatasourceSearchResultItem>(searchResultItems);
                queryable.DefaultValues.Add(new BaseDatasourceSearchResultItem()
                {
                    TemplateId = templateID,
                    Language = "en",
                    Path = "/sitecore/content",
                    IsLatestVersion = true
                });

                provider.GetQueryable<BaseDatasourceSearchResultItem>().Returns(queryable);
                var actual = new SearchDatasourceRepository(databaseProvider, settings, logger).GetItemIdsByCodes(codes.ToList(), templateID);

                // Assert
                for (int i = 0; i < codes.Length; i++)
                {
                    actual[codes[i]].Should().Be(dbItems[i].ID);
                }
            }
        }

        [Fact]
        public void GetItemByCode_ShouldReturnNull_IfCodeIsEmpty()
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
                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var searchDatasourceRepository = new SearchDatasourceRepository(databaseProvider, settings, logger);
                    var result = searchDatasourceRepository.GetItemByCode(string.Empty, ID.NewID);

                    // Assert
                    result.Should().BeNull();
                }
            }
        }

        [Fact]
        public void GetItemsByCodes_ShouldReturnEmptyDictionary_IfCodesIsEmpty()
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
                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var searchDatasourceRepository = new SearchDatasourceRepository(databaseProvider, settings, logger);
                    var result = searchDatasourceRepository.GetItemsByCodes(new List<string>(), ID.NewID);

                    // Assert
                    result.Should().BeEmpty();
                }
            }
        }
    }
}