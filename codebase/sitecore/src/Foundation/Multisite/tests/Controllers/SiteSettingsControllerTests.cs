using System.Collections.Generic;
using System.Web.Mvc;
using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Foundation.Multisite.Controllers;
using easyJet.Foundation.Multisite.Logging;
using easyJet.Foundation.Multisite.Models;
using easyJet.Foundation.Multisite.Services;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace easyJet.Foundation.Multisite.Tests.Controllers
{
    public class SiteSettingsControllerTests
    {
        private readonly ISettingsService service;
        private readonly IMarketSettingsService marketService;
        private readonly IExperimentSettingsService experimentSettingsService;
        private readonly IMultisiteLogger logger;
        private readonly SiteSettingsController controller;

        public SiteSettingsControllerTests()
        {
            service = Substitute.For<ISettingsService>();
            logger = Substitute.For<IMultisiteLogger>();
            marketService = Substitute.For<IMarketSettingsService>();
            experimentSettingsService = Substitute.For<IExperimentSettingsService>();
            controller = new SiteSettingsController(service, logger, marketService, experimentSettingsService);
        }

        [Theory]
        [AutoData]
        public void Index_ShouldReturnSettings_FromExperimentSettingsService(List<Dictionary<string, object>> settings)
        {
            // Arrange
            experimentSettingsService.GetAllSettingsWithExperiments().Returns(settings);

            // Act
            var result = controller.Index() as JsonResult;

            // Assert
            result.Should().NotBeNull();
            result.Data.Should().BeSameAs(settings);
        }

        [Fact]
        public void Index_ShouldCallExperimentSettingsService()
        {
            // Arrange
            experimentSettingsService.GetAllSettingsWithExperiments()
                .Returns(new List<Dictionary<string, object>>());

            // Act
            controller.Index();

            // Assert
            experimentSettingsService.Received(1).GetAllSettingsWithExperiments();
        }

        [Theory]
        [AutoData]
        public void GetPromoCacheBustingSetting_SettingItemExists_NotBeNull(PromoCacheBustingResponse cacheBustingQueryResponse)
        {
            // Arrange
            service.GetSettingField(Arg.Any<string>(), Arg.Any<string>()).Returns(cacheBustingQueryResponse.QueryValue);
            // Act
            var actual = (controller.GetPromoCacheBustingSetting() as JsonResult).Data;
            // Assert
            actual.Should().NotBeNull();
        }

        [Theory]
        [AutoData]
        public void GetPromoCacheBustingSetting_SettingItemExists_ReturnSameType(PromoCacheBustingResponse cacheBustingQueryResponse)
        {
            // Arrange
            service.GetSettingField(Arg.Any<string>(), Arg.Any<string>()).Returns(cacheBustingQueryResponse.QueryValue);
            // Act
            var actual = (controller.GetPromoCacheBustingSetting() as JsonResult).Data;
            // Assert
            actual.Should().BeOfType(typeof(PromoCacheBustingResponse));
        }

        [Theory]
        [AutoData]
        public void SiteSettingsController_SettingItemExists_ReturnSettingValue(PromoCacheBustingResponse cacheBustingQueryResponse)
        {
            // Arrange
            service.GetSettingField(Arg.Any<string>(), Arg.Any<string>()).Returns(cacheBustingQueryResponse.QueryValue);
            // Act
            var actual = (controller.GetPromoCacheBustingSetting() as JsonResult).Data;
            // Assert
            (actual as PromoCacheBustingResponse).QueryValue.Should().BeEquivalentTo(cacheBustingQueryResponse.QueryValue);
        }

        [Theory]
        [AutoData]
        public void SiteSettingsController_ShouldReturnMarketSettings_IfSettingsExists()
        {
            // Arrange
            var fixture = new Fixture();
            fixture.Customize<MarketSettings>(c => c.Without(p => p.Item));
            var marketSettings = fixture.Build<Dictionary<string, MarketSettings>>().Create();
            marketService.GetAllMarkets().Returns(marketSettings);
            // Act
            var actual = (controller.GetAllMarketSettings() as JsonResult)?.Data;
            // Assert
            actual.Should().BeSameAs(marketSettings);
        }
    }
}
