using System.Collections.Generic;
using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.ContentSearch.Settings;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Multisite;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.Testing.ContentSearch;
using FluentAssertions;
using NSubstitute;
using Sitecore.ContentSearch;
using Sitecore.FakeDb.Sites;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Repositories
{
    public class AirportRepositoryTests
    {
        private readonly IDestinationSearchSettings settings;
        private readonly IProviderSearchContext provider;
        private readonly ProviderIndexConfiguration configuration;
        private readonly FakeSearchIndex index;
        private readonly IDestinationsLogger logger;
        private readonly IDatabaseProvider databaseProvider;

        public AirportRepositoryTests()
        {
            settings = Substitute.For<IDestinationSearchSettings>();
            settings.IndexName.Returns("sitecore_test_index");
            provider = Substitute.For<IProviderSearchContext>();
            configuration = Substitute.For<ProviderIndexConfiguration>();
            logger = Substitute.For<IDestinationsLogger>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            index = new FakeSearchIndex(provider, configuration, settings.IndexName);
        }

        [Theory]
        [AutoData]
        public void SearchByCountryCode_ShouldSearchAirportBtCountryCode_IfAirportWithCountryCodeExists(string code)
        {
            // Arrange
            var fakeSiteContext = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "fake" },
                    { "database", "master" },
                    { "language", "en" },
                    { "rootPath", "/sitecore/content" }
                });

            using (new FakeSiteContextSwitcher(fakeSiteContext))
            {
                var queryable = new SearchProviderQueryableCollection<AirportsGroupSearchResultItem>(new AirportsGroupSearchResultItem[]
                {
                    new AirportsGroupSearchResultItem()
                        {
                            TemplateId = Constants.TemplateIds.AirportsGroup,
                            Code = code,
                            IsLatestVersion = true,
                            Language = "en",
                            Path = "/sitecore/content"
                        }
                });

                provider.GetQueryable<AirportsGroupSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new AirportRepository(settings, logger, databaseProvider).SearchByCountryCode(new[] { code });

                    // Assert
                    result.Hits.Should().HaveCount(1);
                    result.Hits.FirstOrDefault().Document.Code.Should().Be(code);
                    result.Hits.FirstOrDefault().Document.TemplateId.Should().Be(Constants.TemplateIds.AirportsGroup);
                }
            }
        }

        [Theory]
        [AutoData]
        public void SearchByAirportCode_ShouldReturnAirport_IfCodeIsCorrect(string code)
        {
            // Arrange
            var fakeSiteContext = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
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
                        TemplateId = Constants.TemplateIds.Airport,
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
                    var result = new AirportRepository(settings, logger, databaseProvider).SearchByAirportCode(new List<string>(new[] { code }));

                    // Assert
                    result.Hits.Should().HaveCount(1);
                    result.Hits.FirstOrDefault().Document.Code.Should().Be(code);
                    result.Hits.FirstOrDefault().Document.TemplateId.Should().Be(Constants.TemplateIds.Airport);
                }
            }
        }

        [Fact]
        public void GetAirportCodesItemIds_ShouldReturnAirportIds()
        {
            // Arrange
            var sitePath = "/sitecore/content";
            var fakeSiteContext = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "fake" },
                    { "database", "master" },
                    { "language", "en" },
                    { "rootPath",  sitePath }
                });
            var dataFolderFakeItem = new FakeItem().WithTemplate(Templates.Data.Id).WithPath("/sitecore/content/").WithName("Data").WithItemAxes();
            var airportFolderFakeItem = new FakeItem().WithTemplate(Constants.TemplateIds.AirportsFolder).WithParent(dataFolderFakeItem).WithName("Airports").WithItemAxes();
            var airportGroupFakeItem = new FakeItem().WithItemAxes().WithParent(airportFolderFakeItem);

            var airportFakeItem = new FakeItem().WithTemplate(Constants.TemplateIds.Airport).WithParent(airportGroupFakeItem).WithName("Airport").WithField(Constants.Fields.DatasourceItem.Code, "code");
            databaseProvider.SelectSingleItem(Arg.Any<string>(), DatabaseType.Content).ReturnsForAnyArgs(airportFolderFakeItem);
            var airportGroupItem = airportGroupFakeItem.ToSitecoreItem();
            airportGroupItem.Axes.SelectItems(Arg.Any<string>()).Returns(new[] { airportFakeItem.ToSitecoreItem() });

            using (new FakeSiteContextSwitcher(fakeSiteContext))
            {
                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var actual = new AirportRepository(settings, logger, databaseProvider).GetAirportCodesItemIds(sitePath);

                    // Assert
                    actual.Should().HaveCount(1);
                    actual.Keys.First().Should().Be("code");
                    actual.Values.First().Should().Be(airportFakeItem.ID);
                }
            }
        }
    }
}
