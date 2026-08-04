using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Tests.Mocks;
using easyJet.Foundation.Multisite.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.SiteModes.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Abstractions;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentResolvers
{
    public class SearchPodContentResolverTests
    {
        private readonly IDatabaseProvider databaseProvider;
        private readonly IMarketSettingsService marketSettingsService;
        private readonly ISiteModeService siteModeService;
        private readonly BaseSettings settings;
        private readonly IDestinationsLogger logger;

        public SearchPodContentResolverTests()
        {
            databaseProvider = Substitute.For<IDatabaseProvider>();
            marketSettingsService = Substitute.For<IMarketSettingsService>();
            siteModeService = Substitute.For<ISiteModeService>();
            settings = Substitute.For<BaseSettings>();
            logger = Substitute.For<IDestinationsLogger>();

            settings.GetSetting("Destinations.SearchPodDefaultPath").Returns("/sitecore/content/EasyJet/Holidays/Data/Search Pods/Search Pod");
        }

        [Fact]
        public void ResolveDatasource_ShouldReturnProcessedItem_WhenDefaultItemIsUsed()
        {
            // Arrange
            var rendering = new Rendering();
            var renderingConfig = Substitute.For<IRenderingConfiguration>();
            var item = new FakeItem();
            databaseProvider.GetItem(Arg.Any<string>()).Returns(item);

            var resolver = new SearchPodContentResolverNullContextItem(
                 databaseProvider,
                 marketSettingsService,
                 siteModeService,
                 settings,
                 logger);

            // Act
            var result = resolver.ResolveDatasourceSub(rendering, renderingConfig);

            // Assert
            result.Should().NotBeNull();
            databaseProvider.Received(1).GetItem(Arg.Any<string>());
        }
    }
}