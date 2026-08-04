using easyJet.Foundation.Multisite.Logging;
using easyJet.Foundation.Multisite.Services;
using easyJet.Foundation.Multisite.Tests.Extensions;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Multisite.Tests.Services
{
    public class DelegatedAreaServiceTests
    {
        private readonly IMultiSiteContext multisiteContext;
        private readonly IMultisiteLogger logger;
        private readonly DelegatedAreaService service;

        public DelegatedAreaServiceTests()
        {
            multisiteContext = Substitute.For<IMultiSiteContext>();
            logger = Substitute.For<IMultisiteLogger>();
            service = new DelegatedAreaService(multisiteContext, logger);
        }

        [Fact]
        public void CheckForDelegatedArea_ShouldBeFalse_IfItemIsNotClone()
        {
            // Arrange
            var item = new FakeItem();
            item.WithIsItemIsClone(false);

            // Act
            var actual = service.CheckForDelegatedArea(item);

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void CheckForDelegatedArea_ShouldBeFalse_IfSiteSettingIsNull()
        {
            // Arrange
            var item = new FakeItem();
            item.WithIsItemIsClone(true);
            Item settingItem = null;

            multisiteContext.GetSharedSitesSettingsItem(Arg.Any<Item>()).Returns(settingItem);

            // Act
            var actual = service.CheckForDelegatedArea(item);

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void CheckForDelegatedArea_ShouldBeFalse_IfSettingHasNoDelefatedAreas()
        {
            // Arrange
            var item = new FakeItem();
            item.WithIsItemIsClone(true);

            var settingItem = new FakeItem();
            var field = new FakeField(Templates.SharedSitesSettings.Fields.DelegatedAreas, settingItem);
            field.WithValue(string.Empty);

            multisiteContext.GetSharedSitesSettingsItem(Arg.Any<Item>()).Returns(settingItem);

            // Act
            var actual = service.CheckForDelegatedArea(item);

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void CheckForDelegatedArea_ShouldBeTrue_IfSettingHasDelefatedAreas()
        {
            // Arrange
            var item = new FakeItem();
            item.WithIsItemIsClone(true);
            item.WithItemAxes();

            var delegatedItem = new FakeItem();

            var settingItem = new FakeItem();
            var field = new FakeField(Templates.SharedSitesSettings.Fields.DelegatedAreas, settingItem);
            field.WithValue(delegatedItem.ID.ToString());

            item.ToSitecoreItem().Axes.SelectItems(Arg.Any<string>()).Returns(new Item[] { delegatedItem });

            multisiteContext.GetSharedSitesSettingsItem(Arg.Any<Item>()).Returns(settingItem);

            // Act
            var actual = service.CheckForDelegatedArea(item);

            // Assert
            actual.Should().BeTrue();
        }

        [Fact]
        public void AddToDelegatedArea_ShouldBeFalse_IfSettingIsNull()
        {
            // Arrange
            var item = new FakeItem();
            var targetItem = new FakeItem();
            Item settingItem = null;

            multisiteContext.GetSharedSitesSettingsItem(Arg.Any<Item>()).Returns(settingItem);

            // Act
            var actual = service.AddToDelegatedArea(item, targetItem);

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void AddToDelegatedArea_ShouldAddSharedItemToSetting_IfSettingIsExist()
        {
            // Arrange
            var item = new FakeItem();
            var targetItem = new FakeItem();
            var settingItem = new FakeItem();
            var field = new FakeField(Templates.SharedSitesSettings.Fields.DelegatedAreas, settingItem);
            settingItem.WithItemEditing();

            multisiteContext.GetSharedSitesSettingsItem(Arg.Any<Item>()).Returns(settingItem);

            // Act
            var actual = service.AddToDelegatedArea(item, targetItem);

            // Assert
            actual.Should().BeTrue();
            field.ToSitecoreField().Value.Should().Be(item.ID.ToString());
        }
    }
}
