using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Services
{
    public class LuggageServiceTests
    {
        private readonly LuggageService service;
        private readonly IHtmlCacheRepository cacheRepository;

        public LuggageServiceTests()
        {
            cacheRepository = Substitute.ForPartsOf<HtmlCacheRepository>();
            service = new LuggageService(cacheRepository);
        }

        [AutoData]
        [Theory]
        public void GetLuggage_ShouldReturnAllLuggageItems_IfLuggageFolderExist(Db db)
        {
            // Arrange
            List<LuggageCategory> luggageCategoryList = null;
            cacheRepository.GetItem<List<LuggageCategory>>(Arg.Any<string>()).Returns(luggageCategoryList);
            cacheRepository.StoreItem(Arg.Any<string>(), Arg.Any<List<LuggageCategory>>()).Returns(luggageCategoryList);

            var dataFolder = new DbItem("Data");
            var ancillariesFolder = new DbItem("Ancillaries", ID.NewID, new ID("{A87A00B1-E6DB-45AB-8B54-636FEC3B5523}"));
            var luggageFolder = new DbItem("Luggage", ID.NewID, Constants.TemplateIds.LuggageFolder);
            var luggageCategory = new DbItem("Cabin Bags", ID.NewID, Constants.TemplateIds.LuggageCategory);
            var largeCabinBag = new DbItem("Large Cabin Bag", ID.NewID, Constants.TemplateIds.LuggageItem);
            var smallCabinBag = new DbItem("Small Cabin Bag", ID.NewID, Constants.TemplateIds.LuggageItem);

            luggageCategory.Add(largeCabinBag);
            luggageCategory.Add(smallCabinBag);

            luggageFolder.Add(luggageCategory);
            ancillariesFolder.Add(luggageFolder);
            dataFolder.Add(ancillariesFolder);
            db.Add(dataFolder);

            var fakeSite = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "website" }, { "database", "master" }, { "rootPath", "/sitecore/content" }
                });
            using (new FakeSiteContextSwitcher(fakeSite))
            {
                // Act
                string language = "en";
                var actual = service.GetLuggage(language);
                // Assert
                actual.LuggageCategories.Should().HaveCount(1);
            }
        }

        [AutoData]
        [Theory]
        public void GetLuggage_ShouldReturnAllLuggageAndCombinedLuggageItems_IfLuggageFolderExist(Db db)
        {
            // Arrange
            List<LuggageCategory> luggageCategoryList = null;
            cacheRepository.GetItem<List<LuggageCategory>>(Arg.Any<string>()).Returns(luggageCategoryList);
            cacheRepository.StoreItem(Arg.Any<string>(), Arg.Any<List<LuggageCategory>>()).Returns(luggageCategoryList);

            var dataFolder = new DbItem("Data");
            var ancillariesFolder = new DbItem("Ancillaries", ID.NewID, new ID("{A87A00B1-E6DB-45AB-8B54-636FEC3B5523}"));
            var luggageFolder = new DbItem("Luggage", ID.NewID, Constants.TemplateIds.LuggageFolder);
            var luggageCategory = new DbItem("Cabin Bags", ID.NewID, Constants.TemplateIds.LuggageCategory);
            var largeCabinBag = new DbItem("Large Cabin Bag", new ID("{1C52E02C-3504-4368-BF31-992B276470BB}"), Constants.TemplateIds.LuggageItem);
            var smallCabinBag = new DbItem("Small Cabin Bag", ID.NewID, Constants.TemplateIds.LuggageItem);
            var combinedLuggageItem = new DbItem("Combined Luggage Item", ID.NewID, Constants.TemplateIds.CombinedLuggageItem);
            var codeField = new DbField(Constants.Fields.LuggageItem.Code);
            codeField.Value = "123Code";
            largeCabinBag.Add(codeField);

            var combinedLuggageItemField = new DbField(Constants.Fields.CombinedLuggageItem.CombinedLuggage);
            combinedLuggageItemField.Value = "1=%7B1C52E02C-3504-4368-BF31-992B276470BB%7D";
            combinedLuggageItem.Add(combinedLuggageItemField);

            luggageCategory.Add(largeCabinBag);
            luggageCategory.Add(smallCabinBag);
            luggageCategory.Add(combinedLuggageItem);

            luggageFolder.Add(luggageCategory);
            ancillariesFolder.Add(luggageFolder);
            dataFolder.Add(ancillariesFolder);
            db.Add(dataFolder);

            var fakeSite = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "website" }, { "database", "master" }, { "rootPath", "/sitecore/content" }
                });
            using (new FakeSiteContextSwitcher(fakeSite))
            {
                // Act
                string language = "en";
                var actual = service.GetLuggage(language);
                // Assert
                actual.LuggageCategories.Should().HaveCount(1);
                actual.LuggageCategories[0].Children.Should().HaveCount(3);
                actual.LuggageCategories[0].Children.Should().Contain(i => i.GetType() == typeof(CombinedLuggageItem));
            }
        }

        [AutoData]
        [Theory]
        public void GetLuggage_CannotParseId_ShouldNotReturnIdMapping(Db db)
        {
            // Arrange
            List<LuggageCategory> luggageCategoryList = null;
            cacheRepository.GetItem<List<LuggageCategory>>(Arg.Any<string>()).Returns(luggageCategoryList);
            cacheRepository.StoreItem(Arg.Any<string>(), Arg.Any<List<LuggageCategory>>()).Returns(luggageCategoryList);

            var dataFolder = new DbItem("Data");
            var ancillariesFolder = new DbItem("Ancillaries", ID.NewID, new ID("{A87A00B1-E6DB-45AB-8B54-636FEC3B5523}"));
            var luggageFolder = new DbItem("Luggage", ID.NewID, Constants.TemplateIds.LuggageFolder);
            var luggageCategory = new DbItem("Cabin Bags", ID.NewID, Constants.TemplateIds.LuggageCategory);
            var largeCabinBag = new DbItem("Large Cabin Bag", new ID("{1C52E02C-3504-4368-BF31-992B276470BB}"), Constants.TemplateIds.LuggageItem);
            var smallCabinBag = new DbItem("Small Cabin Bag", ID.NewID, Constants.TemplateIds.LuggageItem);
            var combinedLuggageItem = new DbItem("Combined Luggage Item", ID.NewID, Constants.TemplateIds.CombinedLuggageItem);
            var codeField = new DbField(Constants.Fields.LuggageItem.Code);
            codeField.Value = "123Code";
            largeCabinBag.Add(codeField);

            var combinedLuggageItemField = new DbField(Constants.Fields.CombinedLuggageItem.CombinedLuggage);
            combinedLuggageItemField.Value = "1=%7B1C52E02C-3504-4368-BF31-992B27%7D";
            combinedLuggageItem.Add(combinedLuggageItemField);

            luggageCategory.Add(largeCabinBag);
            luggageCategory.Add(smallCabinBag);
            luggageCategory.Add(combinedLuggageItem);

            luggageFolder.Add(luggageCategory);
            ancillariesFolder.Add(luggageFolder);
            dataFolder.Add(ancillariesFolder);
            db.Add(dataFolder);

            var fakeSite = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "website" }, { "database", "master" }, { "rootPath", "/sitecore/content" }
                });
            using (new FakeSiteContextSwitcher(fakeSite))
            {
                // Act
                string language = "en";
                var actual = service.GetLuggage(language);
                // Assert
                actual.LuggageCategories.Should().HaveCount(1);
                actual.LuggageCategories[0].Children.Should().HaveCount(2);
                actual.LuggageCategories[0].Children.Should().NotContain(i => i.GetType() == typeof(CombinedLuggageItem));
            }
        }

        [AutoData]
        [Theory]
        public void GetLuggage_LuggageItemFromMappingNotAvailable_ShouldNotReturnIdMapping(Db db)
        {
            // Arrange
            List<LuggageCategory> luggageCategoryList = null;
            cacheRepository.GetItem<List<LuggageCategory>>(Arg.Any<string>()).Returns(luggageCategoryList);
            cacheRepository.StoreItem(Arg.Any<string>(), Arg.Any<List<LuggageCategory>>()).Returns(luggageCategoryList);

            var dataFolder = new DbItem("Data");
            var ancillariesFolder = new DbItem("Ancillaries", ID.NewID, new ID("{A87A00B1-E6DB-45AB-8B54-636FEC3B5523}"));
            var luggageFolder = new DbItem("Luggage", ID.NewID, Constants.TemplateIds.LuggageFolder);
            var luggageCategory = new DbItem("Cabin Bags", ID.NewID, Constants.TemplateIds.LuggageCategory);
            var largeCabinBag = new DbItem("Large Cabin Bag", new ID("{1C52E02C-3504-4368-BF31-992B276470BC}"), Constants.TemplateIds.LuggageItem);
            var smallCabinBag = new DbItem("Small Cabin Bag", ID.NewID, Constants.TemplateIds.LuggageItem);
            var combinedLuggageItem = new DbItem("Combined Luggage Item", ID.NewID, Constants.TemplateIds.CombinedLuggageItem);
            var codeField = new DbField(Constants.Fields.LuggageItem.Code);
            codeField.Value = "123Code";
            largeCabinBag.Add(codeField);

            var combinedLuggageItemField = new DbField(Constants.Fields.CombinedLuggageItem.CombinedLuggage);
            combinedLuggageItemField.Value = "1=%7B1C52E02C-3504-4368-BF31-992B276470BB%7D";
            combinedLuggageItem.Add(combinedLuggageItemField);

            luggageCategory.Add(largeCabinBag);
            luggageCategory.Add(smallCabinBag);
            luggageCategory.Add(combinedLuggageItem);

            luggageFolder.Add(luggageCategory);
            ancillariesFolder.Add(luggageFolder);
            dataFolder.Add(ancillariesFolder);
            db.Add(dataFolder);

            var fakeSite = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "website" }, { "database", "master" }, { "rootPath", "/sitecore/content" }
                });
            using (new FakeSiteContextSwitcher(fakeSite))
            {
                // Act
                string language = "en";
                var actual = service.GetLuggage(language);
                // Assert
                actual.LuggageCategories.Should().HaveCount(1);
                actual.LuggageCategories[0].Children.Should().HaveCount(2);
                actual.LuggageCategories[0].Children.Should().NotContain(i => i.GetType() == typeof(CombinedLuggageItem));
            }
        }

        [AutoData]
        [Theory]
        public void GetLuggage_ShouldReturnAllLuggageAndCombinedLuggageItemsInLanguageDe_IfLuggageFolderExist(Db db)
        {
            // Arrange
            List<LuggageCategory> luggageCategoryList = null;
            cacheRepository.GetItem<List<LuggageCategory>>(Arg.Any<string>()).Returns(luggageCategoryList);
            cacheRepository.StoreItem(Arg.Any<string>(), Arg.Any<List<LuggageCategory>>()).Returns(luggageCategoryList);

            var dataFolder = new DbItem("Data");
            var ancillariesFolder = new DbItem("Ancillaries", ID.NewID, new ID("{A87A00B1-E6DB-45AB-8B54-636FEC3B5523}"));
            var luggageFolder = new DbItem("Luggage", ID.NewID, Constants.TemplateIds.LuggageFolder);
            var luggageCategory = new DbItem("Cabin Bags", ID.NewID, Constants.TemplateIds.LuggageCategory);
            var largeCabinBag = new DbItem("Large Cabin Bag", ID.NewID, Constants.TemplateIds.LuggageItem);
            var smallCabinBag = new DbItem("Small Cabin Bag", ID.NewID, Constants.TemplateIds.LuggageItem);
            var combinedLuggageItem = new DbItem("Combined Luggage Item", ID.NewID, Constants.TemplateIds.CombinedLuggageItem);

            luggageCategory.Add(largeCabinBag);
            luggageCategory.Add(smallCabinBag);
            luggageCategory.Add(combinedLuggageItem);

            luggageFolder.Add(luggageCategory);
            ancillariesFolder.Add(luggageFolder);
            dataFolder.Add(ancillariesFolder);
            db.Add(dataFolder);

            var fakeSite = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "website" }, { "database", "master" }, { "rootPath", "/sitecore/content" }
                });
            using (new FakeSiteContextSwitcher(fakeSite))
            {
                // Act
                string language = "de-de";
                var actual = service.GetLuggage(language);
                // Assert
                actual.LuggageCategories.Should().HaveCount(1);
                actual.LuggageCategories[0].Children.Should().HaveCount(2);
                actual.LuggageCategories[0].Children.Should().NotContain(i => i.GetType() == typeof(CombinedLuggageItem));
            }
        }
    }
}
