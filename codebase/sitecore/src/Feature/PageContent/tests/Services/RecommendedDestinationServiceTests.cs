using System.Collections.Generic;
using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Feature.PageContent.Models;
using easyJet.Feature.PageContent.Services;
using easyJet.Foundation.Multisite;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Collections;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Sitecore.Sites;
using Sitecore.Web;
using Xunit;

namespace easyJet.Feature.PageContent.Tests.Services
{
    public class RecommendedDestinationServiceTests
    {
        private readonly HtmlCacheRepository cache;
        private readonly IDatabaseProvider databaseProvider;
        private readonly ISitecoreContext sitecoreContext;
        private readonly RecommendedDestinationService recommendedDestinationService;

        public RecommendedDestinationServiceTests()
        {
            // Arrange
            databaseProvider = Substitute.For<IDatabaseProvider>();
            sitecoreContext = Substitute.For<ISitecoreContext>();
            cache = Substitute.ForPartsOf<HtmlCacheRepository>();
            recommendedDestinationService = new RecommendedDestinationService(cache, databaseProvider, sitecoreContext);
        }

        [Fact]
        public void Get_ShouldReturnEmptyCollection_IfDBHasNoInspireMeFolder()
        {
            // Arrange
            var fakeSiteInfo = SiteInfo.Create(new StringDictionary { { "name", "site" } });
            var fakeSite = Substitute.ForPartsOf<SiteContext>(fakeSiteInfo);
            fakeSite.RootPath.Returns("/sitecore");
            sitecoreContext.Site.Returns(fakeSite);

            Dictionary<string, RecommendedDestination> nullObject = null;
            cache.GetItem<Dictionary<string, RecommendedDestination>>(Arg.Any<string>()).Returns(nullObject);
            cache.StoreItem(Arg.Any<string>(), Arg.Any<Dictionary<string, RecommendedDestination>>()).Returns(nullObject);

            Item nullItem = null;

            databaseProvider.SelectSingleItem(Arg.Any<string>(), DatabaseType.Content).Returns(nullItem);

            // Act
            var actual = recommendedDestinationService.GetAll();

            // Assert
            actual.Should().BeEmpty();
        }
    }
}
