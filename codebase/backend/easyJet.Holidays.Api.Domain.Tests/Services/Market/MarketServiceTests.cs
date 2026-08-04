using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Market
{
    public class MarketServiceTests
    {
        private readonly IFixture _fixture;

        public MarketServiceTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();
            _fixture.Inject(Options.Create(new LanguageSettings { MarketLanguages = new Dictionary<string, IEnumerable<string>> { { "UK", new[] { "en" } } } }));
        }

        [Fact]
        public void GetCurrentMarket_IfLanguageContext_ReturnsMarketSettings()
        {
            // Arrange
            var expectedMarket = "enMarket";
            var expectedCurrency = "GBP";
            var langService = _fixture.Freeze<Mock<ILanguageService>>();
            var settingsService = _fixture.Freeze<Mock<ISettingsService>>();
            var sut = _fixture.Create<MarketService>();

            langService.Setup(x => x.GetCurrentLanguage()).Returns("en");
            settingsService.Setup(x => x.GetAllMarketSettings()).ReturnsAsync(new Dictionary<string, MarketSettings>
            {
                { "UK", new MarketSettings { Code = expectedMarket, Currency = new Currency { Code = expectedCurrency }} },
                { "CH", new MarketSettings { Code = "chMarket", Currency = new Currency { Code = "CHF" }} }
             });

            // Act
            var result = sut.GetCurrentMarket();

            // Assert
            result.Code.Should().Be(expectedMarket);
            result.Currency.Code.Should().Be(expectedCurrency);
        }

        [Fact]
        public void GetCurrentMarket_IfNoMarketForCurrentLanguage_ReturnsNull()
        {
            // Arrange
            var langService = _fixture.Freeze<Mock<ILanguageService>>();
            var settingsService = _fixture.Freeze<Mock<ISettingsService>>();
            var sut = _fixture.Create<MarketService>();

            langService.Setup(x => x.GetCurrentLanguage()).Returns("en");
            settingsService.Setup(x => x.GetAllMarketSettings()).ReturnsAsync(new Dictionary<string, MarketSettings>
            {
            });

            // Act
            var result = sut.GetCurrentMarket();

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public void GetCurrentMarket_IfNoCurrentLanguage_ReturnsNull()
        {
            // Arrange
            var settingsService = _fixture.Freeze<Mock<ISettingsService>>();
            var sut = _fixture.Create<MarketService>();

            settingsService.Setup(x => x.GetAllMarketSettings()).ReturnsAsync(new Dictionary<string, MarketSettings>
            {
            });

            // Act
            var result = sut.GetCurrentMarket();

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public void GetCurrentMarket_GetAllMarketSettings_ShouldBeCalled()
        {
            // Arrange

            var settingsService = _fixture.Freeze<Mock<ISettingsService>>();
            var langService = _fixture.Freeze<Mock<ILanguageService>>();
            var sut = _fixture.Create<MarketService>();

            langService.Setup(x => x.GetCurrentLanguage()).Returns("en");
            settingsService.Setup(x => x.GetAllMarketSettings()).ReturnsAsync(new Dictionary<string, MarketSettings>());

            // Act
            sut.GetCurrentMarket();

            // Assert
            settingsService.Verify(x => x.GetAllMarketSettings(), Times.Once);
        }

        [Theory]
        [InlineData("")]
        [InlineData("                ")]
        [InlineData(null)]
        public void IsValidCurrency_ForInvalidCurrency_ReturnsFalse(string code)
        {
            // Arrange
            var sut = _fixture.Create<MarketService>();

            // Act
            var result = sut.IsValidCurrency(code);

            // Assert
            result.Should().BeFalse();

        }

        [Fact]
        public void IsValidCurrency_ForUnknownCurrency_ReturnsFalse()
        {
            // Arrange
            var settingsService = _fixture.Freeze<Mock<ISettingsService>>();

            settingsService.Setup(x => x.GetAllMarketSettings()).ReturnsAsync(new Dictionary<string, MarketSettings>
            {
                { "UK", new MarketSettings { Code = "UK", Currency = new Currency(){Code = "GBP"}} },
                { "Switzerland", new MarketSettings { Code = "CHF", Currency = new Currency(){Code = "CHF"}} }
            });

            var sut = _fixture.Create<MarketService>();

            // Act
            var result = sut.IsValidCurrency("USD");

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void IsValidCurrency_ForValidCurrency_ReturnsTrue()
        {
            // Arrange
            var settingsService = _fixture.Freeze<Mock<ISettingsService>>();

            settingsService.Setup(x => x.GetAllMarketSettings()).ReturnsAsync(new Dictionary<string, MarketSettings>
            {
                { "UK", new MarketSettings { Code = "UK", Currency = new Currency(){Code = "GBP"}} },
                { "Switzerland", new MarketSettings { Code = "CHF", Currency = new Currency(){Code = "CHF"}} }
            });

            var sut = _fixture.Create<MarketService>();

            // Act
            var result = sut.IsValidCurrency("CHF");

            // Assert
            result.Should().BeTrue();
        }
    }
}
