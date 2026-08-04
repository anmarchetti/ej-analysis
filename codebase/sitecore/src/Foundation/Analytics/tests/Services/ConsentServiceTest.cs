using System.Web;
using AutoFixture.Xunit2;
using easyJet.Foundation.Analytics.Logging;
using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.Multisite;
using FluentAssertions;
using NSubstitute;
using Sitecore.Abstractions;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Analytics.Tests.Services
{
    public class ConsentServiceTest
    {
        private readonly ConsentService consentService;
        private readonly IAnalyticsLogger logger;
        private readonly BaseSettings settings;
        private readonly IMultiSiteContext context;

        public ConsentServiceTest()
        {
            logger = Substitute.For<IAnalyticsLogger>();
            settings = Substitute.For<BaseSettings>();
            context = Substitute.For<IMultiSiteContext>();
            consentService = new ConsentService(settings, context, logger);
        }

        [Fact]
        public void IsPersonalizationConsentGiven_ShouldReturnFalse_IfCookieIsNull()
        {
            // Act
            var actual = consentService.IsPersonalizationConsentGiven();

            // Assert
            actual.Should().BeFalse();
        }

        [Theory]
        [AutoData]
        public void IsPersonalizationConsentGiven_ShouldReturnTrue_IfCookieIsExist(string cookieKey)
        {
            // Arrange
            settings.GetSetting(Arg.Any<string>()).Returns(cookieKey);

            var cookie = new HttpCookie(cookieKey)
            {
                Value = "1"
            };

            var request = new HttpRequest(null, "http://tempuri.org", string.Empty);
            request.Cookies.Add(cookie);

            HttpContext.Current = new HttpContext(request, new HttpResponse(null));

            // Act
            var actual = consentService.IsPersonalizationConsentGiven();

            // Assert
            actual.Should().BeTrue();
        }

        [Fact]
        public void IsPersonalizationEnabled_ShouldReturnTrue_IfAnalyticSettingIsNotDefined()
        {
            // Act
            var actual = consentService.IsPersonalizationEnabled();

            // Assert
            actual.Should().BeTrue();
        }

        [Fact]
        public void IsPersonalizationEnabled_ShouldReturnFalse_IfEnablePersonalizationSettingHasFalseValue()
        {
            // Arrange
            var analyticSetting = new FakeItem()
                .WithField(Constants.Templates.AnalyticSettings.Fields.EnablePersonalization, "0")
                .WithTemplate(Constants.Templates.AnalyticSettings.ID);

            var settingsItem = new FakeItem().WithChild(analyticSetting);

            context.SettingsItem.Returns(settingsItem);

            // Act
            var actual = consentService.IsPersonalizationEnabled();

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void IsPersonalizationEnabled_ShouldReturnFalse_IfEnablePersonalizationSettingHasTrueValue()
        {
            // Arrange
            var analyticSetting = new FakeItem()
                .WithField(Constants.Templates.AnalyticSettings.Fields.EnablePersonalization, "1")
                .WithTemplate(Constants.Templates.AnalyticSettings.ID);

            var settingsItem = new FakeItem().WithChild(analyticSetting);

            context.SettingsItem.Returns(settingsItem);

            // Act
            var actual = consentService.IsPersonalizationEnabled();

            // Assert
            actual.Should().BeTrue();
        }
    }
}