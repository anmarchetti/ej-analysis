using easyJet.Foundation.Multisite.Pipelines.UiCloneItems;
using easyJet.Foundation.Multisite.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Sitecore.Shell.Framework.Pipelines;
using Xunit;

namespace easyJet.Foundation.Multisite.Tests.Pipelines.UiCloneItems
{
    public class ProtectCloneTest
    {
        private readonly IDelegatedAreaService delegatedAreaService;
        private readonly ProtectClone proccessor;

        public ProtectCloneTest()
        {
            delegatedAreaService = Substitute.For<IDelegatedAreaService>();
            proccessor = new ProtectClone(delegatedAreaService);
        }

        [Fact]
        public void Process_ShouldNotProtectBranch_IfArgsCopiesIsNull()
        {
            // Arrange
            var args = new CopyItemsArgs();

            // Act
            proccessor.Process(args);

            // Assert
            delegatedAreaService.DidNotReceive().CheckForDelegatedArea(Arg.Any<Item>());
        }

        [Fact]
        public void Process_ShouldNotProtectBranch_IfCopiesHasNoItems()
        {
            // Arrange
            var args = new CopyItemsArgs()
            {
                Copies = new Item[0]
            };

            // Act
            proccessor.Process(args);

            // Assert
            delegatedAreaService.DidNotReceive().CheckForDelegatedArea(Arg.Any<Item>());
        }

        [Fact]
        public void Process_ShouldNotProtectBranch_IfIsItemIsNotInDelegatedArea()
        {
            // Arrange
            var item = new FakeItem();
            item.WithAppearance();

            var args = new CopyItemsArgs()
            {
                Copies = new Item[] { item }
            };

            delegatedAreaService.CheckForDelegatedArea(Arg.Any<Item>()).Returns(false);

            // Act
            proccessor.Process(args);
            var actual = item.ToSitecoreItem();

            // Assert
            actual.Appearance.ReadOnly.Should().BeFalse();
        }

        [Fact]
        public void Process_ShouldProtectBranch_IfIsItemIsInDelegatedArea()
        {
            // Arrange
            var item = new FakeItem();
            item.WithAppearance();
            item.WithItemEditing();
            item.WithField(Templates.BasePage.Fields.OriginalItem, string.Empty);
            item.WithSourceUri();

            var args = new CopyItemsArgs()
            {
                Copies = new Item[] { item }
            };

            delegatedAreaService.CheckForDelegatedArea(Arg.Any<Item>()).Returns(true);

            // Act
            proccessor.Process(args);
            var actual = item.ToSitecoreItem();

            // Assert
            actual.Appearance.ReadOnly.Should().BeTrue();
            actual.Fields[Templates.BasePage.Fields.OriginalItem].Value.Should().Be(actual.SourceUri.ItemID.ToString());
        }
    }
}
