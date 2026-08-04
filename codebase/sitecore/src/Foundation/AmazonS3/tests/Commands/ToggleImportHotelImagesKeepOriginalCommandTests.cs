using easyJet.Foundation.AmazonS3.Commands;
using easyJet.Foundation.Testing.Extensions;
using FluentAssertions;
using Sitecore.Configuration;
using Sitecore.NSubstituteUtils;
using Sitecore.Shell.Framework.Commands;
using Xunit;

namespace easyJet.Foundation.AmazonS3.Tests.Commands
{
    public class ToggleImportHotelImagesKeepOriginalCommandTests
    {
        [Fact]
        public void Execute_ShouldEnableKeepOriginal_WhenCurrentlyDisabled()
        {
            // Arrange
            var sut = new ToggleImportHotelImagesKeepOriginalCommandProxy(initialValue: false);

            // Act
            sut.Execute(new CommandContext());

            // Assert
            sut.LastSetValue.Should().BeTrue();
            sut.RefreshMessageSent.Should().BeTrue();
        }

        [Fact]
        public void Execute_ShouldDisableKeepOriginal_WhenCurrentlyEnabled()
        {
            // Arrange
            var sut = new ToggleImportHotelImagesKeepOriginalCommandProxy(initialValue: true);

            // Act
            sut.Execute(new CommandContext());

            // Assert
            sut.LastSetValue.Should().BeFalse();
            sut.RefreshMessageSent.Should().BeTrue();
        }

        [Fact]
        public void QueryState_ShouldReturnEnabled_WhenItemIsUnderImagesRootPath_AndKeepOriginalDisabled()
        {
            // Arrange
            var sut = new ToggleImportHotelImagesKeepOriginalCommandProxy(initialValue: false);
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
        public void QueryState_ShouldReturnDown_WhenItemIsUnderImagesRootPath_AndKeepOriginalEnabled()
        {
            // Arrange
            var sut = new ToggleImportHotelImagesKeepOriginalCommandProxy(initialValue: true);
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
                state.Should().Be(CommandState.Down);
            }
        }

        [Fact]
        public void QueryState_ShouldReturnEnabled_WhenPathCaseDiffersFromConfiguredRoot()
        {
            // Arrange
            var sut = new ToggleImportHotelImagesKeepOriginalCommandProxy(initialValue: false);
            var item = new FakeItem()
                .WithName("image")
                .WithPathsPath("/sitecore/media library/BULK IMAGE IMPORT/hotel/image")
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
        public void QueryState_ShouldReturnHidden_WhenItemIsImagesRootPath()
        {
            // Arrange
            var sut = new ToggleImportHotelImagesKeepOriginalCommandProxy(initialValue: false);
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
                state.Should().Be(CommandState.Hidden);
            }
        }

        [Fact]
        public void QueryState_ShouldReturnHidden_WhenItemIsOutsideImagesRootPath()
        {
            // Arrange
            var sut = new ToggleImportHotelImagesKeepOriginalCommandProxy(initialValue: false);
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
        public void QueryState_ShouldReturnHidden_WhenNoContextItemsProvided()
        {
            // Arrange
            var sut = new ToggleImportHotelImagesKeepOriginalCommandProxy(initialValue: false);
            var context = new CommandContext();

            // Act
            var state = sut.QueryState(context);

            // Assert
            state.Should().Be(CommandState.Hidden);
        }

        private class ToggleImportHotelImagesKeepOriginalCommandProxy : ToggleImportHotelImagesKeepOriginalCommand
        {
            private bool currentValue;

            public ToggleImportHotelImagesKeepOriginalCommandProxy(bool initialValue)
            {
                currentValue = initialValue;
            }

            public bool? LastSetValue { get; private set; }

            public bool RefreshMessageSent { get; private set; }

            protected override bool GetKeepOriginalEnabled() => currentValue;

            protected override void SetKeepOriginalEnabled(bool value)
            {
                LastSetValue = value;
                currentValue = value;
            }

            protected override void SendRefreshMessage()
            {
                RefreshMessageSent = true;
            }
        }
    }
}
