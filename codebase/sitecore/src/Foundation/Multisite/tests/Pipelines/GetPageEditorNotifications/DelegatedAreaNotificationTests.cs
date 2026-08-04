using easyJet.Foundation.Multisite.Pipelines.GetPageEditorNotifications;
using easyJet.Foundation.Multisite.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Sitecore.Pipelines.GetPageEditorNotifications;
using Xunit;

namespace easyJet.Foundation.Multisite.Tests.Pipelines.GetPageEditorNotifications
{
    public class DelegatedAreaNotificationTests
    {
        private readonly IDelegatedAreaService service;
        private readonly DelegatedAreaNotification proccessor;

        public DelegatedAreaNotificationTests()
        {
            service = Substitute.For<IDelegatedAreaService>();
            proccessor = new DelegatedAreaNotification(service);
        }

        [Fact]
        public void Process_ShouldNotAddNotification_IfItemDatabaseIsCore()
        {
            // Arrange
            var database = FakeUtil.FakeDatabase("core");
            var item = new FakeItem(database: database);
            var args = new GetPageEditorNotificationsArgs(item);

            // Act
            proccessor.Process(args);

            // Assert
            args.Notifications.Count.Should().Be(0);
        }

        [Fact]
        public void Process_ShouldNotNotification_IfItemIsNotInDelegatedArea()
        {
            // Arrange
            var item = new FakeItem();
            var args = new GetPageEditorNotificationsArgs(item);
            service.CheckForDelegatedArea(Arg.Any<Item>()).Returns(false);

            // Act
            proccessor.Process(args);

            // Assert
            args.Notifications.Count.Should().Be(0);
        }

        [Fact]
        public void Process_ShouldAddNotification_IfItemIsInDelegatedArea()
        {
            // Arrange
            var item = new FakeItem();
            var source = new FakeItem();
            item.WithSource(source);
            item.WithLanguage("en");
            item.WithItemVersions();
            item.ToSitecoreItem().Database.GetItem(Arg.Any<ID>()).Returns(item);
            item.ToSitecoreItem().Versions.GetLatestVersion().Returns(item);

            var args = new GetPageEditorNotificationsArgs(item);
            service.CheckForDelegatedArea(Arg.Any<Item>()).Returns(true);

            // Act
            proccessor.Process(args);

            // Assert
            args.Notifications.Count.Should().Be(1);
        }
    }
}
