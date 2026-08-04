using System.Collections.Generic;
using AutoFixture;
using easyJet.Foundation.Multisite.Logging;
using easyJet.Foundation.Multisite.Models;
using easyJet.Foundation.Multisite.Services;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using FluentAssertions;
using NSubstitute;
using NSubstitute.Extensions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Sitecore.Sites;
using Xunit;

namespace easyJet.Foundation.Multisite.Tests.Services
{
    public class MarketSettingsServiceTests
    {
        private readonly Fixture fixture;
        private readonly IHtmlCacheRepository cacheMock;
        private readonly IMultisiteLogger loggerMock;
        private readonly MarketSettingsService sut;

        public MarketSettingsServiceTests()
        {
            fixture = new Fixture();
            cacheMock = Substitute.For<IHtmlCacheRepository>();
            loggerMock = Substitute.For<IMultisiteLogger>();
            sut = Substitute.ForPartsOf<MarketSettingsService>(cacheMock, loggerMock);
        }

        [Fact]
        public void GetAllMarkets_OnCacheMiss_GetsSettingsPerLanguageAndCaches()
        {
            // Arrange
            var dbFake = FakeUtil.FakeDatabase("fakeMaster");
            var fakeRecord = Substitute.ForPartsOf<ItemRecords>(dbFake);
            dbFake.Items.Returns(fakeRecord);
            var targetLanguage = "fr-FR";
            var targetId = ID.NewID;
            var marketCode = fixture.Create<string>();
            var countryCode = fixture.Create<string>();
            var targetLanguageSettings = new FakeItem(targetId, dbFake).WithLanguage(targetLanguage)
                .WithLanguages(new string[] { targetLanguage })
                .WithItemVersions()
                .WithField(Templates.Market.Fields.CountryCode, countryCode);

            var marketCodeField = new FakeField(owner: targetLanguageSettings).WithName(Templates.Market.Fields.Code)
                .WithValue(marketCode).WithShared(true).WithUnversioned(true);

            var countryCodeField = new FakeField(owner: targetLanguageSettings)
                .WithName(Templates.Market.Fields.CountryCode)
                .WithValue(countryCode).WithShared(true).WithUnversioned(true);

            FakeUtil.FakeItemFields(targetLanguageSettings);
            targetLanguageSettings.WithField(marketCodeField);
            targetLanguageSettings.WithField(countryCodeField);
            FakeUtil.FakeItemPath(targetLanguageSettings);

            var settingsItem = new FakeItem(database: dbFake).WithLanguage(targetLanguage)
                .WithName("Market Settings")
                .WithLanguages(new string[] { targetLanguage })
                .WithChild(targetLanguageSettings);

            var field = new FakeField(owner: settingsItem).WithName(Templates.MarketSettings.Fields.Market).WithValue(targetId.ToString()).WithUnversioned(true);
            FakeUtil.FakeItemFields(settingsItem);
            settingsItem.WithField(field);

            var versionSub = Substitute.For<ItemVersions>(settingsItem.ToSitecoreItem());
            versionSub.Count.Returns(1);
            settingsItem.WithItemVersions(versionSub);

            sut.Configure().When(substitute => substitute.GetMarketSettingsItem()).DoNotCallBase();
            sut.Configure().GetMarketSettingsItem().Returns(settingsItem);

            sut.Configure().When(substitute => substitute.GetReferenceTargetItemFromUtils(default)).DoNotCallBase();
            sut.Configure().GetReferenceTargetItemFromUtils(default).ReturnsForAnyArgs(targetLanguageSettings.ToSitecoreItem());

            // Act
            var result = sut.GetAllMarkets();

            // Assert
            result.Should().ContainKey(targetLanguage);
            var languageSpecificSettings = result[targetLanguage];
            languageSpecificSettings.Should().NotBeNull();
            languageSpecificSettings.Code.Should().BeEquivalentTo(marketCode);
            languageSpecificSettings.CountryCode.Should().BeEquivalentTo(countryCode);
            cacheMock.ReceivedWithAnyArgs().StoreItem(Arg.Any<string>(), result);
        }

        [Fact]
        public void GetAllMarkets_OnCacheMiss_WithMissingMarketSettingsItem_ReturnsEmpty()
        {
            // Arrange
            sut.Configure().When(substitute => substitute.GetMarketSettingsItem()).DoNotCallBase();

            // Act
            var result = sut.GetAllMarkets();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetAllMarkets_OnCacheHit_ReturnsFromCache()
        {
            // Arrange
            cacheMock.GetItem<Dictionary<string, MarketSettings>>(default).ReturnsForAnyArgs(
                new Dictionary<string, MarketSettings>()
                {
                    { "fr-fr", new MarketSettings(null) }
                });

            // Act
            var result = sut.GetAllMarkets();

            // Assert
            result.Should().NotBeNull();
            result.Should().NotBeEmpty();
        }

        [Fact]
        public void GetCurrentMarket_WhenAllMarketsDoesNotContainMatch_ReturnsNull()
        {
            // Arrange
            var ctx = new SiteContext(new SiteInfoPropertiesBuilder().WithLanguage("en"));
            cacheMock.GetItem<Dictionary<string, MarketSettings>>(default).ReturnsForAnyArgs(
                new Dictionary<string, MarketSettings>()
                {
                    { "fr-fr", new MarketSettings(null) }
                });
            MarketSettings result = null;

            // Act
            using (new SiteContextSwitcher(ctx))
            {
                result = sut.GetCurrentMarket();
            }

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public void GetCurrentMarket_WhenAllMarketsContainsMatch_ReturnsMatch()
        {
            // Arrange
            var language = "en";
            var ctx = new SiteContext(new SiteInfoPropertiesBuilder().WithLanguage(language));
            cacheMock.GetItem<Dictionary<string, MarketSettings>>(default).ReturnsForAnyArgs(
                new Dictionary<string, MarketSettings>()
                {
                    { language, new MarketSettings(null) }
                });
            MarketSettings markets = null;

            // Act
            using (new SiteContextSwitcher(ctx))
            {
                markets = sut.GetCurrentMarket();
            }

            // Assert
            markets.Should().NotBeNull();
        }
    }
}
