using easyJet.Foundation.Multisite.Pipelines.GetContentEditorWarnings;
using easyJet.Foundation.Multisite.Services;
using NSubstitute;
using Sitecore.Data.Clones;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Sitecore.Pipelines.GetContentEditorWarnings;
using Xunit;

namespace easyJet.Foundation.Multisite.Tests.Pipelines.GetContentEditorWarnings
{
    public class HideNotificationForDelegatedAreaTests
    {
        private readonly IDelegatedAreaService service;
        private readonly HideNotificationForDelegatedArea proccessor;

        public HideNotificationForDelegatedAreaTests()
        {
            service = Substitute.For<IDelegatedAreaService>();
            proccessor = new HideNotificationForDelegatedArea(service);
        }

        [Fact]
        public void Process_ShouldNotHideWarning_IfItemIsNotInDelegatedArea()
        {
            // Arrange
            var database = FakeUtil.FakeDatabase();
            var notificationProvider = Substitute.For<NotificationProvider>();
            var notification = Substitute.For<Notification>();
            var notifications = new Notification[] { notification };
            notificationProvider.GetNotifications(Arg.Any<Item>()).Returns(notifications);

            database.NotificationProvider.Returns(notificationProvider);
            var item = new FakeItem(database: database);
            var args = new GetContentEditorWarningsArgs(item);
            service.CheckForDelegatedArea(Arg.Any<Item>()).Returns(false);

            // Act
            proccessor.Process(args);

            // Assert
            notification.DidNotReceive().Dismiss(Arg.Any<Item>());
        }

        [Fact]
        public void Process_ShouldHideWarning_IfItemIsInDelegatedArea()
        {
            // Arrange
            var database = FakeUtil.FakeDatabase();
            var notificationProvider = Substitute.For<NotificationProvider>();
            var notification = Substitute.For<Notification>();
            var notifications = new Notification[] { notification };
            notificationProvider.GetNotifications(Arg.Any<Item>()).Returns(notifications);

            database.NotificationProvider.Returns(notificationProvider);
            var item = new FakeItem(database: database);
            var args = new GetContentEditorWarningsArgs(item);
            service.CheckForDelegatedArea(Arg.Any<Item>()).Returns(true);

            // Act
            proccessor.Process(args);

            // Assert
            notification.Received().Dismiss(Arg.Any<Item>());
        }
    }
}
