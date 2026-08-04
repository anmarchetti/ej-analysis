using System.Collections.Generic;
using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Events;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Tests.Infrastructures;
using FluentAssertions;
using NSubstitute;
using Sitecore;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Events;
using Sitecore.FakeDb;
using Sitecore.SecurityModel;
using Sitecore.Workflows;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Events
{
    public class HotelChildrenItemsEventHandlerTests
    {
        private readonly Fixture fixture;
        private readonly Db db;
        private readonly IDestinationsLogger logger;
        private readonly IWorkflowProvider workflowProvider;
        private readonly IWorkflow workflow;
        private readonly HotelChildrenItemsEventHandler handler;

        public HotelChildrenItemsEventHandlerTests()
        {
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
            workflowProvider = Substitute.For<IWorkflowProvider>();
            workflow = Substitute.For<IWorkflow>();
            logger = Substitute.For<IDestinationsLogger>();
            handler = new HotelChildrenItemsEventHandler(logger);
        }

        [Theory]
        [MemberData(nameof(ValidStatesTemplates))]
        public void OnItemSaved_ShouldChangeWorkflowState_IfItemStateHasAppropriateState(ID templateId, ID workflowStateId)
        {
            // Arrange
            WorkflowState workflowState;

            if (workflowStateId.Equals(Constants.WorkflowsStateIds.DestinationsWorkflowApprovedId))
            {
                workflowState = new WorkflowState(workflowStateId.ToString(), "fakeworkflow", "fakeworkflowicon", true);
                workflow.IsApproved(Arg.Any<Item>()).Returns(true);
            }
            else
            {
                workflowState = new WorkflowState(workflowStateId.ToString(), "fakeworkflow", "fakeworkflowicon", false);
            }

            workflow.GetState(Arg.Any<Item>()).Returns(workflowState);

            workflowProvider.GetWorkflow(Arg.Any<Item>()).Returns(workflow);

            var hotelItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            hotelItem.TemplateID = Constants.TemplateIds.Accommodation;

            var hotelItemWorkflowStateField = new DbField(FieldIDs.WorkflowState)
            {
                Value = Constants.WorkflowsStateIds.DestinationsWorkflowDraftId.ToString()
            };

            hotelItem.Fields.Add(hotelItemWorkflowStateField);

            ID fieldId = ID.NewID;
            var childItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            childItem.TemplateID = templateId;
            childItem.Fields.Add(new DbField("Field", fieldId));

            hotelItem.Children.Add(childItem);

            var fakeContext = new Sitecore.FakeDb.Sites.FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                    {
                        { "name", "fake" },
                        { "database", "master" }
                    });

            fakeContext.Database.WorkflowProvider = workflowProvider;

            db.Add(new AccommodationTemplate("Hotel template"));
            db.Add(hotelItem);

            var sv = db.GetItem(hotelItem.ID).Template.CreateStandardValues();

            using (new SecurityDisabler())
            {
                sv.Editing.BeginEdit();
                sv.Fields[FieldIDs.DefaultWorkflow].Value = Constants.DestinationsWorkflowId.ToString();
                sv.Editing.EndEdit();
            }

            var item = db.GetItem(childItem.ID);
            var itemChanges = new ItemChanges(item);
            itemChanges.SetFieldValue(new Sitecore.Data.Fields.Field(fieldId, item), "Test data");

            // Act
            using (new Sitecore.FakeDb.Sites.FakeSiteContextSwitcher(fakeContext))
            {
                var args = new SitecoreEventArgs("name", new object[] { item, itemChanges }, new EventResult());

                using (new SecurityDisabler())
                {
                    handler.OnItemSaved(null, args);

                    // Assert
                    if (workflowStateId.Equals(Constants.WorkflowsStateIds.DestinationsWorkflowApprovedId))
                    {
                        workflow.Received(1).Start(Arg.Any<Item>());
                    }
                    else if (workflowStateId.Equals(Constants.WorkflowsStateIds.DestinationsWorkflowEditingId))
                    {
                        var actual = hotelItem.Fields[FieldIDs.WorkflowState].Value;
                        actual.Should().Be(Constants.WorkflowsStateIds.DestinationsWorkflowDraftId.ToString());
                    }
                    else
                    {
                        var actual = hotelItem.Fields[FieldIDs.WorkflowState].Value;
                        actual.Should().Be(Constants.WorkflowsStateIds.DestinationsWorkflowDraftId.ToString());
                    }
                }
            }
        }

        [Theory]
        [AutoData]
        public void OnItemSaved_ShouldNotChangeWorkflowState_IfChangedItemNotAccommodation(ID templateId, ID workflowStateId)
        {
            // Arrange
            var childItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            childItem.TemplateID = templateId;

            var workFlowStateField = new DbField(FieldIDs.WorkflowState)
            {
                Value = workflowStateId.ToString()
            };

            childItem.Fields.Add(workFlowStateField);

            db.Add(childItem);

            var args = new SitecoreEventArgs("name", new object[] { db.GetItem(childItem.ID) }, new EventResult());

            // Act
            handler.OnItemSaved(null, args);
            var actual = childItem.Fields[FieldIDs.WorkflowState].Value;

            // Assert
            actual.Should().BeSameAs(workflowStateId.ToString());
        }

        [Theory]
        [AutoData]
        public void OnItemSaved_ShouldNotChangeWorkflowState_IfChangedItemNotExist(ID templateId, ID workflowStateId)
        {
            // Arrange
            var childItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            childItem.TemplateID = templateId;

            var workFlowStateField = new DbField(FieldIDs.WorkflowState)
            {
                Value = workflowStateId.ToString()
            };

            childItem.Fields.Add(workFlowStateField);

            db.Add(childItem);

            var args = new SitecoreEventArgs("name", new object[] { "fakeobject" }, new EventResult());

            // Act
            handler.OnItemSaved(null, args);
            var actual = childItem.Fields[FieldIDs.WorkflowState].Value;

            // Assert
            actual.Should().BeSameAs(workflowStateId.ToString());
        }

        [Theory]
        [MemberData(nameof(ValidStatesTemplatesSheduledState))]
        public void OnItemSaved_ShouldAddWarnLog_IfItemWorkflowSheduledState(ID templateId, ID workflowStateId)
        {
            ID fieldId = ID.NewID;
            var childItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            childItem.TemplateID = templateId;
            childItem.Fields.Add(new DbField("Field", fieldId));

            var hotelItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            hotelItem.TemplateID = Constants.TemplateIds.Accommodation;

            var hotelItemWorkflowStateField = new DbField(FieldIDs.WorkflowState)
            {
                Value = workflowStateId.ToString()
            };

            hotelItem.Fields.Add(hotelItemWorkflowStateField);

            hotelItem.Children.Add(childItem);

            db.Add(new AccommodationTemplate("Hotel template"));
            db.Add(hotelItem);

            var sv = db.GetItem(hotelItem.ID).Template.CreateStandardValues();

            using (new SecurityDisabler())
            {
                sv.Editing.BeginEdit();
                sv.Fields[FieldIDs.DefaultWorkflow].Value = Constants.DestinationsWorkflowId.ToString();
                sv.Editing.EndEdit();
            }

            logger.Warn(Arg.Any<string>(), Arg.Any<object>());

            WorkflowState workflowState;

            workflowState = new WorkflowState(workflowStateId.ToString(), "fakeworkflow", "fakeworkflowicon", false);

            workflow.GetState(Arg.Any<Item>()).Returns(workflowState);

            workflowProvider.GetWorkflow(Arg.Any<Item>()).Returns(workflow);

            var item = db.GetItem(childItem.ID);
            var itemChanges = new ItemChanges(item);
            itemChanges.SetFieldValue(new Sitecore.Data.Fields.Field(fieldId, item), "Test data");

            var args = new SitecoreEventArgs("name", new object[] { item, itemChanges }, new EventResult());

            // Act
            var fakeContext = new Sitecore.FakeDb.Sites.FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                    {
                        { "name", "fake" },
                        { "database", "master" }
                    });

            fakeContext.Database.WorkflowProvider = workflowProvider;

            using (new Sitecore.FakeDb.Sites.FakeSiteContextSwitcher(fakeContext))
            {
                using (new SecurityDisabler())
                {
                    handler.OnItemSaved(null, args);
                }
            }

            // Assert
            logger.Received(1).Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void OnItemSaved_ShouldCreateNewVersionOfAccommodationItem_IfItemVersionIsFirst()
        {
            // Arrange
            ID fieldId = ID.NewID;
            var childItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            childItem.TemplateID = Constants.TemplateIds.AccommodationRoom;
            childItem.Fields.Add(new DbField("Field", fieldId));

            var hotelItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            hotelItem.TemplateID = Constants.TemplateIds.Accommodation;

            hotelItem.Children.Add(childItem);

            db.Add(new AccommodationTemplate("Hotel template"));
            db.Add(hotelItem);

            db.GetItem(hotelItem.ID).Template.CreateStandardValues();

            var item = db.GetItem(childItem.ID);
            var itemChanges = new ItemChanges(item);
            itemChanges.SetFieldValue(new Sitecore.Data.Fields.Field(fieldId, item), "Test data");

            // Act
            var args = new SitecoreEventArgs("name", new object[] { item, itemChanges }, new EventResult());

            using (new SecurityDisabler())
            {
                handler.OnItemSaved(null, args);
            }

            var actual = db.GetItem(hotelItem.ID).Version.Number;

            // Assert
            actual.Should().Be(2);
        }

        public static IEnumerable<object[]> ValidStatesTemplates
        {
            get
            {
                return new[]
                {
                    new object[] { Constants.TemplateIds.AccommodationRoom,  Constants.WorkflowsStateIds.DestinationsWorkflowEditingId },
                    new object[] { Constants.TemplateIds.SitecoreImage, Constants.WorkflowsStateIds.DestinationsWorkflowEditingId },
                    new object[] { Constants.TemplateIds.ExternalImage, Constants.WorkflowsStateIds.DestinationsWorkflowEditingId },
                    new object[] { Constants.TemplateIds.AccommodationFacility, Constants.WorkflowsStateIds.DestinationsWorkflowEditingId },
                    new object[] { Constants.TemplateIds.AccommodationBoard, Constants.WorkflowsStateIds.DestinationsWorkflowEditingId },
                    new object[] { Constants.TemplateIds.RoomFacility, Constants.WorkflowsStateIds.DestinationsWorkflowEditingId },

                    new object[] { Constants.TemplateIds.AccommodationRoom,  Constants.WorkflowsStateIds.DestinationsWorkflowDraftId },
                    new object[] { Constants.TemplateIds.SitecoreImage, Constants.WorkflowsStateIds.DestinationsWorkflowDraftId },
                    new object[] { Constants.TemplateIds.ExternalImage, Constants.WorkflowsStateIds.DestinationsWorkflowDraftId },
                    new object[] { Constants.TemplateIds.AccommodationFacility, Constants.WorkflowsStateIds.DestinationsWorkflowDraftId },
                    new object[] { Constants.TemplateIds.AccommodationBoard, Constants.WorkflowsStateIds.DestinationsWorkflowDraftId },
                    new object[] { Constants.TemplateIds.RoomFacility, Constants.WorkflowsStateIds.DestinationsWorkflowDraftId },

                    new object[] { Constants.TemplateIds.AccommodationRoom,  Constants.WorkflowsStateIds.DestinationsWorkflowPendingApprovalId },
                    new object[] { Constants.TemplateIds.SitecoreImage, Constants.WorkflowsStateIds.DestinationsWorkflowPendingApprovalId },
                    new object[] { Constants.TemplateIds.ExternalImage, Constants.WorkflowsStateIds.DestinationsWorkflowPendingApprovalId },
                    new object[] { Constants.TemplateIds.AccommodationFacility, Constants.WorkflowsStateIds.DestinationsWorkflowPendingApprovalId },
                    new object[] { Constants.TemplateIds.AccommodationBoard, Constants.WorkflowsStateIds.DestinationsWorkflowPendingApprovalId },
                    new object[] { Constants.TemplateIds.RoomFacility, Constants.WorkflowsStateIds.DestinationsWorkflowPendingApprovalId },

                    new object[] { Constants.TemplateIds.AccommodationRoom,  Constants.WorkflowsStateIds.DestinationsWorkflowApprovedId },
                    new object[] { Constants.TemplateIds.SitecoreImage, Constants.WorkflowsStateIds.DestinationsWorkflowApprovedId },
                    new object[] { Constants.TemplateIds.ExternalImage, Constants.WorkflowsStateIds.DestinationsWorkflowApprovedId },
                    new object[] { Constants.TemplateIds.AccommodationFacility, Constants.WorkflowsStateIds.DestinationsWorkflowApprovedId },
                    new object[] { Constants.TemplateIds.AccommodationBoard, Constants.WorkflowsStateIds.DestinationsWorkflowApprovedId },
                    new object[] { Constants.TemplateIds.RoomFacility, Constants.WorkflowsStateIds.DestinationsWorkflowApprovedId },

                    new object[] { Constants.TemplateIds.AccommodationRoom,  Constants.WorkflowsStateIds.DestinationsWorkflowRejectedId },
                    new object[] { Constants.TemplateIds.SitecoreImage, Constants.WorkflowsStateIds.DestinationsWorkflowRejectedId },
                    new object[] { Constants.TemplateIds.ExternalImage, Constants.WorkflowsStateIds.DestinationsWorkflowRejectedId },
                    new object[] { Constants.TemplateIds.AccommodationFacility, Constants.WorkflowsStateIds.DestinationsWorkflowRejectedId },
                    new object[] { Constants.TemplateIds.AccommodationBoard, Constants.WorkflowsStateIds.DestinationsWorkflowRejectedId },
                    new object[] { Constants.TemplateIds.RoomFacility, Constants.WorkflowsStateIds.DestinationsWorkflowRejectedId }
                };
            }
        }

        public static IEnumerable<object[]> ValidStatesTemplatesSheduledState
        {
            get
            {
                return new[]
                {
                    new object[] { Constants.TemplateIds.AccommodationRoom,  Constants.WorkflowsStateIds.DestinationsWorkflowScheduledId },
                    new object[] { Constants.TemplateIds.SitecoreImage, Constants.WorkflowsStateIds.DestinationsWorkflowScheduledId },
                    new object[] { Constants.TemplateIds.ExternalImage, Constants.WorkflowsStateIds.DestinationsWorkflowScheduledId },
                    new object[] { Constants.TemplateIds.AccommodationFacility, Constants.WorkflowsStateIds.DestinationsWorkflowScheduledId },
                    new object[] { Constants.TemplateIds.AccommodationBoard, Constants.WorkflowsStateIds.DestinationsWorkflowScheduledId },
                    new object[] { Constants.TemplateIds.RoomFacility, Constants.WorkflowsStateIds.DestinationsWorkflowScheduledId }
                };
            }
        }
    }
}
