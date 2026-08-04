using System;
using System.Collections.Generic;
using System.Data.Entity.Core;
using System.Data.SqlClient;
using AutoFixture.Xunit2;
using easyJet.Feature.ChangeTracking.Logging;
using easyJet.Feature.ChangeTracking.Models;
using easyJet.Feature.ChangeTracking.Services;
using FluentAssertions;
using NSubstitute;
using NSubstitute.Extensions;
using Sitecore.Data;
using Sitecore.Data.Engines.DataCommands;
using Sitecore.Data.Events;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Xunit;
using FieldChange = Sitecore.Data.Items.FieldChange;
using Item = Sitecore.Data.Items.Item;

namespace easyJet.Feature.ChangeTracking.Tests.Services
{
    public class ChangeTrackingTrackerServiceTests
    {
        private readonly IChangeTrackingSettingsService changeTrackingSettingsService;
        private readonly IChangeTrackingStoreService changeTrackingStoreService;
        private readonly IChangeTrackingHelperService changeTrackingHelperService;
        private readonly IChangeTrackingLogger logger;
        private readonly ChangeTrackingTrackerService sut;

        private ExecutingEventArgs<SaveItemCommand> executingEventArgs;
        private SaveItemCommand saveItemCommand;
        private CreateItemCommand createItemCommand;
        private ExecutedEventArgs<CreateItemCommand> creationEventArgs;
        private AddVersionCommand addVersionCommand;
        private ExecutedEventArgs<AddVersionCommand> addVersionEventArgs;

        public ChangeTrackingTrackerServiceTests()
        {
            changeTrackingStoreService = Substitute.For<IChangeTrackingStoreService>();
            changeTrackingSettingsService = Substitute.For<IChangeTrackingSettingsService>();
            saveItemCommand = Substitute.ForPartsOf<SaveItemCommand>();
            executingEventArgs = Substitute.For<ExecutingEventArgs<SaveItemCommand>>(saveItemCommand);

            createItemCommand = Substitute.ForPartsOf<CreateItemCommand>();
            creationEventArgs = Substitute.For<ExecutedEventArgs<CreateItemCommand>>(createItemCommand);
            changeTrackingHelperService = Substitute.For<IChangeTrackingHelperService>();
            logger = Substitute.For<IChangeTrackingLogger>();

            sut = Substitute.ForPartsOf<ChangeTrackingTrackerService>(changeTrackingStoreService, changeTrackingSettingsService, changeTrackingHelperService, logger);
        }

        [Fact]
        public void ItemSaving_ExitIfItemIsNotTracked()
        {
            // Arrange
            var item = new FakeItem().WithRuntimeSettings();
            saveItemCommand = Substitute.ForPartsOf<SaveItemCommand>();
            saveItemCommand.Initialize(item);
            executingEventArgs = Substitute.For<ExecutingEventArgs<SaveItemCommand>>(saveItemCommand);
            sut.When(i => i.IsTracked(item)).DoNotCallBase();
            sut.IsTracked(item).Returns(false);
            saveItemCommand.Changes.Returns(new ItemChanges(item));
            changeTrackingSettingsService.GetSettings().Returns(new ChangeTrackingSettings { IsEnabled = true, Templates = new HashSet<ID>() { ID.NewID } });

            // Act
            sut.ItemSaving(executingEventArgs);

            changeTrackingStoreService.DidNotReceiveWithAnyArgs().AddFieldChanges(Arg.Any<List<Feature.ChangeTracking.Models.ChangeTrackingFieldChange>>());
        }

        [Fact]
        public void ISTrackedReturnFalse_IsDisabled()
        {
            // Arrange
            var item = new FakeItem().WithRuntimeSettings();
            changeTrackingSettingsService.GetSettings().Returns(new ChangeTrackingSettings { IsEnabled = false, Templates = new HashSet<ID>() { ID.NewID } });

            // Act
            var result = sut.IsTracked(item);

            result.Should().BeFalse();
        }

        [Fact]
        public void ItemSaving_ExitIfDisabled()
        {
            changeTrackingSettingsService.GetSettings().Returns(new ChangeTrackingSettings { IsEnabled = false, Templates = new HashSet<ID>() { ID.NewID } });
            // Act
            sut.ItemSaving(executingEventArgs);

            changeTrackingStoreService.DidNotReceiveWithAnyArgs().AddFieldChanges(Arg.Any<List<Feature.ChangeTracking.Models.ChangeTrackingFieldChange>>());
        }

