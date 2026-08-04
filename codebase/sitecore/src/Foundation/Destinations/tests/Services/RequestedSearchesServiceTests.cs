using System;
using System.Collections.Generic;
using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.Multisite;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using NSubstitute;
using Sitecore.Abstractions;
using Sitecore.Collections;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Sitecore.Sites;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Services
{
    public class RequestedSearchesServiceTests
    {
        private readonly IHtmlCacheRepository cache;
        private readonly IRequestedSearchUrlService requestedSearchUrlService;
        private readonly RequestedSearchesService service;

        public RequestedSearchesServiceTests()
        {
            cache = Substitute.ForPartsOf<HtmlCacheRepository>();
            requestedSearchUrlService = Substitute.For<IRequestedSearchUrlService>();
            var baseSettings = Substitute.For<BaseSettings>();
            service = new RequestedSearchesService(cache, requestedSearchUrlService, baseSettings);
        }

        [Theory]
        [AutoDbData]
        public void GetRequestedSearches_ShouldBeNull_IfRequestedSearcheseDoesntExist(Db db)
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
                var actual = service.GetRequestedSearches("UK");

                // Assert
                actual.Should().BeEmpty();
            }
        }

        [Theory]
        [AutoData]
        public void GetRequestedSearches_ShouldReturnRequestedSearches_IfPromoPageExist(Db db)
        {
            // Arrange
            List<RequestedSearch> requestedSearches = null;
            cache.GetItem<IEnumerable<RequestedSearch>>(Arg.Any<string>()).Returns(requestedSearches);
            cache.StoreItem(Arg.Any<string>(), Arg.Any<IEnumerable<RequestedSearch>>()).Returns(requestedSearches);
            var dataFolderDbItem = new DbItem("Data");

            var requestedSearchesFolderDbItem = new DbItem("Requested Searches", ID.NewID, Constants.TemplateIds.RequestedSearchesFolder);

            var marketItem = AddMarketItemToDb(db);

            var requestedSearchesMarketFolder = new DbItem("Requested Searches UK", ID.NewID, Constants.TemplateIds.RequestedSearchesMarketFolder);
            var marketField = new DbLinkField(Templates.MarketSettings.Fields.Market)
            {
                TargetID = marketItem.ID
            };
            requestedSearchesMarketFolder.Fields.Add(marketField);

            var promoPage = new DbItem("Promo Page", ID.NewID, Constants.TemplateIds.PromoPage);
            promoPage.Fields.Add(Constants.Fields.SearchParameters.StartDate, string.Empty);
            promoPage.Fields.Add(Constants.Fields.SearchParameters.EndDate, string.Empty);
            promoPage.Fields.Add(Constants.FieldsIds.ReoccurringPromoPage.MaxDaysBeforeDeparture, string.Empty);
            db.Add(promoPage);

            var namedSearchDbItem = new DbItem("Requested Search", ID.NewID, Constants.TemplateIds.RequestedSearch);
            namedSearchDbItem.Fields.Add(Constants.Fields.RequestedSearch.PromoPage, promoPage.ID.ToString());
            namedSearchDbItem.Fields.Add(Constants.Fields.RequestedSearch.Enabled, Constants.Common.CheckboxTrueValue);
            namedSearchDbItem.Fields.Add(Constants.Fields.RequestedSearch.Origin, string.Empty);
            namedSearchDbItem.Fields.Add(Constants.Fields.RequestedSearch.Destination, string.Empty);
            namedSearchDbItem.Fields.Add(Constants.Fields.SearchParameters.StartDate, string.Empty);
            namedSearchDbItem.Fields.Add(Constants.Fields.SearchParameters.EndDate, string.Empty);

            var periodDbItem = new DbItem("Period 1", ID.NewID);

            namedSearchDbItem.Add(periodDbItem);
            requestedSearchesFolderDbItem.Add(requestedSearchesMarketFolder);
            requestedSearchesMarketFolder.Add(namedSearchDbItem);
            dataFolderDbItem.Add(requestedSearchesFolderDbItem);
            db.Add(dataFolderDbItem);

            var fakeSite = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "website" }, { "database", "master" }, { "rootPath", "/sitecore/content" }
                });

            fakeSite.Database = db.Database;

            string baseUrl = "https://baseurl.com", requestedSearchUrl = "https://baseurl.com/holidays/deals/test";
            requestedSearchUrlService.GetLiveSiteBaseUrl(Arg.Any<Item>(), Arg.Any<string>())
                .Returns(baseUrl);
            requestedSearchUrlService.BuildUrl(Arg.Any<Item>(), Arg.Is<string>(x => x.Equals(baseUrl)))
                .Returns(requestedSearchUrl);

            using (new SiteContextSwitcher(fakeSite))
            {
                // Act
                var actual = service.GetRequestedSearches("UK");

                // Assert
                actual.Should().NotBeEmpty();
                actual.First().Periods.Should().HaveCount(1);
                actual.First().Url.Should().NotBeNullOrEmpty();
                actual.First().Url.Should().Be(requestedSearchUrl);
            }
        }

        [Theory]
        [AutoData]
        public void GetRequestedSearches_ShouldReturnRequestedSearches_IfRequestedSearchesExistAndHasReoccurringPromoPage(Db db)
        {
            // Arrange
            DateTime expectedStartDate = DateTime.Now.Date;
            int expectedDaysBefore = 105;

            var endDate = expectedStartDate.AddDays((double)expectedDaysBefore);
            var expectedEndDate = new DateTime(endDate.Year, endDate.Month, DateTime.DaysInMonth(endDate.Year, endDate.Month));

            List<RequestedSearch> requestedSearches = null;
            cache.GetItem<IEnumerable<RequestedSearch>>(Arg.Any<string>()).Returns(requestedSearches);
            cache.StoreItem(Arg.Any<string>(), Arg.Any<IEnumerable<RequestedSearch>>()).Returns(requestedSearches);
            var reoccurringPromoPage = new DbItem("Reoccurring Promo Page", ID.NewID, Constants.TemplateIds.ReoccurringPromoPage);
            reoccurringPromoPage.Fields.Add(Constants.Fields.SearchParameters.StartDate, expectedStartDate.ToString("yyyyMMddTHHmmss"));
            reoccurringPromoPage.Fields.Add(Constants.Fields.SearchParameters.EndDate, string.Empty);
            reoccurringPromoPage.Fields.Add(Constants.FieldsIds.ReoccurringPromoPage.MaxDaysBeforeDeparture, expectedDaysBefore.ToString());

            db.Add(reoccurringPromoPage);

            var dataFolderDbItem = new DbItem("Data");

            var requestedSearchesFolderDbItem = new DbItem("Requested Searches", ID.NewID, Constants.TemplateIds.RequestedSearchesFolder);

            var marketItem = AddMarketItemToDb(db);

            var requestedSearchesMarketFolder = new DbItem("Requested Searches UK", ID.NewID, Constants.TemplateIds.RequestedSearchesMarketFolder);
            var marketField = new DbLinkField(Templates.MarketSettings.Fields.Market)
            {
                TargetID = marketItem.ID
            };
            requestedSearchesMarketFolder.Fields.Add(marketField);

            var namedSearchDbItem = new DbItem("Requested Search", ID.NewID, Constants.TemplateIds.RequestedSearch);
            namedSearchDbItem.Fields.Add(Constants.Fields.RequestedSearch.PromoPage, reoccurringPromoPage.ID.ToString());
            namedSearchDbItem.Fields.Add(Constants.Fields.RequestedSearch.Enabled, Constants.Common.CheckboxTrueValue);
            namedSearchDbItem.Fields.Add(Constants.Fields.RequestedSearch.Origin, string.Empty);
            namedSearchDbItem.Fields.Add(Constants.Fields.RequestedSearch.Destination, string.Empty);
            namedSearchDbItem.Fields.Add(Constants.Fields.SearchParameters.StartDate, string.Empty);
            namedSearchDbItem.Fields.Add(Constants.Fields.SearchParameters.EndDate, string.Empty);

            requestedSearchesFolderDbItem.Add(requestedSearchesMarketFolder);
            requestedSearchesMarketFolder.Add(namedSearchDbItem);
            dataFolderDbItem.Add(requestedSearchesFolderDbItem);
            db.Add(dataFolderDbItem);

            var fakeSite = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "website" }, { "database", "master" }, { "rootPath", "/sitecore/content" }
                });

            fakeSite.Database = db.Database;

            using (new SiteContextSwitcher(fakeSite))
            {
                // Act
                var actual = service.GetRequestedSearches("UK");

                // Assert
                actual.Should().NotBeEmpty();
                actual.First().Periods.Should().HaveCount(1);
                actual.First().Periods[0].SearchDateRangeEndDate.Should().Be(expectedEndDate);
            }
        }

        [Fact]
        public void GetRequestedSearches_ShouldNotBeEmpty_IfHasDataInCache()
        {
            // Arrange
            var requestedSearches = new List<RequestedSearch> { new RequestedSearch(null) };
            cache.GetItem<IEnumerable<RequestedSearch>>(Arg.Any<string>()).Returns(requestedSearches);
            cache.StoreItem(Arg.Any<string>(), Arg.Any<IEnumerable<RequestedSearch>>()).Returns(requestedSearches);

            // Act
            var actual = service.GetRequestedSearches("UK");

            // Assert
            actual.Should().NotBeEmpty();
        }

        private static DbItem AddMarketItemToDb(Db db)
        {
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

            db.Add(marketItem);
            db.Add(currencyItem);

            return marketItem;
        }
    }
}
