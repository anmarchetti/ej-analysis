using System.Web.Mvc;
using easyJet.Foundation.Destinations.Controllers;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.FakeDb.Sites;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Controllers
{
    public class DestinationSearchOfferFiltersControllerTests
    {
        private readonly IOfferFiltersService offerFiltersService;
        private readonly IDestinationsLogger logger;
        private readonly DestinationsSearchOfferFiltersController controller;

        public DestinationSearchOfferFiltersControllerTests()
        {
            offerFiltersService = Substitute.For<IOfferFiltersService>();
            logger = Substitute.For<IDestinationsLogger>();
            controller = new DestinationsSearchOfferFiltersController(offerFiltersService, logger);
        }

        [Fact]
        public void GetOfferFilters_ShouldReturnJsonWithOfferFilters()
        {
            // Arrange
            var offerFiltersFolder = new FakeItem().WithTemplate(Constants.TemplateIds.OfferFiltersFolder).ToSitecoreItem();
            var expected = new OfferFilters(offerFiltersFolder);
            offerFiltersService.GetOfferFilters().Returns(expected);

            using (new FakeSiteContextSwitcher(CreateSiteContext()))
            {
                // Act
                var actual = controller.GetOfferFilters() as JsonResult;

                // Assert
                actual.Should().NotBeNull();
                actual.JsonRequestBehavior.Should().Be(JsonRequestBehavior.AllowGet);
                actual.Data.Should().BeSameAs(expected);
            }

            offerFiltersService.Received(1).GetOfferFilters();
        }

        [Fact]
        public void GetOfferFiltersReorderingConfiguration_ShouldReturnJsonWithConfiguration()
        {
            // Arrange
            var expected = new OfferFiltersReorderingConfiguration
            {
                ExperienceId = "exp-123",
                IsEnabled = true,
                Filters = new[]
                {
                    new OfferFilterReordering
                    {
                        Code = "HOTEL_THEME",
                    }
                }
            };

            offerFiltersService.GetOfferFiltersReorderingConfiguration().Returns(expected);

            using (new FakeSiteContextSwitcher(CreateSiteContext()))
            {
                // Act
                var actual = controller.GetOfferFiltersReorderingConfiguration() as JsonResult;

                // Assert
                actual.Should().NotBeNull();
                actual.JsonRequestBehavior.Should().Be(JsonRequestBehavior.AllowGet);
                actual.Data.Should().BeSameAs(expected);
            }

            offerFiltersService.Received(1).GetOfferFiltersReorderingConfiguration();
        }

        private static FakeSiteContext CreateSiteContext()
        {
            return new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "website" },
                    { "database", "master" },
                    { "rootPath", "/sitecore/content" }
                });
        }
    }
}