        [Theory]
        [AutoData]
        public void ItemSaving_AddFieldChangesToHistoryStore_IfItemIsNotTracked(ID templateId)
        {
            // Arrange
            var item = new FakeItem().WithRuntimeSettings().WithTemplate(templateId).WithItemVersions().WithField("test", "valze");
            var fieldChanges = new List<FieldChange> { Substitute.For<FieldChange>(item.ToSitecoreItem().Fields["test"], "df") };
            saveItemCommand = Substitute.ForPartsOf<SaveItemCommand>();
            saveItemCommand.Initialize(item);
            executingEventArgs = Substitute.For<ExecutingEventArgs<SaveItemCommand>>(saveItemCommand);
            saveItemCommand.Changes.Returns(new ItemChanges(item));
            changeTrackingSettingsService.GetSettings().Returns(new ChangeTrackingSettings { IsEnabled = true, Templates = new HashSet<ID>() { templateId } });
            changeTrackingHelperService.GetFieldChanges(Arg.Any<ItemChanges>()).Returns(fieldChanges);
            changeTrackingHelperService.ShouldTrackFieldChanges(Arg.Any<FieldChange>()).Returns(true);
            // Act
            sut.ItemSaving(executingEventArgs);

            changeTrackingStoreService.ReceivedWithAnyArgs().AddFieldChanges(Arg.Any<List<Feature.ChangeTracking.Models.ChangeTrackingFieldChange>>());
        }

        [Theory]
        [AutoData]
        public void ItemSaving_AddItemRenamedToHistoryStore_IfItemIsNotTracked(ID templateId)
        {
            // Arrange
            var item = new FakeItem().WithRuntimeSettings().WithTemplate(templateId).WithItemVersions().WithField("test", "valze");
            var fieldChanges = new List<FieldChange> { Substitute.For<FieldChange>(item.ToSitecoreItem().Fields["test"], "df") };
            saveItemCommand = Substitute.ForPartsOf<SaveItemCommand>();
            saveItemCommand.Initialize(item);
            var changes = Substitute.For<ItemChanges>(item.ToSitecoreItem());
            saveItemCommand.Changes.Returns(changes);
            executingEventArgs = Substitute.For<ExecutingEventArgs<SaveItemCommand>>(saveItemCommand);
            saveItemCommand.Changes.Returns(new ItemChanges(item));
            changeTrackingSettingsService.GetSettings().Returns(new ChangeTrackingSettings { IsEnabled = true, Templates = new HashSet<ID>() { templateId } });
            changeTrackingHelperService.ShouldTrackFieldChanges(Arg.Any<FieldChange>()).Returns(true);
            changeTrackingHelperService.HasBeenRenamed(Arg.Any<ItemChanges>()).Returns(true);
            changeTrackingHelperService.GetFieldChanges(Arg.Any<ItemChanges>()).Returns(fieldChanges);

            // Act
            sut.ItemSaving(executingEventArgs);

            changeTrackingStoreService.ReceivedWithAnyArgs().AddItemRenamed(item, Arg.Any<string>(), Arg.Any<string>());
        }

        [Fact]
        public void ItemSaving_Exit_WhenThrowsSQLException()
        {
            // Arrange
            changeTrackingSettingsService.Configure().When(i => i.GetSettings()).Do(i => new SqlConnection("Server=pleasethrow;Database=anexception;Connection Timeout=1").Open());

            // Act
            sut.ItemSaving(executingEventArgs);

            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            changeTrackingStoreService.DidNotReceive().AddItemRenamed(Arg.Any<Item>(), Arg.Any<string>(), Arg.Any<string>());
        }

        [Fact]
        public void ItemSaving_Exit_WhenThrowsEntityCommandExecutionException()
        {
            // Arrange
            changeTrackingSettingsService.Configure().When(i => i.GetSettings()).Throw<EntityCommandExecutionException>();

            // Act
            sut.ItemSaving(executingEventArgs);

            logger.Received().Error(Arg.Any<string>(), Arg.Any<EntityCommandExecutionException>(), Arg.Any<object>());
            changeTrackingStoreService.DidNotReceive().AddItemRenamed(Arg.Any<Item>(), Arg.Any<string>(), Arg.Any<string>());
        }

