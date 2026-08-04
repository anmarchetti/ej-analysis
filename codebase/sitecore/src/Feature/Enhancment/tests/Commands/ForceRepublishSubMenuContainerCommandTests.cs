using easyJet.Feature.SitecoreEnhancment.Commands;
using easyJet.Feature.SitecoreEnhancment.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using NSubstitute;
using Sitecore.Configuration;
using Sitecore.NSubstituteUtils;
using Sitecore.Shell.Framework.Commands;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Tests.Commands
{
    public class ForceRepublishSubMenuContainerCommandTests
    {
        private readonly IAdminService adminService;

        public ForceRepublishSubMenuContainerCommandTests()
        {
            adminService = Substitute.For<IAdminService>();
        }

        [Fact]
        public void IsCommandContextValid_ShouldBeTrue_IfIsAdmin()
        {
            // Arrange
            var root = new FakeItem().WithLanguages(new[] { "en" });
            var item = root.ToSitecoreItem();
            item.Database.Name.Returns("master");
            item.Paths.Path.Returns("sitecore/content/easyJet/home");
            adminService.IsAdmin().Returns(true);

            using (new SettingsSwitcher("ForceRepublish.RootPath", item.Paths.Path))
            {
                var commandContext = new CommandContext(item);
                var sut = new ForceRepublishSubMenuContainerCommand(adminService);

                // Act
                var result = sut.IsCommandContextValid(commandContext);

                // Assert
                Assert.True(result);
            }
        }

        [Fact]
        public void IsCommandContextValid_ShouldBefalse_IfIsNotAdmin()
        {
            // Arrange
            var root = new FakeItem().WithLanguages(new[] { "en" });
            var item = root.ToSitecoreItem();
            item.Database.Name.Returns("master");
            item.Paths.Path.Returns("sitecore/content/easyJet/home");
            adminService.IsAdmin().Returns(false);

            using (new SettingsSwitcher("ForceRepublish.RootPath", item.Paths.Path))
            {
                var commandContext = new CommandContext(item);
                var sut = new ForceRepublishSubMenuContainerCommand(adminService);

                // Act
                var result = sut.IsCommandContextValid(commandContext);

                // Assert
                Assert.False(result);
            }
        }

        [Fact]
        public void IsCommandContextValid_ShouldBeFalse_IfIsNotMasterDb()
        {
            // Arrange
            var root = new FakeItem().WithLanguages(new[] { "en" });
            var item = root.ToSitecoreItem();
            item.Paths.Path.Returns("sitecore/content/easyJet/home");
            adminService.IsAdmin().Returns(true);

            using (new SettingsSwitcher("ForceRepublish.RootPath", item.Paths.Path))
            {
                var commandContext = new CommandContext(item);
                var sut = new ForceRepublishSubMenuContainerCommand(adminService);

                // Act
                var result = sut.IsCommandContextValid(commandContext);

                // Assert
                Assert.False(result);
            }
        }

        [Fact]
        public void IsCommandContextValid_ShouldBeFalse_IfIsNotCorrectPath()
        {
            // Arrange
            var root = new FakeItem().WithLanguages(new[] { "en" });
            var item = root.ToSitecoreItem();
            item.Database.Name.Returns("master");
            item.Paths.Path.Returns("sitecore/media-library");
            adminService.IsAdmin().Returns(true);

            using (new SettingsSwitcher("ForceRepublish.RootPath", "sitecore/content/easyJet/home"))
            {
                var commandContext = new CommandContext(item);
                var sut = new ForceRepublishSubMenuContainerCommand(adminService);

                // Act
                var result = sut.IsCommandContextValid(commandContext);

                // Assert
                Assert.False(result);
            }
        }

        [Fact]
        public void IsCommandContextValid_ShouldBeFalse_IfIsItemIsNull()
        {
            // Arrange
            var root = new FakeItem().WithLanguages(new[] { "en" });
            var item = root.ToSitecoreItem();
            item.Database.Name.Returns("master");
            item.Paths.Path.Returns("sitecore/media-library");
            adminService.IsAdmin().Returns(true);

            using (new SettingsSwitcher("ForceRepublish.RootPath", item.Paths.Path))
            {
                var commandContext = new CommandContext();
                var sut = new ForceRepublishSubMenuContainerCommand(adminService);

                // Act
                var result = sut.IsCommandContextValid(commandContext);

                // Assert
                Assert.False(result);
            }
        }
    }
}