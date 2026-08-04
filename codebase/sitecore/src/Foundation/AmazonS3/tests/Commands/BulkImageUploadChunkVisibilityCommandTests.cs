using easyJet.Foundation.AmazonS3.Commands;
using easyJet.Foundation.Testing.Extensions;
using FluentAssertions;
using Sitecore.Configuration;
using Sitecore.NSubstituteUtils;
using Sitecore.Shell.Framework.Commands;
using Xunit;

namespace easyJet.Foundation.AmazonS3.Tests.Commands
{
    public class BulkImageUploadChunkVisibilityCommandTests
    {
        [Fact]
        public void QueryState_ShouldReturnEnabled_WhenItemIsUnderImagesRootPath()
        {
            // Arrange
            var sut = new BulkImageUploadChunkVisibilityCommand();
            var item = new FakeItem()
                .WithName("image")
                .WithPathsPath("/sitecore/media library/Bulk Image Import/hotel/image")
                .ToSitecoreItem();

            var context = new CommandContext(item);

            using (new SettingsSwitcher("AmazonS3.SitecoreImagesPath", "/sitecore/media library/Bulk Image Import"))
            {
                // Act
                var state = sut.QueryState(context);

                // Assert
                state.Should().Be(CommandState.Enabled);
            }
        }

        [Fact]
        public void QueryState_ShouldReturnHidden_WhenItemIsOutsideImagesRootPath()
        {
            // Arrange
            var sut = new BulkImageUploadChunkVisibilityCommand();
            var item = new FakeItem()
                .WithName("image")
                .WithPathsPath("/sitecore/media library/Other Folder/image")
                .ToSitecoreItem();

            var context = new CommandContext(item);

            using (new SettingsSwitcher("AmazonS3.SitecoreImagesPath", "/sitecore/media library/Bulk Image Import"))
            {
                // Act
                var state = sut.QueryState(context);

                // Assert
                state.Should().Be(CommandState.Hidden);
            }
        }

        [Fact]
        public void QueryState_ShouldReturnEnabled_WhenItemIsImagesRootPath()
        {
            // Arrange
            var sut = new BulkImageUploadChunkVisibilityCommand();
            var item = new FakeItem()
                .WithName("Bulk Image Import")
                .WithPathsPath("/sitecore/media library/Bulk Image Import")
                .ToSitecoreItem();

            var context = new CommandContext(item);

            using (new SettingsSwitcher("AmazonS3.SitecoreImagesPath", "/sitecore/media library/Bulk Image Import"))
            {
                // Act
                var state = sut.QueryState(context);

                // Assert
                state.Should().Be(CommandState.Enabled);
            }
        }

        [Fact]
        public void QueryState_ShouldReturnHidden_WhenNoContextItemsProvided()
        {
            // Arrange
            var sut = new BulkImageUploadChunkVisibilityCommand();
            var context = new CommandContext();

            // Act
            var state = sut.QueryState(context);

            // Assert
            state.Should().Be(CommandState.Hidden);
        }

        [Fact]
        public void Execute_ShouldNotThrow()
        {
            // Arrange
            var sut = new BulkImageUploadChunkVisibilityCommand();

            // Act
            var action = new System.Action(() => sut.Execute(new CommandContext()));

            // Assert
            action.Should().NotThrow();
        }

        [Fact]
        public void IsVisibleForItem_ShouldReturnFalse_WhenItemIsNull()
        {
            // Arrange
            var sut = new BulkImageUploadChunkVisibilityCommandProxy();

            // Act
            var isVisible = sut.IsVisibleForItemProxy(null);

            // Assert
            isVisible.Should().BeFalse();
        }

        [Fact]
        public void IsVisibleForItem_ShouldReturnFalse_WhenImagesRootPathSettingIsEmpty()
        {
            // Arrange
            var sut = new BulkImageUploadChunkVisibilityCommandProxy();
            var item = new FakeItem()
                .WithPathsPath("/sitecore/media library/Bulk Image Import/hotel/image")
                .ToSitecoreItem();

            using (new SettingsSwitcher("AmazonS3.SitecoreImagesPath", string.Empty))
            {
                // Act
                var isVisible = sut.IsVisibleForItemProxy(item);

                // Assert
                isVisible.Should().BeFalse();
            }
        }

        private class BulkImageUploadChunkVisibilityCommandProxy : BulkImageUploadChunkVisibilityCommand
        {
            public bool IsVisibleForItemProxy(Sitecore.Data.Items.Item item)
            {
                return IsVisibleForItem(item);
            }
        }
    }
}