        [Fact]
        public void ItemSaving_Exit_WhenThrowsException()
        {
            // Arrange
            changeTrackingSettingsService.Configure().When(i => i.GetSettings()).Do(i => throw new Exception());

            // Act
            sut.ItemSaving(executingEventArgs);

            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            changeTrackingStoreService.DidNotReceive().AddItemRenamed(Arg.Any<Item>(), Arg.Any<string>(), Arg.Any<string>());
        }

        [Fact]
        public void ItemCreated_Exit_WhenThrowsSQLException()
        {
            // Arrange
            changeTrackingSettingsService.Configure().When(i => i.GetSettings()).Do(i => new SqlConnection("Server=pleasethrow;Database=anexception;Connection Timeout=1").Open());

            // Act
            sut.ItemCreated(creationEventArgs);

            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            changeTrackingStoreService.DidNotReceive().AddItemRenamed(Arg.Any<Item>(), Arg.Any<string>(), Arg.Any<string>());
        }

        [Fact]
        public void ItemCreated_Exit_WhenThrowsException()
        {
            // Arrange
            changeTrackingSettingsService.Configure().When(i => i.GetSettings()).Do(i => throw new Exception());

            // Act
            sut.ItemCreated(creationEventArgs);

            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            changeTrackingStoreService.DidNotReceive().AddItemRenamed(Arg.Any<Item>(), Arg.Any<string>(), Arg.Any<string>());
        }

        [Fact]
        public void ItemCreated_Exit_WhenThrowsEntityCommandExecutionException()
        {
            // Arrange
            changeTrackingSettingsService.Configure().When(i => i.GetSettings()).Throw<EntityCommandExecutionException>();

            // Act
            sut.ItemCreated(creationEventArgs);

            logger.Received().Error(Arg.Any<string>(), Arg.Any<EntityCommandExecutionException>(), Arg.Any<object>());
            changeTrackingStoreService.DidNotReceive().AddItemRenamed(Arg.Any<Item>(), Arg.Any<string>(), Arg.Any<string>());
        }

        [Fact]
        public void VersionAdded_Exit_WhenThrowsSQLException()
        {
            // Arrange
            changeTrackingSettingsService.Configure().When(i => i.GetSettings()).Do(i => new SqlConnection("Server=pleasethrow;Database=anexception;Connection Timeout=1").Open());

            // Act
            sut.VersionAdded(addVersionEventArgs);

            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            changeTrackingStoreService.DidNotReceive().AddItemRenamed(Arg.Any<Item>(), Arg.Any<string>(), Arg.Any<string>());
        }

        [Fact]
        public void VersionAdded_Exit_WhenThrowsEntityCommandExecutionException()
        {
            // Arrange
            changeTrackingSettingsService.Configure().When(i => i.GetSettings()).Throw<EntityCommandExecutionException>();

            // Act
            sut.VersionAdded(addVersionEventArgs);

            logger.Received().Error(Arg.Any<string>(), Arg.Any<EntityCommandExecutionException>(), Arg.Any<object>());
            changeTrackingStoreService.DidNotReceive().AddItemRenamed(Arg.Any<Item>(), Arg.Any<string>(), Arg.Any<string>());
        }

        [Fact]
        public void VersionAdded_Exit_WhenThrowsException()
        {
            // Arrange
            changeTrackingSettingsService.Configure().When(i => i.GetSettings()).Do(i => throw new Exception());

            // Act
            sut.VersionAdded(addVersionEventArgs);

            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            changeTrackingStoreService.DidNotReceive().AddItemRenamed(Arg.Any<Item>(), Arg.Any<string>(), Arg.Any<string>());
        }

        [Theory]
        [AutoData]
        public void ItemCreated_AddItemCreatedToHistoryStore_IfItemIsNotTracked(ID templateId)
        {
            // Arrange
            var item = new FakeItem().WithRuntimeSettings().WithTemplate(templateId).WithItemVersions().WithField("test", "valze");
            createItemCommand = Substitute.ForPartsOf<CreateItemCommand>();
            creationEventArgs = Substitute.For<ExecutedEventArgs<CreateItemCommand>>(createItemCommand);
            saveItemCommand.Changes.Returns(new ItemChanges(item));
            changeTrackingSettingsService.GetSettings().Returns(new ChangeTrackingSettings { IsEnabled = true, Templates = new HashSet<ID>() { ID.NewID } });
            changeTrackingHelperService.GetItem(Arg.Any<ExecutedEventArgs<CreateItemCommand>>()).Returns(item);

            // Act
            sut.ItemCreated(creationEventArgs);

            changeTrackingStoreService.DidNotReceiveWithAnyArgs().AddItemCreated(Arg.Any<Item>(), Arg.Any<string>(), Arg.Any<string>());
        }

