using easyJet.Foundation.AmazonS3.Commands;
using easyJet.Foundation.Testing.Extensions;
using FluentAssertions;
using Sitecore.Configuration;
using Sitecore.NSubstituteUtils;
using Sitecore.Shell.Framework.Commands;
using Xunit;

namespace easyJet.Foundation.AmazonS3.Tests.Commands
{
    public class ToggleImportHotelImagesKeepOriginalRootCommandTests
    {
        [Fact]
        public void QueryState_ShouldReturnEnabled_WhenItemIsImagesRootPath_AndKeepOriginalDisabled()
        {
            // Arrange
            var sut = new ToggleImportHotelImagesKeepOriginalRootCommandProxy(initialValue: false);
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
        public void QueryState_ShouldReturnDown_WhenItemIsImagesRootPath_AndKeepOriginalEnabled()
        {
            // Arrange
            var sut = new ToggleImportHotelImagesKeepOriginalRootCommandProxy(initialValue: true);
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
                state.Should().Be(CommandState.Down);
            }
        }

        [Fact]
        public void QueryState_ShouldReturnHidden_WhenItemIsUnderImagesRootPathButNotRoot()
        {
            // Arrange
            var sut = new ToggleImportHotelImagesKeepOriginalRootCommandProxy(initialValue: false);
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
                state.Should().Be(CommandState.Hidden);
            }
        }

        private class ToggleImportHotelImagesKeepOriginalRootCommandProxy : ToggleImportHotelImagesKeepOriginalRootCommand
        {
            private readonly bool currentValue;

            public ToggleImportHotelImagesKeepOriginalRootCommandProxy(bool initialValue)
            {
                currentValue = initialValue;
            }

            protected override bool GetKeepOriginalEnabled() => currentValue;
        }
    }
}
