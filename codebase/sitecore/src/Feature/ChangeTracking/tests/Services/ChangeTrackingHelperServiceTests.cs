using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Feature.ChangeTracking.Models;
using easyJet.Feature.ChangeTracking.Services;
using FluentAssertions;
using NSubstitute;
using NSubstitute.Extensions;
using Sitecore.Data;
using Sitecore.Data.Engines.DataCommands;
using Sitecore.Data.Events;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Feature.ChangeTracking.Tests.Services
{
    public class ChangeTrackingHelperServiceTests
    {
        private readonly IChangeTrackingSettingsService changeTrackingSettingsService;
        private readonly IChangeTrackingHelperService sut;
        private AddVersionCommand addVersionCommand;
        private ExecutedEventArgs<AddVersionCommand> addVersionEventArgs;

        public ChangeTrackingHelperServiceTests()
        {
            changeTrackingSettingsService = Substitute.For<IChangeTrackingSettingsService>();
            addVersionCommand = Substitute.ForPartsOf<AddVersionCommand>();
            addVersionEventArgs = Substitute.For<ExecutedEventArgs<AddVersionCommand>>(addVersionCommand);
            sut = new ChangeTrackingHelperService(changeTrackingSettingsService);
        }

        [Theory]
        [AutoData]
        public void GetFieldChanges_ReturnSingleChange(ID templateId)
        {
            // Arrange
            var item = new FakeItem().WithRuntimeSettings().WithTemplate(templateId).WithItemVersions().WithField("test", "valze");

            var changes = new ItemChanges(item);

            changes.SetFieldValue(item.ToSitecoreItem().Fields["test"], "test");
            // Act
            var fieldChanges = sut.GetFieldChanges(changes);

            fieldChanges.Should().HaveCount(1);
        }

        [Theory]
        [AutoData]
        public void GetFieldChanges_ReturnEmpty(ID templateId)
        {
            // Arrange
            var item = new FakeItem().WithRuntimeSettings().WithTemplate(templateId).WithItemVersions().WithField("test", "valze");

            var changes = new ItemChanges(item);

            // Act
            var fieldChanges = sut.GetFieldChanges(changes);

            fieldChanges.Should().HaveCount(0);
        }

        [Theory]
        [AutoData]
        public void GetFieldChanges_DetectRenameChange(ID templateId)
        {
            // Arrange
            var item = new FakeItem().WithRuntimeSettings().WithTemplate(templateId).WithItemVersions().WithField("test", "valze").WithField("__Name", "valze");
            item.WithName("test");
            var changes = new ItemChanges(item);

            changes.SetPropertyValue("name", ID.NewID, ID.NewID);
            // Act
            var result = sut.HasBeenRenamed(changes);

            result.Should().BeTrue();
        }

        [Theory]
        [AutoData]
        public void GetItemByExecutedEventArgsWithCreateItemCommand_ReturnsItem(ID templateId)
        {
            // Arrange
            var item = new FakeItem().WithRuntimeSettings().WithTemplate(templateId).WithItemVersions().WithField("test", "valze").WithField("__Name", "valze");
            item.WithName("test");
            var changes = new ItemChanges(item);

            changes.SetPropertyValue("name", ID.NewID, ID.NewID);

            var createItemCommandLocal = new TestableCreateItemCommand(item);
            var creationEventArgsLocal = Substitute.For<ExecutedEventArgs<CreateItemCommand>>(createItemCommandLocal);

            // Act
            var result = sut.GetItem(creationEventArgsLocal);

            // Assert
            result.Should().BeEquivalentTo(item);
        }

        [Theory]
        [AutoData]
        public void GetItemByExecutedEventArgsWithAddVersionCommand_ReturnsItem(ID templateId)
        {
            // Arrange
            var item = new FakeItem().WithRuntimeSettings().WithTemplate(templateId).WithItemVersions().WithField("test", "valze").WithField("__Name", "valze");
            item.WithName("test");
            var changes = new ItemChanges(item);

            changes.SetPropertyValue("name", ID.NewID, ID.NewID);

            addVersionCommand.Initialize(item);
            // Act
            var result = sut.GetItem(addVersionEventArgs);

            // Assert
            result.Should().BeEquivalentTo(item);
        }

        [Fact]
        public void ShouldTrackFieldChanges_ReturnsTrue_IfNotExcluded()
        {
            var templateId = ID.NewID;
            var fieldId = ID.NewID;

            // Arrange
            var item = new FakeItem().WithRuntimeSettings().WithTemplate(templateId).WithItemVersions();

            var template = new FakeTemplate().WithBaseIDs(new[] { ID.NewID });

            var section = new FakeTemplateSection(template);

            var templateField = new FakeTemplateField(section);

            var field = Substitute.ForPartsOf<Field>(fieldId, item.ToSitecoreItem());

            field.Configure().GetTemplateField().ReturnsForAnyArgs(templateField);

            var changes = Substitute.ForPartsOf<FieldChange>(field, "dfgdfg", "fgd");
            changeTrackingSettingsService.GetSettings().ReturnsForAnyArgs(new ChangeTrackingSettings { IsEnabled = true, Templates = new HashSet<ID>() { ID.NewID, ID.NewID } });

            // Act
            var result = sut.ShouldTrackFieldChanges(changes);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public void ShouldTrackFieldChanges_ReturnsFalse_IfExcluded()
        {
            var templateId = ID.NewID;
            var fieldId = ID.NewID;

            // Arrange
            var item = new FakeItem().WithRuntimeSettings().WithTemplate(templateId).WithItemVersions();

            var template = new FakeTemplate().WithBaseIDs(new[] { ID.NewID });

            var section = new FakeTemplateSection(template);

            var templateField = new FakeTemplateField(section);

            var field = Substitute.ForPartsOf<Field>(fieldId, item.ToSitecoreItem());

            field.Configure().GetTemplateField().ReturnsForAnyArgs(templateField);

            var changes = Substitute.ForPartsOf<FieldChange>(field, "dfgdfg", "fgd");
            changeTrackingSettingsService.GetSettings().ReturnsForAnyArgs(new ChangeTrackingSettings { IsEnabled = true, Templates = new HashSet<ID>() { ID.NewID }, ExcludedFields = new HashSet<ID>() { fieldId } });

            // Act
            var result = sut.ShouldTrackFieldChanges(changes);

            // Assert
            result.Should().BeFalse();
        }

        private class TestableCreateItemCommand : CreateItemCommand
        {
            public TestableCreateItemCommand(Item result)
            {
                var info = typeof(CreateItemCommand).GetProperty("Result");
                info.SetValue(this, result);
            }
        }
    }
}