        [Fact]
        public void ItemCreated_Exit_IfItemIsNotTracked()
        {
            // Arrange
            changeTrackingSettingsService.GetSettings().Returns(new ChangeTrackingSettings { IsEnabled = false, Templates = new HashSet<ID>() { ID.NewID } });

            // Act
            sut.ItemCreated(creationEventArgs);

            changeTrackingStoreService.DidNotReceiveWithAnyArgs().AddItemCreated(Arg.Any<Item>(), Arg.Any<string>(), Arg.Any<string>());
        }

        [Theory]
        [AutoData]
        public void ItemCreated_AddItemCreatedToHistoryStore_IfItemIsTracked(ID templateId)
        {
            // Arrange
            var item = new FakeItem().WithRuntimeSettings().WithTemplate(templateId).WithItemVersions().WithField("test", "valze");
            createItemCommand = Substitute.ForPartsOf<CreateItemCommand>();
            creationEventArgs = Substitute.For<ExecutedEventArgs<CreateItemCommand>>(createItemCommand);
            saveItemCommand.Changes.Returns(new ItemChanges(item));
            changeTrackingSettingsService.GetSettings().Returns(new ChangeTrackingSettings { IsEnabled = true, Templates = new HashSet<ID>() { templateId } });
            changeTrackingHelperService.GetItem(Arg.Any<ExecutedEventArgs<CreateItemCommand>>()).Returns(item);

            // Act
            sut.ItemCreated(creationEventArgs);

            changeTrackingStoreService.ReceivedWithAnyArgs().AddItemCreated(Arg.Any<Item>(), Arg.Any<string>(), Arg.Any<string>());
        }

        [Theory]
        [AutoData]
        public void VersionAdded_AddItemCreatedToHistoryStore_IfItemIsNotTracked(ID templateId)
        {
            // Arrange
            var item = new FakeItem().WithRuntimeSettings().WithTemplate(templateId).WithItemVersions().WithField("test", "valze");
            addVersionCommand = Substitute.ForPartsOf<AddVersionCommand>();
            addVersionEventArgs = Substitute.For<ExecutedEventArgs<AddVersionCommand>>(addVersionCommand);
            saveItemCommand.Changes.Returns(new ItemChanges(item));
            changeTrackingSettingsService.GetSettings().Returns(new ChangeTrackingSettings { IsEnabled = true, Templates = new HashSet<ID>() { ID.NewID } });
            changeTrackingHelperService.GetItem(Arg.Any<ExecutedEventArgs<AddVersionCommand>>()).Returns(item);

            // Act
            sut.VersionAdded(addVersionEventArgs);

            changeTrackingStoreService.DidNotReceiveWithAnyArgs().AddVersionAdded(Arg.Any<Item>(), Arg.Any<string>());
        }

        [Fact]
        public void VersionAdded_Exit_IfItemIsNotTracked()
        {
            // Arrange
            changeTrackingSettingsService.GetSettings().Returns(new ChangeTrackingSettings { IsEnabled = false, Templates = new HashSet<ID>() { ID.NewID } });

            // Act
            sut.VersionAdded(addVersionEventArgs);

            changeTrackingStoreService.DidNotReceiveWithAnyArgs().AddVersionAdded(Arg.Any<Item>(), Arg.Any<string>());
        }

        [Theory]
        [AutoData]
        public void VersionAdded_AddItemCreatedToHistoryStore_IfItemIsTracked(ID templateId)
        {
            // Arrange
            var item = new FakeItem().WithRuntimeSettings().WithTemplate(templateId).WithItemVersions();
            addVersionCommand = Substitute.ForPartsOf<AddVersionCommand>();
            addVersionEventArgs = Substitute.For<ExecutedEventArgs<AddVersionCommand>>(addVersionCommand);
            saveItemCommand.Changes.Returns(new ItemChanges(item));
            changeTrackingSettingsService.GetSettings().Returns(new ChangeTrackingSettings { IsEnabled = true, Templates = new HashSet<ID>() { templateId } });
            changeTrackingHelperService.GetItem(Arg.Any<ExecutedEventArgs<AddVersionCommand>>()).Returns(item);

            // Act
            sut.VersionAdded(addVersionEventArgs);

            changeTrackingStoreService.ReceivedWithAnyArgs().AddVersionAdded(Arg.Any<Item>(), Arg.Any<string>());
        }
    }
}