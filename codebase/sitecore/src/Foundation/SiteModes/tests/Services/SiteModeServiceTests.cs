using System;
using AutoFixture.Xunit2;
using easyJet.Foundation.Multisite;
using easyJet.Foundation.Multisite.Models;
using easyJet.Foundation.Multisite.Services;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SiteModes.Models.Domain;
using easyJet.Foundation.SiteModes.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.SiteModes.Tests.Services
{
    public class SiteModeServiceTests
    {
        private readonly IMarketSettingsService marketSettingService;
        private readonly IHtmlCacheRepository repository;
        private readonly ISitecoreContext context;
        private readonly SiteModeService service;

        public SiteModeServiceTests()
        {
            marketSettingService = Substitute.For<IMarketSettingsService>();
            repository = Substitute.For<IHtmlCacheRepository>();
            context = Substitute.For<ISitecoreContext>();
            service = new SiteModeService(marketSettingService, repository, context);
        }

        [Fact]
        public void IsSoftMode_ShouldReturnTrue_IfGetModesReturnSoftMode()
        {
            // Arrange
            var settings = new MaintenanceModeSettings(null)
            {
                SoftFrom = new DateTime(DateTime.Now.Year - 1, 1, 1),
                SoftTo = new DateTime(DateTime.Now.Year + 1, 1, 1)
            };

            repository.GetOrAdd(Arg.Any<string>(), Arg.Any<Func<MaintenanceModeSettings>>(), Arg.Any<int>()).Returns(settings);

            // Act
            var actual = service.IsSoftMode();

            // Assert
            actual.Should().BeTrue();
        }

        [Fact]
        public void IsFullMode_ShouldReturnTrue_IfGetModesReturnFullMode()
        {
            // Arrange
            var settings = new MaintenanceModeSettings(null)
            {
                FullFrom = new DateTime(DateTime.Now.Year - 1, 1, 1),
                FullTo = new DateTime(DateTime.Now.Year + 1, 1, 1)
            };

            repository.GetOrAdd(Arg.Any<string>(), Arg.Any<Func<MaintenanceModeSettings>>(), Arg.Any<int>()).Returns(settings);

            // Act
            var actual = service.IsFullMode();

            // Assert
            actual.Should().BeTrue();
        }

        [Fact]
        public void GetModes_ShouldReturnGlobalModes_IfGlobalModeInFullModeTimeBorders()
        {
            // Arrange
            var settings = new MaintenanceModeSettings(null)
            {
                FullFrom = new DateTime(DateTime.Now.Year - 1, 1, 1),
                FullTo = new DateTime(DateTime.Now.Year + 1, 1, 1)
            };

            repository.GetOrAdd(Arg.Any<string>(), Arg.Any<Func<MaintenanceModeSettings>>(), Arg.Any<int>()).Returns(settings);

            // Act
            var actual = service.GetModes();

            // Assert
            actual.IsFullMode.Should().BeTrue();
            marketSettingService.DidNotReceive().GetCurrentMarket();
        }

        [Theory]
        [AutoData]
        public void GetModes_ShouldReturnMarketModes_IfGlobalModeInFullModeTimeBorders(string marketCode)
        {
            // Arrange
            var settings = new MaintenanceModeSettings(null)
            {
                MaintenanceModePerMarkets = new System.Collections.Generic.Dictionary<string, MaintenanceModePerMarkets>()
                {
                    {
                        marketCode,
                        new MaintenanceModePerMarkets()
                        {
                            FullFrom = new DateTime(DateTime.Now.Year - 1, 1, 1),
                            FullTo = new DateTime(DateTime.Now.Year + 1, 1, 1)
                        }
                    }
                }
            };

            var marketItem = new FakeItem().WithField(Templates.Market.Fields.Code, marketCode);
            var setting = new MarketSettings(marketItem.ToSitecoreItem());

            marketSettingService.GetCurrentMarket().Returns(setting);
            repository.GetOrAdd(Arg.Any<string>(), Arg.Any<Func<MaintenanceModeSettings>>(), Arg.Any<int>()).Returns(settings);

            // Act
            var actual = service.GetModes();

            // Assert
            actual.IsFullMode.Should().BeTrue();
            marketSettingService.Received().GetCurrentMarket();
        }
    }
}
