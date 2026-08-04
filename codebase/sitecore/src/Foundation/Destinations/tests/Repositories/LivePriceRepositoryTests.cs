using System.Collections.Generic;
using System.Linq;
using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.Multisite;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using NSubstitute;
using Sitecore.Collections;
using Sitecore.Data;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Sitecore.Sites;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Repositories
{
    public class LivePriceRepositoryTests
    {
        private readonly IHtmlCacheRepository cache;
        private readonly LivePriceRepository repository;
        private readonly Fixture fixture;

        public LivePriceRepositoryTests()
        {
            fixture = new Fixture();
            cache = Substitute.ForPartsOf<HtmlCacheRepository>();
            repository = new LivePriceRepository(cache);
        }

        [Theory]
        [AutoDbData]
        public void GetNamedSearchSettings_ShouldBeNull_IfLivePriceDoesntExist(Db db)
        {
            // Arrange
            var fakeSite = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "website" }, { "database", "master" }, { "rootPath", "/sitecore/content" }
                });

            fakeSite.Database = db.Database;

            using (new SiteContextSwitcher(fakeSite))
            {
                // Act
                var actual = repository.GetLivePriceSettings("UK");

                // Assert
                actual.Should().BeEmpty();
            }
        }

        [Theory]
        [AutoData]
        public void GetNamedSearchSettings_ShouldReturnNamedSearchSettings_IfSettingsExist(Db db)
        {
            // Arrange
            cache.GetItem<IEnumerable<NamedSearchItem>>(Arg.Any<string>()).Returns(default(List<NamedSearchItem>));
            cache.StoreItem(Arg.Any<string>(), Arg.Any<IEnumerable<NamedSearchItem>>()).Returns(default(List<NamedSearchItem>));

            var dataFolderDbItem = new DbItem("Data");

            var livePriceFolderDbItem = new DbItem("Live price", ID.NewID, Constants.TemplateIds.LivePriceFolder);

            var currencyItem = new DbItem("GBP", ID.NewID, ID.Parse("{D3D0218E-D91A-4165-B844-CA406E254004}"));
            var currencyCodeField = new DbField(Templates.Market.Fields.Code)
            {
                Value = "GBP"
            };
            currencyItem.Fields.Add(currencyCodeField);

            var marketItem = new DbItem("United Kingdom", ID.NewID, Templates.Market.Id);
            var currencyField = new DbField(Templates.Market.Fields.Currency)
            {
                Value = currencyItem.ID.ToString()
            };
            marketItem.Fields.Add(currencyField);
            var codeField = new DbField(Templates.Market.Fields.Code)
            {
                Value = "UK"
            };
            marketItem.Fields.Add(codeField);

            var namedSearchesFolderDbItem = new DbItem("Named searches", ID.NewID, Constants.TemplateIds.NamedSearchFolder);
            var marketField = new DbLinkField(Templates.MarketSettings.Fields.Market)
            {
                TargetID = marketItem.ID
            };
            namedSearchesFolderDbItem.Fields.Add(marketField);
            var namedSearchDbItem = new DbItem("Named search");
            var periodDbItem = new DbItem("Period 1", ID.NewID);

            namedSearchDbItem.Add(periodDbItem);
            namedSearchesFolderDbItem.Add(namedSearchDbItem);
            livePriceFolderDbItem.Add(namedSearchesFolderDbItem);
            dataFolderDbItem.Add(livePriceFolderDbItem);
            db.Add(dataFolderDbItem);
            db.Add(marketItem);
            db.Add(currencyItem);

            var fakeSite = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "website" }, { "database", "master" }, { "rootPath", "/sitecore/content" }
                });

            fakeSite.Database = db.Database;

            using (new SiteContextSwitcher(fakeSite))
            {
                // Act
                var actual = repository.GetLivePriceSettings("UK");

                // Assert
                actual.Should().HaveCount(1);
                actual.First().Periods.Should().HaveCount(1);
            }
        }

        [Fact]
        public void GetNamedSearchSettings_ShouldNotBeEmpty_IfHasDataInCache()
        {
            // Arrange
            var namedSearches = new List<NamedSearchItem> { new NamedSearchItem(null) };
            cache.GetItem<IEnumerable<NamedSearchItem>>(Arg.Any<string>()).Returns(namedSearches);

            // Act
            var actual = repository.GetLivePriceSettings("UK");

            // Assert
            actual.Should().NotBeEmpty();
        }
    }
}
