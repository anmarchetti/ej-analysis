using easyJet.Foundation.Analytics.Services;
using easyjet.Foundation.Testing.Attributes;
using easyJet.Foundation.Testing.Switchers;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data.Items;
using Xunit;

namespace easyJet.Foundation.Presentation.Tests.Pipelines.RequestBegin
{
    public class EvaluateTestExposureTests
    {
        private readonly IConsentService consentService;
        private readonly FakeEvaluateTestExposure evaluateTestExposure;

        public EvaluateTestExposureTests()
        {
            consentService = Substitute.For<IConsentService>();
            evaluateTestExposure = new FakeEvaluateTestExposure(consentService);
        }

        [Fact]
        public void GetRequestItem_ShouldReturnNull_IfNoCookieSet()
        {
            // Act
            var result = evaluateTestExposure.FakeGetRequestItem(null);

            // Assert
            result.Should().BeNull();
        }

        [Theory]
        [AutoDbData]
        public void GetRequestItem_ShouldReturnContextItem_IfCookieSet(Item item)
        {
            // Arrange
            consentService.IsPersonalizationConsentGiven().Returns(true);

            // Act
            using (new SafeContextItemSwitcher(item))
            {
                var result = evaluateTestExposure.FakeGetRequestItem(null)?.ID.Guid;

                // Assert
                result.Should().Be(item.ID.Guid);
            }
        }
    }
}
