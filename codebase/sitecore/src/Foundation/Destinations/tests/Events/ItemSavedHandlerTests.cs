using System.Collections.Generic;
using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Events;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Testing.Extensions;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.Events;
using Sitecore.FakeDb;
using Xunit;
using SitecoreExtensionsConstants = easyJet.Foundation.SitecoreExtensions.Constants;

namespace easyJet.Foundation.Destinations.Tests.Events
{
    public class ItemSavedHandlerTests
    {
        private readonly Fixture fixture;
        private readonly Db db;
        private readonly IDestinationsLogger logger;
        private readonly DestinationItemEventHandler handler;

        public ItemSavedHandlerTests()
        {
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
            logger = Substitute.For<IDestinationsLogger>();
            handler = new DestinationItemEventHandler(logger);
        }

        [Theory]
        [MemberData(nameof(ValidTemplates))]
        public void OnItemSaved_FieldsShouldBeEqual_IfValidTemplate(ID templateId)
        {
            // Arrange
            var itemDb = new DbItem("Spain");
            itemDb.TemplateID = templateId;
            itemDb.Fields.Add(Constants.Fields.DatasourceItem.Name, "Fake");
            itemDb.Fields.Add(Constants.Fields.StandardFields.DisplayName);
            db.Add(itemDb);
            var item = db.GetItem(itemDb.ID);
            var args = new SitecoreEventArgs("OnItemSaving", new object[] { item, new ItemChanges(item) }, new EventResult());

            // Act
            item.Editing.BeginEdit();
            handler.OnItemSaving(null, args);
            item.Editing.EndEdit();

            // Assert
            item[Constants.Fields.DatasourceItem.Name].Should().BeEquivalentTo(item[Constants.Fields.StandardFields.DisplayName]);
        }

        [Theory]
        [MemberData(nameof(ValidTemplates))]
        public void OnItemSaved_DisplayNameShouldBeNull_IfNameNotExist(ID templateId)
        {
            // Arrange
            var itemDb = new DbItem("Spain");
            itemDb.TemplateID = templateId;
            itemDb.Fields.Add(Constants.Fields.StandardFields.DisplayName);
            db.Add(itemDb);
            var item = db.GetItem(itemDb.ID);
            var args = new SitecoreEventArgs("OnItemSaving", new object[] { item, new ItemChanges(item) }, new EventResult());

            // Act
            item.Editing.BeginEdit();
            handler.OnItemSaving(null, args);
            item.Editing.EndEdit();

            // Assert
            item[Constants.Fields.StandardFields.DisplayName].Should().BeNullOrEmpty();
        }

        [Theory]
        [MemberData(nameof(ValidTemplates))]
        public void OnItemSaved_RemoveTrailingSpacesFromCodeField(ID templateId)
        {
            // Arrange
            var itemDb = new DbItem("Spain");
            itemDb.TemplateID = templateId;
            itemDb.Fields.Add(Constants.Fields.StandardFields.DisplayName);
            itemDb.Fields.Add(Constants.Fields.DatasourceItem.Code, "code ");
            db.Add(itemDb);

            var item = db.GetItem(itemDb.ID);
            var changes = new ItemChanges(item);
            var fieldChanges = new FieldChangeList
            {
                [Constants.FieldsIds.DatasourceItem.Code] = new FieldChange(new Field(Constants.FieldsIds.DatasourceItem.Code, item), "code ")
            };
            changes.ForceSetFieldValue("_fieldChanges", fieldChanges);
            var args = new SitecoreEventArgs("OnItemSaving", new object[] { item, changes }, new EventResult());

            // Act
            item.Editing.BeginEdit();
            handler.OnItemSaving(null, args);
            item.Editing.EndEdit();

            // Assert
            item[Constants.Fields.StandardFields.DisplayName].Should().BeNullOrEmpty();
            item[Constants.Fields.DatasourceItem.Code].Should().Be("code");
        }

        [Fact]
        public void OnItemSaved_FieldsShouldNotBeEqual_IfNoItemInArgs()
        {
            // Arrange
            var itemDb = new DbItem("Spain");
            itemDb.Fields.Add(Constants.Fields.DatasourceItem.Name, "Fake");
            itemDb.Fields.Add(Constants.Fields.StandardFields.DisplayName);

            db.Add(itemDb);
            var item = db.GetItem(itemDb.ID);

            // Act
            handler.OnItemSaving(null, new SitecoreEventArgs("Fake", new object[] { null }, new EventResult()));

            // Assert
            item[Constants.Fields.DatasourceItem.Name].Should().NotBe(item[Constants.Fields.StandardFields.DisplayName]);
        }

        [Theory]
        [AutoData]
        public void OnItemSaved_ShouldClearPreviousVersionStates_IfVersionsMoreThanOne(ID id, object sender)
        {
            // Arrange
            var hotelItem = new DbItem("HotelItem", id, Constants.TemplateIds.Accommodation);

            var workflowState = new DbField(SitecoreExtensionsConstants.Fields.Common.WorkflowState)
            {
                Value = id.ToString()
            };

            hotelItem.Fields.Add(workflowState);

            hotelItem.AddVersion("en");
            db.Add(hotelItem);

            var args = new SitecoreEventArgs("OnItemPublished", new object[] { db.GetItem(hotelItem.ID) }, new EventResult());

            // Act
            handler.OnVersionAdded(sender, args);
            var actual = db.GetItem(hotelItem.ID)[SitecoreExtensionsConstants.Fields.Common.WorkflowState];

            // Assert
            actual.Should().BeEmpty();
        }

        public static IEnumerable<object[]> ValidTemplates
        {
            get
            {
                return new[]
                {
                    new object[] { Constants.TemplateIds.Country },
                    new object[] { Constants.TemplateIds.Location },
                    new object[] { Constants.TemplateIds.Resort },
                    new object[] { Constants.TemplateIds.Accommodation }
                };
            }
        }
    }
}