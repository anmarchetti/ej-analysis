using System.Collections.Generic;
using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Foundation.Multisite.Logging;
using easyJet.Foundation.Multisite.Services;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using FluentAssertions;
using NSubstitute;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Multisite.Tests.Services
{
    public class SettingServiceTests
    {
        private readonly IHtmlCacheRepository cacheRepository;
        private readonly SettingsService settingsService;
        private readonly Fixture fixture;
        private readonly Db db;
        private readonly IMultisiteLogger logger;

        public SettingServiceTests()
        {
            // Arrange
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
            cacheRepository = Substitute.For<IHtmlCacheRepository>();
            logger = Substitute.For<IMultisiteLogger>();
            settingsService = new SettingsService(cacheRepository, logger);
        }

        [Fact]
        public void GetAllSettings_ShouldBeNotNull_If_CacheHasValueByKey()
        {
            // Arrange
            cacheRepository.GetItem<List<Dictionary<string, object>>>(Arg.Any<string>())
                .Returns(new List<Dictionary<string, object>>());

            // Act
            var actual = settingsService.GetAllSettings();

            // Assert
            actual.Should().NotBeNull();
        }

        [Fact]
        public void GetAllSettings_ShouldBeEmpty_If_SettingFolderNotFound()
        {
            // Arrange
            var fakeSite = new Sitecore.FakeDb.Sites.FakeSiteContext(
                 new Sitecore.Collections.StringDictionary
                 {
                         { "name", "website" }, { "database", "web" }
                 });

            using (new Sitecore.Sites.SiteContextSwitcher(fakeSite))
            {
                // Act
                var actual = settingsService.GetAllSettings();

                // Assert
                actual.Should().BeEmpty();
            }
        }

        [Fact]
        public void GetAllSettings_ShouldNotBeEmpty_If_SettingFolderHasChildren()
        {
            // Arrange
            var fakeSite = new Sitecore.FakeDb.Sites.FakeSiteContext(
                 new Sitecore.Collections.StringDictionary
                 {
                         { "name", "website" }, { "database", "master" }, { "rootPath", "/sitecore/content/" }
                 });

            var settingDbItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            var childDbItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            settingDbItem.TemplateID = Templates.Settings.Id;
            childDbItem.Fields.Add("fieldName", "value");
            childDbItem.Fields.Add(Constants.Fields.BaseSetting.IsPublic, "1");

            settingDbItem.Children.Add(childDbItem);

            db.Add(settingDbItem);

            using (new Sitecore.Sites.SiteContextSwitcher(fakeSite))
            {
                // Act
                var actual = settingsService.GetAllSettings();

                // Assert
                actual.Should().NotBeEmpty();
            }
        }

        [Fact]
        public void GetAllSettings_ShouldBeEmpty_If_SettingsHasNoCustomField()
        {
            // Arrange
            var fakeSite = new Sitecore.FakeDb.Sites.FakeSiteContext(
                 new Sitecore.Collections.StringDictionary
                 {
                         { "name", "website" }, { "database", "master" }, { "rootPath", "/sitecore/content/" }
                 });

            var settingDbItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            var childDbItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            settingDbItem.TemplateID = Templates.Settings.Id;
            settingDbItem.Children.Add(childDbItem);

            db.Add(settingDbItem);

            using (new Sitecore.Sites.SiteContextSwitcher(fakeSite))
            {
                // Act
                var actual = settingsService.GetAllSettings();

                // Assert
                actual.ForEach(x => x.Should().BeEmpty());
            }
        }

        [Theory]
        [AutoData]
        public void GetSettingField_ShouldBeNull_If_SettingFolderNotFound(string settingPath, string fieldName)
        {
            // Arrange
            var fakeSite = new Sitecore.FakeDb.Sites.FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "website" }, { "database", "web" }
                });

            using (new Sitecore.Sites.SiteContextSwitcher(fakeSite))
            {
                // Act
                var actual = settingsService.GetSettingField(settingPath, fieldName);

                // Assert
                actual.Should().BeNull();
            }
        }

        [Theory]
        [InlineData("", "")]
        [InlineData("", null)]
        [InlineData(null, "")]
        [InlineData(null, null)]
        public void GetSettingField_ShouldBeNull_If_ArgumentsAreEmptyOrNull(string settingPath, string fieldName)
        {
            // Act
            var actual = settingsService.GetSettingField(settingPath, fieldName);

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoData]
        public void GetSettingField_ShouldBeNull_If_SettingNotExist(string settingPath, string fieldName, string fieldValue)
        {
            // Arrange
            var fakeSite = new Sitecore.FakeDb.Sites.FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "website" }, { "database", "master" }, { "rootPath", "/sitecore/content/" }
                });

            var settingDbItem = fixture.Build<DbItem>().Without(item => item.ParentID).Create();
            settingDbItem.Fields.Add(fieldName, fieldValue);
            db.Add(settingDbItem);

            // Act
            using (new Sitecore.Sites.SiteContextSwitcher(fakeSite))
            {
                var actual = settingsService.GetSettingField(settingPath, fieldName);
                // Assert
                actual.Should().BeNull();
            }
        }

        [Theory]
        [AutoData]
        public void GetSettingField_ShouldBeNull_If_SettingFieldNotExist(string settingPath, string fieldName)
        {
            // Arrange
            var fakeSite = new Sitecore.FakeDb.Sites.FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "website" }, { "database", "master" }, { "rootPath", "/sitecore/content/" }
                });

            var settingDbItem = fixture.Build<DbItem>().Without(item => item.ParentID).Create();
            db.Add(settingDbItem);

            // Act
            using (new Sitecore.Sites.SiteContextSwitcher(fakeSite))
            {
                var actual = settingsService.GetSettingField(settingPath, fieldName);
                // Assert
                actual.Should().BeNull();
            }
        }

        [Theory]
        [AutoData]
        public void GetSettingField_ShouldNotBeNullAndReturnResult_If_SettingAndFieldExist(string fieldName, string fieldValue)
        {
            // Arrange
            var fakeSite = new Sitecore.FakeDb.Sites.FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "website" }, { "database", "master" }, { "rootPath", "/sitecore/content/" }
                });

            var settingDbItem = fixture.Build<DbItem>().Without(item => item.ParentID).Create();
            settingDbItem.Fields.Add(fieldName, fieldValue);
            db.Add(settingDbItem);

            // Act
            using (new Sitecore.Sites.SiteContextSwitcher(fakeSite))
            {
                var actual = settingsService.GetSettingField(settingDbItem.FullPath, fieldName);
                // Assert
                actual.Should().NotBeNullOrEmpty();
                actual.Should().BeSameAs(fieldValue);
            }
        }
    }
}
