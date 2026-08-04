using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Foundation.Multisite.Pipelines.PushCloneChanges;
using easyJet.Foundation.Multisite.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Globalization;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Multisite.Tests.Services
{
    public class PushCloneServiceTests
    {
        private readonly IPushCloneCoordinatorService pushCloneCoordinatorService;
        private readonly PushCloneService pushCloneService;
        private readonly BaseCorePipelineManager corePipelineManager;

        public PushCloneServiceTests()
        {
            pushCloneCoordinatorService = Substitute.For<IPushCloneCoordinatorService>();
            corePipelineManager = Substitute.For<BaseCorePipelineManager>();
            pushCloneService = new PushCloneService(pushCloneCoordinatorService, corePipelineManager);
        }

        [Fact]
        public void AddChild_ShouldNotCloneItem_IfParentIsNull()
        {
            // Arrange
            var item = new FakeItem();

            // Act
            pushCloneService.AddChild(item);
            var actual = item.ToSitecoreItem();

            // Assert
            actual.DidNotReceive().CloneTo(Arg.Any<Item>(), Arg.Any<bool>());
        }

        [Fact]
        public void AddChild_ShouldNotCloneItem_IfItemIsNotPage()
        {
            // Arrange
            var item = new FakeItem();
            var parent = new FakeItem();
            var clone = new FakeItem();
            parent.WithGetClones(new List<Item>() { clone });
            parent.WithChild(item);
            pushCloneCoordinatorService.IsPage(Arg.Any<Item>()).Returns(false);

            // Act
            pushCloneService.AddChild(item);
            var actual = item.ToSitecoreItem();

            // Assert
            actual.DidNotReceive().CloneTo(Arg.Any<Item>(), Arg.Any<bool>());
        }

        [Fact]
        public void AddChild_ShouldNotCloneItem_IfShouldProccessIsFalse()
        {
            // Arrange
            var item = new FakeItem();
            var parent = new FakeItem();
            var clone = new FakeItem();
            parent.WithGetClones(new List<Item>() { clone });
            parent.WithChild(item);
            pushCloneCoordinatorService.IsPage(Arg.Any<Item>()).Returns(true);
            pushCloneCoordinatorService.ShouldProcess(Arg.Any<Item>()).Returns(false);

            // Act
            pushCloneService.AddChild(item);
            var actual = item.ToSitecoreItem();

            // Assert
            actual.DidNotReceive().CloneTo(Arg.Any<Item>(), Arg.Any<bool>());
        }

        [Fact]
        public void AddChild_ShouldNotCloneItem_IfItemHasNoVersion()
        {
            // Arrange
            var item = new FakeItem();
            var parent = new FakeItem();
            var clone = new FakeItem();
            parent.WithGetClones(new List<Item>() { clone });
            parent.WithChild(item);
            item.WithLanguages(new Language[0]);
            pushCloneCoordinatorService.IsPage(Arg.Any<Item>()).Returns(true);
            pushCloneCoordinatorService.ShouldProcess(Arg.Any<Item>()).Returns(true);

            // Act
            pushCloneService.AddChild(item);
            var actual = item.ToSitecoreItem();

            // Assert
            actual.DidNotReceive().CloneTo(Arg.Any<Item>(), Arg.Any<bool>());
        }

        [Fact]
        public void AddChild_ShouldCloneItem_IfItemShouldBeProccessAndHasVersion()
        {
            // Arrange
            var database = FakeUtil.FakeDatabase();
            var item = new FakeItem(database: database);
            var parent = new FakeItem();
            var cloneParent = new FakeItem();
            var cloneChild = new FakeItem()
                .WithAppearance()
                .WithField(Templates.BasePage.Fields.OriginalItem, string.Empty)
                .WithItemEditing();

            parent.WithGetClones(new List<Item>() { cloneParent });
            parent.WithChild(item);
            item.WithLanguages(new Language[] { Language.Parse("en") });
            pushCloneCoordinatorService.IsPage(Arg.Any<Item>()).Returns(true);
            pushCloneCoordinatorService.ShouldProcess(Arg.Any<Item>()).Returns(true);

            database.GetItem(Arg.Any<ID>(), Arg.Any<Language>()).Returns(item);
            item.WithItemVersions();
            item.ToSitecoreItem().Versions.GetVersionNumbers().Returns(new Version[1]);
            item.ToSitecoreItem().CloneTo(Arg.Any<Item>(), Arg.Any<bool>()).Returns(cloneChild);

            // Act
            pushCloneService.AddChild(item);
            var actual = item.ToSitecoreItem();

            // Assert
            actual.Received().CloneTo(Arg.Any<Item>(), Arg.Any<bool>());
            cloneChild.ToSitecoreItem().Appearance.ReadOnly.Should().BeTrue();
            cloneChild.ToSitecoreItem().Fields[Templates.BasePage.Fields.OriginalItem].Value.Should().Be(item.ID.ToString());
        }

        [Fact]
        public void Move_ShouldNotMoveItem_IfParentHasNotClones()
        {
            // Arrange
            var parent = new FakeItem().WithHasClones(false);
            var item = new FakeItem().WithParent(parent);

            // Act
            pushCloneService.Move(item);
            var actual = item.ToSitecoreItem();

            // Assert
            actual.DidNotReceive().MoveTo(Arg.Any<Item>());
        }

        [Fact]
        public void Move_ShouldNotMoveItem_IfShouldProcessFalse()
        {
            // Arrange
            var parent = new FakeItem().WithHasClones(true);
            var item = new FakeItem().WithParent(parent);
            var clone = new FakeItem();
            parent.WithGetClones(new List<Item>() { clone });

            pushCloneCoordinatorService.ShouldProcess(Arg.Any<Item>()).Returns(false);

            // Act
            pushCloneService.Move(item);
            var actual = item.ToSitecoreItem();

            // Assert
            actual.DidNotReceive().MoveTo(Arg.Any<Item>());
        }

        [Fact]
        public void Move_ShouldNotMoveItem_IfShouldProcessTrue()
        {
            // Arrange
            var parent = new FakeItem().WithHasClones(true);
            var item = new FakeItem().WithParent(parent);
            var clone = new FakeItem();
            parent.WithGetClones(new List<Item>() { clone });
            item.WithGetClones(new List<Item>() { clone });

            pushCloneCoordinatorService.ShouldProcess(Arg.Any<Item>()).Returns(true);

            // Act
            pushCloneService.Move(item);

            // Assert
            clone.ToSitecoreItem().Received().MoveTo(Arg.Any<Item>());
        }

        [Fact]
        public void Remove_ShouldRemoveItem_IfShouldProcessTrue()
        {
            // Arrange
            var item = new FakeItem();
            var clone = new FakeItem();
            item.WithGetClones(new List<Item>() { clone });

            pushCloneCoordinatorService.ShouldProcess(Arg.Any<Item>()).Returns(true);

            // Act
            pushCloneService.Remove(item);

            // Assert
            clone.ToSitecoreItem().Received().Delete();
        }

        [Fact]
        public void SaveClone_ShouldNotSaveChanges_IfShouldProcessIsFalse()
        {
            // Arrange
            var item = new FakeItem();
            var clone = new FakeItem();
            item.WithGetClones(new List<Item>() { clone });

            pushCloneCoordinatorService.ShouldProcess(Arg.Any<Item>()).Returns(false);
            var changes = new ItemChanges(item);

            // Act
            pushCloneService.SaveClone(item, changes);

            // Assert
            corePipelineManager.DidNotReceive().Run(Arg.Any<string>(), Arg.Any<PushCloneChangesArgs>());
        }

        [Fact]
        public void SaveClone_ShouldSaveChanges_IfShouldProcessIsTrue()
        {
            // Arrange
            var item = new FakeItem();
            var clone = new FakeItem();
            item.WithGetClones(new List<Item>() { clone });

            pushCloneCoordinatorService.ShouldProcess(Arg.Any<Item>()).Returns(true);
            var changes = new ItemChanges(item);

            // Act
            pushCloneService.SaveClone(item, changes);

            // Assert
            corePipelineManager.Received().Run(Arg.Any<string>(), Arg.Any<PushCloneChangesArgs>());
        }

        [Fact]
        public void AddVersion_ShouldNotAddVersion_IfItemHasNoParent()
        {
            // Arrange
            var item = new FakeItem();

            // Act
            pushCloneService.AddVersion(item);

            // Assert
            pushCloneCoordinatorService.DidNotReceive().IsPage(Arg.Any<Item>());
        }

        [Fact]
        public void AddVersion_ShouldNotAddVersion_IfItemHasNoVersion()
        {
            // Arrange
            var parent = new FakeItem();
            var item = new FakeItem().WithParent(parent).WithItemVersions();

            // Act
            pushCloneService.AddVersion(item);

            // Assert
            pushCloneCoordinatorService.DidNotReceive().IsPage(Arg.Any<Item>());
        }

        [Fact]
        public void AddVersion_ShouldNotAddVersion_IfItemIsNotAPage()
        {
            // Arrange
            var parent = new FakeItem();
            var item = new FakeItem().WithParent(parent).WithItemVersions();

            item.ToSitecoreItem().Versions.Count.Returns(1);
            pushCloneCoordinatorService.IsPage(Arg.Any<Item>()).Returns(false);

            // Act
            pushCloneService.AddVersion(item);

            // Assert
            item.ToSitecoreItem().Versions.DidNotReceive().GetLatestVersion();
        }

        [Fact]
        public void AddVersion_ShouldNotAddVersion_IfCloneShouldNoBeProccess()
        {
            // Arrange
            var parent = new FakeItem();
            var clone = new FakeItem().WithItemVersions();
            var item = new FakeItem().WithParent(parent).WithItemVersions();
            item.WithGetClones(new List<Item>() { clone });

            item.ToSitecoreItem().Versions.Count.Returns(1);
            pushCloneCoordinatorService.IsPage(Arg.Any<Item>()).Returns(true);
            pushCloneCoordinatorService.ShouldProcess(Arg.Any<Item>()).Returns(false);

            // Act
            pushCloneService.AddVersion(item);

            // Assert
            clone.ToSitecoreItem().Versions.DidNotReceive().AddVersion();
        }

        [Fact]
        public void AddVersion_ShouldNotAddVersion_IfCloneHasVersion()
        {
            // Arrange
            var database = FakeUtil.FakeDatabase();
            var parent = new FakeItem();
            var clone = new FakeItem(database: database).WithItemVersions();
            var item = new FakeItem().WithParent(parent).WithItemVersions();
            item.WithGetClones(new List<Item>() { clone });

            item.ToSitecoreItem().Versions.Count.Returns(1);
            pushCloneCoordinatorService.IsPage(Arg.Any<Item>()).Returns(true);
            pushCloneCoordinatorService.ShouldProcess(Arg.Any<Item>()).Returns(true);
            database.GetItem(Arg.Any<ID>(), Arg.Any<Language>()).Returns(clone);
            clone.ToSitecoreItem().Versions.GetLatestVersion().Returns(clone);

            // Act
            pushCloneService.AddVersion(item);

            // Assert
            clone.ToSitecoreItem().Versions.DidNotReceive().AddVersion();
        }

        [Fact]
        public void AddVersion_ShouldAddVersion_IfCloneHasNoVersion()
        {
            // Arrange
            var database = FakeUtil.FakeDatabase();
            var parent = new FakeItem();
            var clone = new FakeItem(database: database).WithItemVersions();
            var item = new FakeItem().WithParent(parent).WithItemVersions().WithUri();
            item.WithGetClones(new List<Item>() { clone });

            item.ToSitecoreItem().Versions.Count.Returns(1);
            pushCloneCoordinatorService.IsPage(Arg.Any<Item>()).Returns(true);
            pushCloneCoordinatorService.ShouldProcess(Arg.Any<Item>()).Returns(true);

            database.GetItem(Arg.Any<ID>(), Arg.Any<Language>()).Returns(clone);

            var newVersion = new FakeItem().WithItemVersions().WithItemEditing();
            clone.ToSitecoreItem().Versions.AddVersion().Returns(newVersion);

            newVersion.WithField(FieldIDs.Source, string.Empty);
            newVersion.WithField(FieldIDs.SourceItem, string.Empty);

            // Act
            pushCloneService.AddVersion(item);

            // Assert
            clone.ToSitecoreItem().Versions.Received(1).AddVersion();
            newVersion.ToSitecoreItem()[FieldIDs.Source].Should().Be(item.ToSitecoreItem().Uri.ToString());
            newVersion.ToSitecoreItem()[FieldIDs.SourceItem].Should().Be(item.ToSitecoreItem().Uri.ToString(false));
        }

        [Fact]
        public void AddVersion_ShouldNotClone_IfParentHasNoClones()
        {
            // Arrange
            var parent = new FakeItem();
            parent.ToSitecoreItem().HasClones.Returns(false);
            var item = new FakeItem().WithParent(parent).WithItemVersions().WithUri();

            item.ToSitecoreItem().Versions.Count.Returns(1);
            pushCloneCoordinatorService.IsPage(Arg.Any<Item>()).Returns(true);

            // Act
            pushCloneService.AddVersion(item);

            // Assert
            item.ToSitecoreItem().DidNotReceive().CloneTo(Arg.Any<Item>());
        }

        [Fact]
        public void AddVersion_ShouldNotClone_IfItemShouldNotBeProccess()
        {
            // Arrange
            var clone = new FakeItem();
            var parent = new FakeItem().WithGetClones(new List<Item>() { clone });
            parent.ToSitecoreItem().HasClones.Returns(true);
            var item = new FakeItem().WithParent(parent).WithItemVersions().WithUri();

            item.ToSitecoreItem().Versions.Count.Returns(1);
            pushCloneCoordinatorService.IsPage(Arg.Any<Item>()).Returns(true);
            pushCloneCoordinatorService.ShouldProcess(Arg.Any<Item>()).Returns(false);

            // Act
            pushCloneService.AddVersion(item);

            // Assert
            item.ToSitecoreItem().DidNotReceive().CloneTo(Arg.Any<Item>());
        }

        [Theory]
        [AutoData]
        public void AddVersion_ShouldNotClone_IfItemShouldBeProccess(string workflow, string state)
        {
            // Arrange
            var database = FakeUtil.FakeDatabase();
            var clone = new FakeItem()
                .WithName("Clone")
                .WithAppearance()
                .WithField(Templates.BasePage.Fields.OriginalItem, string.Empty)
                .WithField(FieldIDs.Workflow, workflow)
                .WithField(FieldIDs.WorkflowState, state)
                .WithItemEditing();

            var parent = new FakeItem().WithGetClones(new List<Item>() { clone });
            parent.ToSitecoreItem().HasClones.Returns(true);
            var item = new FakeItem(database: database).WithParent(parent).WithItemVersions().WithUri();

            item.ToSitecoreItem().Versions.Count.Returns(1);
            pushCloneCoordinatorService.IsPage(Arg.Any<Item>()).Returns(true);
            pushCloneCoordinatorService.ShouldProcess(Arg.Any<Item>()).Returns(true);
            item.ToSitecoreItem().CloneTo(Arg.Any<Item>()).Returns(clone);

            database.GetItem(Arg.Any<ID>()).Returns(item);

            // Act
            pushCloneService.AddVersion(item);

            // Assert
            item.ToSitecoreItem().Received(1).CloneTo(Arg.Any<Item>());
            clone.ToSitecoreItem().Appearance.ReadOnly.Should().BeTrue();
            clone.ToSitecoreItem().Fields[Templates.BasePage.Fields.OriginalItem].Value.Should().Be(item.ID.ToString());
        }
    }
}
