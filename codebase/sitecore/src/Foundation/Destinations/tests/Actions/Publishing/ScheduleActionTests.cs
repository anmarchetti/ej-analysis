using System;
using System.Linq;
using System.Web.Mvc;
using AutoFixture;
using easyJet.Foundation.Destinations.Actions.Publishing;
using easyJet.Foundation.Destinations.Logging;
using FluentAssertions;
using NSubstitute;
using Sitecore.Collections;
using Sitecore.Configuration;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Sitecore.Workflows.Simple;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Actions.Publishing
{
    public class ScheduleActionTests
    {
        private readonly IDependencyResolver resolver;
        private readonly IDestinationsLogger logger;

        private readonly Fixture fixture;
        private readonly Db db;

        private readonly ScheduleAction action;

        public ScheduleActionTests()
        {
            resolver = Substitute.For<IDependencyResolver>();

            logger = Substitute.For<IDestinationsLogger>();
            resolver.GetService(typeof(IDestinationsLogger)).Returns(logger);

            DependencyResolver.SetResolver(resolver);

            fixture = new Fixture();
            db = fixture.Freeze<Db>();

            action = new ScheduleAction();
        }

        [Fact]
        public void Process_ShouldCreateQueueItem_IfScheduleITimeExist()
        {
            // Arrange
            var sourceItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            db.Add(sourceItem);

            var queueFolder = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            db.Add(queueFolder);

            var workflowScheduleQueueFolderPath = queueFolder.FullPath;
            var queueElementTemplate = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            queueElementTemplate.TemplateID = Constants.TemplateIds.SchedulePublishQueue;

            queueElementTemplate.Fields.Add(new DbField(Constants.Fields.SchedulePublishQueue.PublishItemId));
            queueElementTemplate.Fields.Add(new DbField(Constants.Fields.SchedulePublishQueue.PublishItemPath));
            queueElementTemplate.Fields.Add(new DbField(Constants.Fields.SchedulePublishQueue.PublishScheduleDate));

            db.Add(queueElementTemplate);

            var scheduleDateTime = "20200513T082800Z";

            var commentFields = new StringDictionary();
            commentFields.Add(Constants.Fields.Schedule.ScheduleDateTime, scheduleDateTime);

            var args = new WorkflowPipelineArgs(db.GetItem(sourceItem.ID), commentFields, null);

            var fakeSite = new FakeSiteContext(
                new StringDictionary
                    {
                        { "name", "website" },
                        { "database", "master" }
                    });

            // Act
            using (new FakeSiteContextSwitcher(fakeSite))
            using (new SettingsSwitcher("Destinations.WorkflowScheduleQueueFolderPath", workflowScheduleQueueFolderPath))
            {
                action.Process(args);

                var sourceItemSitecore = db.GetItem(sourceItem.ID);
                var actual = db.GetItem(queueFolder.ID).Children.FirstOrDefault();

                // Assert
                actual.Fields[Constants.Fields.SchedulePublishQueue.PublishItemId].Value.Should().Be(sourceItemSitecore.ID.ToString());
                actual.Fields[Constants.Fields.SchedulePublishQueue.PublishItemPath].Value.Should().Be(sourceItemSitecore.Paths.Path);
                actual.Fields[Constants.Fields.SchedulePublishQueue.PublishScheduleDate].Value.Should().Be(scheduleDateTime);
            }
        }

        [Fact]
        public void Process_ShouldCallErrorMethod_IfEditingFault()
        {
            // Arrange
            var sourceItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            db.Add(sourceItem);

            var queueFolder = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            db.Add(queueFolder);

            var workflowScheduleQueueFolderPath = queueFolder.FullPath;
            var queueElementTemplate = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            queueElementTemplate.TemplateID = Constants.TemplateIds.SchedulePublishQueue;

            db.Add(queueElementTemplate);

            var scheduleDateTime = "20200513T082800Z";

            var commentFields = new StringDictionary();
            commentFields.Add(Constants.Fields.Schedule.ScheduleDateTime, scheduleDateTime);

            var args = new WorkflowPipelineArgs(db.GetItem(sourceItem.ID), commentFields, null);

            logger.Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());

            var fakeSite = new FakeSiteContext(
                new StringDictionary
                    {
                        { "name", "website" },
                        { "database", "master" }
                    });

            // Act
            using (new FakeSiteContextSwitcher(fakeSite))
            using (new SettingsSwitcher("Destinations.WorkflowScheduleQueueFolderPath", workflowScheduleQueueFolderPath))
            {
                action.Process(args);

                // Assert
                logger.Received(1).Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            }
        }

        [Fact]
        public void Process_ShouldCallInfoMethod_IfScheduleTimeNull()
        {
            // Arrange
            var sourceItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            db.Add(sourceItem);

            var commentFields = new StringDictionary();
            commentFields.Add(Constants.Fields.Schedule.ScheduleDateTime, null);

            var args = new WorkflowPipelineArgs(db.GetItem(sourceItem.ID), commentFields, null);

            var fakeSite = new FakeSiteContext(
                new StringDictionary
                    {
                        { "name", "website" },
                        { "database", "master" }
                    });

            logger.Info(Arg.Any<string>(), Arg.Any<object>());

            // Act
            using (new FakeSiteContextSwitcher(fakeSite))
            {
                action.Process(args);

                // Assert
                logger.Received(2).Info(Arg.Any<string>(), Arg.Any<object>());
            }
        }
    }
}
