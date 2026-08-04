using easyJet.Foundation.Multisite.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Multisite.Tests.Services
{
    public class DelegatedAreaCoordinatorServiceTest
    {
        private readonly BaseTemplateManager templateManager;
        private readonly IDelegatedAreaService delegatedAreaService;
        private readonly DelegatedAreaCoordinatorService delegatedAreaCoordinatorService;

        public DelegatedAreaCoordinatorServiceTest()
        {
            templateManager = Substitute.For<BaseTemplateManager>();
            delegatedAreaService = Substitute.For<IDelegatedAreaService>();
            delegatedAreaCoordinatorService = new DelegatedAreaCoordinatorService(templateManager, delegatedAreaService);
        }

        [Fact]
        public void IsPage_ShouldReturnFalse_IfItemIsNull()
        {
            Item item = null;
            // Act
            var actual = delegatedAreaCoordinatorService.IsPage(item);
            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void IsPage_ShouldReturnTrue_IfItemInheritsFromBasePage()
        {
            // Arrange
            ID[] ids = { Templates.BasePage.ID };
            var template = new FakeTemplate("name", new ID(Templates.DestinationPages.Hotel))
                .WithBaseIDs(ids)
                .ToSitecoreTemplate();
            var item = new FakeItem()
                .WithTemplate(new ID(Templates.DestinationPages.Hotel))
                .ToSitecoreItem();
            templateManager.GetTemplate(Arg.Any<Item>()).Returns(template);

            // Act
            var actual = delegatedAreaCoordinatorService.IsPage(item);

            // Assert
            actual.Should().BeTrue();
        }
    }
}