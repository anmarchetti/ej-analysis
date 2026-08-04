using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Repositories;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using NSubstitute;
using Sitecore;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Repositories
{
    public class DatasourceRepositoryTests
    {
        private readonly DatasourceRepository repository;
        private readonly IDestinationsLogger destinationsLogger;

        public DatasourceRepositoryTests()
        {
            // Arrange
            destinationsLogger = Substitute.For<IDestinationsLogger>();
            repository = new DatasourceRepository(destinationsLogger);
        }

        [Theory]
        [AutoDbData]
        public void GetOrCreateItem_ShouldCreateItem(string name, DbTemplate template, Item parent)
        {
            // Act
            var actual = repository.GetOrCreateItem(name, template.ID, parent);

            // Assert
            actual.TemplateID.Should().Be(template.ID);
            actual.Name.Should().Be(name);
        }

        [Theory]
        [AutoDbData]
        public void GetOrCreateItem_ShouldGetItem(string name, DbTemplate template, Item parent)
        {
            // Arrange
            parent.Add(name, new TemplateID(template.ID));

            // Act
            var actual = repository.GetOrCreateItem(name, template.ID, parent);

            // Assert
            actual.TemplateID.Should().Be(template.ID);
            actual.Name.Should().Be(name);
        }

        [Theory]
        [AutoDbData]
        public void GetOrCreateItem_ShouldGetItemAndDisableEventsIsFalse(string name, DbTemplate template, Item parent)
        {
            // Arrange
            parent.Add(name, new TemplateID(template.ID));

            // Act
            var actual = repository.GetOrCreateItem(name, template.ID, parent, false);

            // Assert
            actual.TemplateID.Should().Be(template.ID);
            actual.Name.Should().Be(name);
        }

        [Theory]
        [AutoDbData]
        public void CreateItem_ShouldCreateItem(string name, DbTemplate template, Item parent)
        {
            // Arrange
            parent.Add(name, new TemplateID(template.ID));

            // Act
            var actual = repository.CreateItem(name, template.ID, parent);

            // Assert
            actual.TemplateID.Should().Be(template.ID);
            actual.Name.Should().Be(name);
        }

        [Theory]
        [AutoDbData]
        public void GetOrCreateItemByCode_ShouldCreateItem_IfItemIsNotExists(string code, TemplateItem template, Item parent)
        {
            using (new EditContext(parent))
            {
                parent.Name = "Item1";
            }

            // Act
            var actual = repository.GetOrCreateItemByCode("Item1", code, template.ID, parent);

            // Assert
            actual.TemplateID.Should().Be(template.ID);
            actual.Name.Should().Be("Item1");
        }

        [Theory]
        [AutoDbData]
        public void GetOrCreateItemByCode_ShouldCreateItem_IfItemIsNotExistsAndDisableEventsIsFalse(string code, TemplateItem template, Item parent)
        {
            // Arrange
            using (new EditContext(parent))
            {
                parent.Name = "Item1";
            }

            // Act
            var actual = repository.GetOrCreateItemByCode("Item1", code, template.ID, parent, false);

            // Assert
            actual.TemplateID.Should().Be(template.ID);
            actual.Name.Should().Be("Item1");
        }

        [Theory]
        [AutoDbData]
        public void CreateMapperWhichMapsTypeCodesToItemIds_ShouldReturnEmptyDictionary(TemplateItem template, Item typesFolderItem)
        {
            // Act
            var actual = repository.CreateMapperWhichMapsTypeCodesToItemIds(typesFolderItem, template.ID, true);

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoDbData]
        public void CreateMapperWhichMapsTypeCodesToItemIds_ShouldNotBeEmpty(Db db, TemplateID templateId, string itemName, ID itemId, string code)
        {
            // Arrange
            var parentDbItem = new DbItem("Parent");

            var dbItem = new DbItem(itemName, itemId, templateId);
            dbItem.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Code) { Value = code });
            parentDbItem.Children.Add(dbItem);
            db.Add(parentDbItem);

            // Act
            var actual = repository.CreateMapperWhichMapsTypeCodesToItemIds(db.GetItem(parentDbItem.ID), templateId, false);

            // Assert
            actual.Should().NotBeEmpty();
        }

        [Theory]
        [AutoDbData]
        public void CreateMapperWhichMapsTypeCodesToItemIds_ShouldNotBeEmptyAndShouldDeepSelectIsTrue(Db db, TemplateID templateId, string itemName, ID itemId, string code)
        {
            // Arrange
            var parentDbItem = new DbItem("Parent");

            var dbItem = new DbItem(itemName, itemId, templateId);
            dbItem.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Code) { Value = code });
            parentDbItem.Children.Add(dbItem);
            db.Add(parentDbItem);

            // Act
            var actual = repository.CreateMapperWhichMapsTypeCodesToItemIds(db.GetItem(parentDbItem.ID), templateId, true);

            // Assert
            actual.Should().NotBeEmpty();
        }

        [Theory]
        [AutoData]
        public void GetOrCreateFolderItem_ShouldReturnFolderItem(TemplateID templateId, string itemName, ID itemId)
        {
            // Arrange
            var childItem = new FakeItem(itemId);
            var stubItemAxes = Substitute.For<ItemAxes>(new FakeItem().ToSitecoreItem());
            stubItemAxes.SelectSingleItem(Arg.Any<string>()).Returns(childItem.ToSitecoreItem());
            var parentItem = new FakeItem()
                .WithParent(new FakeItem(ID.NewID))
                .WithChild(childItem)
                .WithItemAxes(stubItemAxes)
                .ToSitecoreItem();

            // Act
            var actual = repository.GetOrCreateFolderItem(parentItem, itemName, templateId);

            // Assert
            actual.ID.Should().BeEquivalentTo(itemId);
        }

        [Theory]
        [AutoData]
        public void GetOrCreateFromHotelBranchTemplate_ShouldReturnItem(TemplateID templateId, string itemName, ID itemId, ID branchId)
        {
            // Arrange
            var branch = new FakeItem().WithTemplate(branchId).ToSitecoreItem();
            var visualisationItem = new FakeItem().ToSitecoreItem();
            var visualisation = Substitute.For<ItemVisualization>(visualisationItem);
            var parentItem = new FakeItem();
            var childrenItem = new FakeItem(itemId).WithName(itemName).WithTemplate(templateId);
            parentItem
                .WithChild(childrenItem)
                .WithTemplate(templateId)
                .WithVisualization(visualisation)
                .ToSitecoreItem();

            var workFlowItem = new FakeItem()
                .WithBranch(branch)
                .WithName(itemName)
                .WithParent(parentItem)
                .WithTemplate(templateId)
                .WithVisualization(visualisation)
                .ToSitecoreItem();

            parentItem.Add(workFlowItem.ID, itemName);

            // Act
            Context.Device = workFlowItem;
            var actual = repository.CreateFromHotelBranchTemplate(itemName, parentItem, workFlowItem.Branch, null);

            // Assert
            actual.ID.Should().BeEquivalentTo(workFlowItem.ID);
        }

        [Theory]
        [AutoData]
        public void GetOrCreateFromHotelBranchTemplate_ShouldReturnExistingItem_WhenNameMatchesCaseInsensitively(TemplateID templateId, ID itemId, ID branchId)
        {
            // Arrange - existing child differs from the requested name only by casing
            const string requestedName = "Hotel De La Paix";
            var branch = new FakeItem().WithTemplate(branchId).ToSitecoreItem();
            var existingChild = new FakeItem(itemId).WithName(ItemUtil.ProposeValidItemName(requestedName).ToLowerInvariant()).WithTemplate(templateId);
            var parentItem = new FakeItem()
                .WithChild(existingChild)
                .WithTemplate(templateId)
                .ToSitecoreItem();

            // Act
            var actual = repository.GetOrCreateFromHotelBranchTemplate(requestedName, parentItem, new BranchItem(branch));

            // Assert - the existing item is reused, not a duplicate created
            actual.ID.Should().BeEquivalentTo(itemId);
        }

        [Theory]
        [AutoData]
        public void GetOrCreateFromHotelBranchTemplate_ShouldReuseExistingItemAndSetDisplayName_WhenDisplayNameProvided(TemplateID templateId, ID itemId, ID branchId)
        {
            // Arrange - existing child is found; providing a displayName exercises the edit branch
            const string requestedName = "Existing Hotel";
            var branch = new FakeItem().WithTemplate(branchId).ToSitecoreItem();
            var existingChild = new FakeItem(itemId)
                .WithName(ItemUtil.ProposeValidItemName(requestedName))
                .WithTemplate(templateId)
                .WithItemEditing();
            var parentItem = new FakeItem()
                .WithChild(existingChild)
                .WithTemplate(templateId)
                .ToSitecoreItem();

            // Act
            var actual = repository.GetOrCreateFromHotelBranchTemplate(requestedName, parentItem, new BranchItem(branch), "My Display Name");

            // Assert - existing item reused (not duplicated) and the edit path runs without error
            actual.ID.Should().BeEquivalentTo(itemId);
        }

        [Theory]
        [AutoData]
        public void GetOrCreateFromHotelBranchTemplate_ShouldReturnFirstMatch_WhenMultipleChildrenShareName(TemplateID templateId, ID firstId, ID secondId, ID branchId)
        {
            // Arrange - two children share the same valid name, exercising the multi-match branch
            var validName = ItemUtil.ProposeValidItemName("Duplicate Hotel");
            var branch = new FakeItem().WithTemplate(branchId).ToSitecoreItem();
            var first = new FakeItem(firstId).WithName(validName).WithTemplate(templateId);
            var second = new FakeItem(secondId).WithName(validName).WithTemplate(templateId);
            var parentItem = new FakeItem()
                .WithChild(first)
                .WithChild(second)
                .WithTemplate(templateId)
                .ToSitecoreItem();

            // Act
            var actual = repository.GetOrCreateFromHotelBranchTemplate("Duplicate Hotel", parentItem, new BranchItem(branch));

            // Assert - the first matching child is returned
            actual.ID.Should().BeEquivalentTo(firstId);
        }

        [Theory]
        [AutoData]
        public void GetOrCreateFromHotelBranchTemplate_ShouldReturnItemAndDeviceItemNameIsSet(ID branchId, TemplateID templateId, string itemName, ID itemId)
        {
            // Arrange
            var branch = new FakeItem().WithTemplate(branchId).ToSitecoreItem();
            var visualisationItem = new FakeItem().ToSitecoreItem();
            var visualisation = Substitute.For<ItemVisualization>(visualisationItem);
            var parentItem = new FakeItem();
            var childrenItem = new FakeItem(itemId).WithName(itemName).WithTemplate(templateId);
            parentItem
                .WithChild(childrenItem)
                .WithTemplate(templateId)
                .WithVisualization(visualisation)
                .ToSitecoreItem();

            var workFlowItem = new FakeItem()
                .WithBranch(branch)
                .WithName(itemName)
                .WithParent(parentItem)
                .WithTemplate(templateId)
                .WithItemEditing()
                .WithVisualization(visualisation)
                .ToSitecoreItem();

            parentItem.Add(workFlowItem.ID, itemName);

            // Act
            Context.Device = workFlowItem;
            var actual = repository.CreateFromHotelBranchTemplate(itemName, parentItem, workFlowItem.Branch, "TestDisplayName");

            // Assert
            actual.ID.Should().BeEquivalentTo(workFlowItem.ID);
        }
    }
}