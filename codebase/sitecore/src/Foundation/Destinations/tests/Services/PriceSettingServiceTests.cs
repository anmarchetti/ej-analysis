using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.Destinations.Tests.Infrastructures;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb.Sites;
using Sitecore.Sites;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Services
{
    public class PriceSettingServiceTests
    {
        private readonly IHtmlCacheRepository cache;
        private readonly PriceBreakdownSettingService service;

        public PriceSettingServiceTests()
        {
            // Arrange
            cache = Substitute.For<IHtmlCacheRepository>();
            service = new PriceBreakdownSettingService(cache);
        }

        [Fact]
        public void GetPriceBreakdownSettings_ShouldReturnDataFromCache_If_CacheHasValueByKey()
        {
            // Arrange
            cache.GetItem<Dictionary<string, PriceBreakdownSetting>>(Arg.Any<string>())
                .Returns(new Dictionary<string, PriceBreakdownSetting>()
                {
                    {
                        "testkey", new PriceBreakdownSetting() { Text = "testValue" }
                    }
                });

            // Act
            var actual = service.GetPriceBreakdownSettings();

            // Assert
            actual.Should().NotBeNull();
            actual["testkey"].Text.Should().Be("testValue");
        }

        [Fact]
        public void GetPriceBreakdownSettings_ShouldBeEmpty_If_SettingFolderNotFound()
        {
            // Arrange
            var fakeSite = new FakeSiteContext(
                 new Sitecore.Collections.StringDictionary
                 {
                         { "name", "website" }, { "database", "web" }
                 });

            using (new SiteContextSwitcher(fakeSite))
            {
                // Act
                var actual = service.GetPriceBreakdownSettings();

                // Assert
                actual.Should().BeEmpty();
            }
        }

        [Theory]
        [AutoDbData]
        public void GetAllSettings_ShouldReturnSettings_If_SettingFolderHasChildren(
            Item root,
            SettingsDbTemplate settingFolderTemplate,
            PriceBreakdownSettingsFolderDbTemplate priceBreakdownSettingsFolderTemplate,
            PriceBreakdownSettingDbTemplate priceBreakdownSettingDbTemplate)
        {
            // Arrange
            var fakeSite = new FakeSiteContext(
                 new Sitecore.Collections.StringDictionary
                 {
                         { "name", "website" }, { "database", "master" }, { "rootPath", "/sitecore/content/" }
                 });

            using (new SiteContextSwitcher(fakeSite))
            {
                var settings = root
               .Add("settings", new TemplateID(settingFolderTemplate.ID))
               .Add("Price Breakdown settings", new TemplateID(priceBreakdownSettingsFolderTemplate.ID));

                settings.Add("Holiday offer", new TemplateID(priceBreakdownSettingDbTemplate.ID));
                settings.Add("Not Valid Item", new TemplateID(settingFolderTemplate.ID));
                settings.Add("Online payment", new TemplateID(priceBreakdownSettingDbTemplate.ID));

                // Act
                var actual = service.GetPriceBreakdownSettings();

                // Assert
                actual["AAA"].Text.Should().Be("Default text");
                actual["BBB"].Text.Should().Be("Default text");
                actual["BBB"].Code.Should().Be("UI Codes");
                cache.Received().StoreItem(Arg.Any<string>(), Arg.Any<Dictionary<string, PriceBreakdownSetting>>());
            }
        }
    }
}
