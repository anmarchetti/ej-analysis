using System;
using easyJet.Feature.ScrappingTrigger.Services;
using easyJet.Feature.ScrappingTrigger.Settings;
using FluentAssertions;
using NSubstitute;
using Sitecore.Abstractions;
using Sitecore.Collections;
using Sitecore.Data.Items;
using Sitecore.FakeDb.Sites;
using Sitecore.Links;
using Sitecore.Links.UrlBuilders;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Feature.ScrappingTrigger.Tests.Services
{
    public class ScrapingTriggerUrlServiceTests
    {
        private readonly BaseLinkManager linkManager;
        private readonly IScrapingTriggerSettingsService settingsService;

        public ScrapingTriggerUrlServiceTests()
        {
            linkManager = Substitute.For<BaseLinkManager>();
            settingsService = Substitute.For<IScrapingTriggerSettingsService>();
        }

        [Fact]
        public void GetItemUrl_ShouldReturnEmptyString_IfItemNull()
        {
            // Arrange
            var sut = new ScrapingTriggerUrlService(linkManager, settingsService);

            // Act
            var result = sut.GetItemUrl(null);

            // Assert
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetItemUrl_ShouldReturnBaseUrl_IfUrlIsEmpty()
        {
            // Arrange
            settingsService.GetSettings().Returns(new ScrapingTriggerSettings
            {
                BaseUrl = "http://localhost:3000/en/holidays"
            });

            var sut = new ScrapingTriggerUrlService(linkManager, settingsService);

            var fakeSiteContext = new FakeSiteContext(
                new StringDictionary
                {
                    { "rootPath", "/sitecore/content/" },
                    { "database", "master" },
                    { "name", "website" }
                });

            var item = new FakeItem().WithUri().WithPath("/sitecore/content/holidays/home/destinations/spain").ToSitecoreItem();
            item.Paths.Path.Returns("/sitecore/content/holidays/home/destinations/spain");
            linkManager.GetItemUrl(Arg.Any<Item>(), Arg.Any<ItemUrlBuilderOptions>()).ReturnsForAnyArgs(string.Empty);
            linkManager.GetDefaultUrlBuilderOptions().Returns(LinkManager.GetDefaultUrlBuilderOptions());

            // Act
            using (new FakeSiteContextSwitcher(fakeSiteContext))
            {
                var result = sut.GetItemUrl(item);

                // Assert
                result.Should().Be("http://localhost:3000/en/holidays");
            }
        }

        [Fact]
        public void GetItemUrl_ShouldThrowException_IfSiteContextIsNull()
        {
            // Arrange
            var item = new FakeItem().WithRuntimeSettings();
            var sut = new ScrapingTriggerUrlService(linkManager, settingsService);

            // Assert
            Assert.Throws<ArgumentNullException>(() => sut.GetItemUrl(item));
        }

        [Fact]
        public void GetItemUrl_ShouldReturnUrl()
        {
            // Arrange
            settingsService.GetSettings().Returns(new ScrapingTriggerSettings
            {
                BaseUrl = "http://localhost:3000/en/holidays"
            });

            var fakeSiteContext = new FakeSiteContext(
                new StringDictionary
                {
                    { "rootPath", "/sitecore/content/" },
                    { "database", "master" },
                    { "name", "website" }
                });

            var item = new FakeItem().WithUri().WithPath("/sitecore/content/holidays/home/destinations/spain").ToSitecoreItem();
            item.Paths.Path.Returns("/sitecore/content/holidays/home/destinations/spain");
            linkManager.GetItemUrl(Arg.Any<Item>(), Arg.Any<ItemUrlBuilderOptions>()).ReturnsForAnyArgs("/destinations/spain");
            linkManager.GetDefaultUrlBuilderOptions().Returns(LinkManager.GetDefaultUrlBuilderOptions());
            var sut = new ScrapingTriggerUrlService(linkManager, settingsService);

            // Act
            using (new FakeSiteContextSwitcher(fakeSiteContext))
            {
                var result = sut.GetItemUrl(item);

                // Assert
                result.Should().Be("http://localhost:3000/en/holidays/spain");
            }
        }
    }
}