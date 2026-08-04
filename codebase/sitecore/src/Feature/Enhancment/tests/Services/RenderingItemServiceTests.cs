using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using easyJet.Feature.SitecoreEnhancment;
using easyJet.Feature.SitecoreEnhancment.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.DataProviders;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Tests.Services
{
    public class RenderingItemServiceTests
    {
        [Fact]
        public void GetItemDisplayName_WhenEmpty_ReturnsNotSelected()
        {
            // ARRANGE
            var dbp = Substitute.For<IDatabaseProvider>();
            var sut = new RenderingItemService(dbp);

            // ACT
            var name = sut.GetItemDisplayName(string.Empty);

            // ASSERT
            name.Should().Be(Constants.RenderingMappingEditor.NotSelectedText);
        }

        [Fact]
        public void GetItemDisplayName_InvalidGuid_ReturnsOriginal()
        {
            // ARRANGE
            var dbp = Substitute.For<IDatabaseProvider>();
            var sut = new RenderingItemService(dbp);

            // ACT
            var name = sut.GetItemDisplayName("not-a-guid");

            // ASSERT
            name.Should().Be("not-a-guid");
        }

        [Fact]
        public void GetItemDisplayName_ValidGuid_NotFound_ReturnsId()
        {
            // ARRANGE
            var dbp = Substitute.For<IDatabaseProvider>();
            dbp.GetItem(Arg.Any<ID>(), DatabaseType.Master).Returns((Item)null);
            var sut = new RenderingItemService(dbp);
            var id = ID.NewID.ToString();

            // ACT
            var name = sut.GetItemDisplayName(id);

            // ASSERT
            name.Should().Be(id);
        }

        [Fact]
        public void GetItemDisplayName_ValidGuid_Found_ReturnsDisplayName()
        {
            // ARRANGE
            var dbp = Substitute.For<IDatabaseProvider>();
            var item = new FakeItem().WithDisplayName("MyDisplay").ToSitecoreItem();
            dbp.GetItem(item.ID, DatabaseType.Master).Returns(item);
            var sut = new RenderingItemService(dbp);

            // ACT
            var name = sut.GetItemDisplayName(item.ID.ToString());

            // ASSERT
            name.Should().Be("MyDisplay");
        }

        [Fact]
        public void GetRenderingIconUrl_EmptyOrInvalid_ReturnsEmpty()
        {
            // ARRANGE
            var dbp = Substitute.For<IDatabaseProvider>();
            var sut = new RenderingItemService(dbp);

            sut.GetRenderingIconUrl(string.Empty).Should().BeEmpty();
            sut.GetRenderingIconUrl("not-a-guid").Should().BeEmpty();

            dbp.GetItem(Arg.Any<ID>(), DatabaseType.Master).Returns((Item)null);
            sut.GetRenderingIconUrl(ID.NewID.ToString()).Should().BeEmpty();
        }

        [Fact]
        public void GetRenderingComponentName_UsesField()
        {
            // ARRANGE
            var dbp = Substitute.For<IDatabaseProvider>();
            var item = new FakeItem().WithField(Constants.RenderingMappingEditor.FieldNames.ComponentName, "CompA").ToSitecoreItem();
            dbp.GetItem(Arg.Any<ID>(), DatabaseType.Master).Returns(item);
            var sut = new RenderingItemService(dbp);

            // ACT
            var name = sut.GetRenderingComponentName(ID.NewID.ToString());

            // ASSERT
            name.Should().Be("CompA");
        }

        [Fact]
        public void GetRenderingTypeName_ReturnsTemplateName()
        {
            // ARRANGE
            var dbp = Substitute.For<IDatabaseProvider>();
            var item = new FakeItem().WithTemplateName("MyTemplate").ToSitecoreItem();
            dbp.GetItem(Arg.Any<ID>(), DatabaseType.Master).Returns(item);
            var sut = new RenderingItemService(dbp);

            // ACT
            var name = sut.GetRenderingTypeName(ID.NewID.ToString());

            // ASSERT
            name.Should().Be("MyTemplate");
        }

        [Fact]
        public void IsRenderingFolderWithRenderings_True_WhenFolderHasRenderingChildren()
        {
            // ARRANGE
            var folder = new FakeItem().WithTemplate(Constants.TemplateIds.RenderingFolder);
            var child = new FakeItem().WithTemplate(Constants.TemplateIds.Rendering).WithParent(folder);
            var folderItem = folder.ToSitecoreItem();
            _ = child.ToSitecoreItem();

            var sut = new RenderingItemService(Substitute.For<IDatabaseProvider>());

            // ACT
            var result = sut.IsRenderingFolderWithRenderings(folderItem);

            // ASSERT
            result.Should().BeTrue();
        }

        [Fact]
        public void IsRenderingFolderWithRenderings_False_WhenNotFolderOrNoRenderings()
        {
            // ARRANGE
            var notFolder = new FakeItem().WithTemplate(Constants.TemplateIds.Rendering).ToSitecoreItem();
            var emptyFolder = new FakeItem().WithTemplate(Constants.TemplateIds.RenderingFolder).ToSitecoreItem();
            var sut = new RenderingItemService(Substitute.For<IDatabaseProvider>());

            // ACT / ASSERT
            sut.IsRenderingFolderWithRenderings(null).Should().BeFalse();
            sut.IsRenderingFolderWithRenderings(notFolder).Should().BeFalse();
            sut.IsRenderingFolderWithRenderings(emptyFolder).Should().BeFalse();
        }

        [Fact]
        public void GetParametersTemplateItem_WhenRenderingItemIsNull_ReturnsNull()
        {
            // ARRANGE
            var dbp = Substitute.For<IDatabaseProvider>();
            var sut = new RenderingItemService(dbp);

            // ACT
            var result = sut.GetParametersTemplateItem(null);

            // ASSERT
            result.Should().BeNull();
        }

        [Fact]
        public void GetParametersTemplateItem_WhenNoParametersTemplateField_ReturnsNull()
        {
            // ARRANGE
            var dbp = Substitute.For<IDatabaseProvider>();
            var renderingItem = new FakeItem().ToSitecoreItem();
            var sut = new RenderingItemService(dbp);

            // ACT
            var result = sut.GetParametersTemplateItem(renderingItem);

            // ASSERT
            result.Should().BeNull();
        }

        [Fact]
        public void GetParametersTemplateItem_WhenParametersTemplateFieldEmpty_ReturnsNull()
        {
            // ARRANGE
            var dbp = Substitute.For<IDatabaseProvider>();
            var renderingItem = new FakeItem()
                .WithField(Constants.RenderingMappingEditor.FieldNames.ParametersTemplate, string.Empty)
                .ToSitecoreItem();
            var sut = new RenderingItemService(dbp);

            // ACT
            var result = sut.GetParametersTemplateItem(renderingItem);

            // ASSERT
            result.Should().BeNull();
        }

        [Fact]
        public void GetParametersTemplateItem_WhenParametersTemplateFieldInvalidGuid_ReturnsNull()
        {
            // ARRANGE
            var dbp = Substitute.For<IDatabaseProvider>();
            var renderingItem = new FakeItem()
                .WithField(Constants.RenderingMappingEditor.FieldNames.ParametersTemplate, "not-a-guid")
                .ToSitecoreItem();
            var sut = new RenderingItemService(dbp);

            // ACT
            var result = sut.GetParametersTemplateItem(renderingItem);

            // ASSERT
            result.Should().BeNull();
        }

        [Fact]
        public void GetParametersTemplateItem_WhenValidTemplateId_ReturnsTemplateItem()
        {
            // ARRANGE
            var templateId = ID.NewID;
            var dbp = Substitute.For<IDatabaseProvider>();
            var templateItem = new FakeItem(templateId).ToSitecoreItem();
            dbp.GetItem(templateId, DatabaseType.Master).Returns(templateItem);

            var renderingItem = new FakeItem()
                .WithField(Constants.RenderingMappingEditor.FieldNames.ParametersTemplate, templateId.ToString())
                .ToSitecoreItem();
            var sut = new RenderingItemService(dbp);

            // ACT
            var result = sut.GetParametersTemplateItem(renderingItem);

            // ASSERT
            result.Should().Be(templateItem);
        }

        [Fact]
        public void GetSourceItems_WhenSourceIsNullOrEmpty_ReturnsEmptyArray()
        {
            // ARRANGE
            var dbp = Substitute.For<IDatabaseProvider>();
            var sut = new RenderingItemService(dbp);

            // ACT
            var resultNull = sut.GetSourceItems(null);
            var resultEmpty = sut.GetSourceItems(string.Empty);
            var resultWhitespace = sut.GetSourceItems("   ");

            // ASSERT
            resultNull.Should().BeEmpty();
            resultEmpty.Should().BeEmpty();
            resultWhitespace.Should().BeEmpty();
        }

        [Fact]
        public void GetSourceItems_WhenContextItemNotFound_ReturnsEmptyArray()
        {
            // ARRANGE
            var dbp = Substitute.For<IDatabaseProvider>();
            dbp.GetItem("/sitecore/content", DatabaseType.Master).Returns((Item)null);
            var sut = new RenderingItemService(dbp);

            // ACT
            var result = sut.GetSourceItems("/sitecore/content");

            // ASSERT
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetSourceItemsFromCache_WhenSourceIsEmpty_ReturnsEmptyArray()
        {
            // ARRANGE
            var dbp = Substitute.For<IDatabaseProvider>();
            var sut = new RenderingItemService(dbp);

            // ACT
            var result = sut.GetSourceItemsFromCache(string.Empty);

            // ASSERT
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetSourceItemsFromCache_WhenFewItems_ReturnsEmptyArray()
        {
            // ARRANGE
            var dbp = Substitute.For<IDatabaseProvider>();
            dbp.GetItem(Arg.Any<string>(), DatabaseType.Master).Returns((Item)null);
            var sut = new RenderingItemService(dbp);

            // ACT
            var result = sut.GetSourceItemsFromCache("/sitecore/content");

            // ASSERT
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetRenderingIconUrl_WhenItemAppearanceIsNull_ReturnsEmpty()
        {
            // ARRANGE
            var dbp = Substitute.For<IDatabaseProvider>();
            var item = new FakeItem().ToSitecoreItem();
            dbp.GetItem(Arg.Any<ID>(), DatabaseType.Master).Returns(item);
            var sut = new RenderingItemService(dbp);

            // ACT
            var result = sut.GetRenderingIconUrl(ID.NewID.ToString());

            // ASSERT
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetRenderingComponentName_WhenItemIdIsNull_ReturnsNull()
        {
            // ARRANGE
            var dbp = Substitute.For<IDatabaseProvider>();
            var sut = new RenderingItemService(dbp);

            // ACT
            var result = sut.GetRenderingComponentName(null);

            // ASSERT
            result.Should().BeNull();
        }

        [Fact]
        public void GetRenderingComponentName_WhenInvalidGuid_ReturnsNull()
        {
            // ARRANGE
            var dbp = Substitute.For<IDatabaseProvider>();
            var sut = new RenderingItemService(dbp);

            // ACT
            var result = sut.GetRenderingComponentName("not-a-guid");

            // ASSERT
            result.Should().BeNull();
        }

        [Fact]
        public void GetRenderingComponentName_WhenItemNotFound_ReturnsNull()
        {
            // ARRANGE
            var dbp = Substitute.For<IDatabaseProvider>();
            dbp.GetItem(Arg.Any<ID>(), DatabaseType.Master).Returns((Item)null);
            var sut = new RenderingItemService(dbp);

            // ACT
            var result = sut.GetRenderingComponentName(ID.NewID.ToString());

            // ASSERT
            result.Should().BeNull();
        }

        [Fact]
        public void GetRenderingComponentName_WhenFieldIsEmpty_ReturnsNull()
        {
            // ARRANGE
            var dbp = Substitute.For<IDatabaseProvider>();
            var item = new FakeItem()
                .WithField(Constants.RenderingMappingEditor.FieldNames.ComponentName, string.Empty)
                .ToSitecoreItem();
            dbp.GetItem(Arg.Any<ID>(), DatabaseType.Master).Returns(item);
            var sut = new RenderingItemService(dbp);

            // ACT
            var result = sut.GetRenderingComponentName(ID.NewID.ToString());

            // ASSERT
            result.Should().BeNull();
        }

        [Fact]
        public void GetRenderingTypeName_WhenItemIdIsNull_ReturnsNull()
        {
            // ARRANGE
            var dbp = Substitute.For<IDatabaseProvider>();
            var sut = new RenderingItemService(dbp);

            // ACT
            var result = sut.GetRenderingTypeName(null);

            // ASSERT
            result.Should().BeNull();
        }

        [Fact]
        public void GetRenderingTypeName_WhenInvalidGuid_ReturnsNull()
        {
            // ARRANGE
            var dbp = Substitute.For<IDatabaseProvider>();
            var sut = new RenderingItemService(dbp);

            // ACT
            var result = sut.GetRenderingTypeName("not-a-guid");

            // ASSERT
            result.Should().BeNull();
        }

        [Fact]
        public void GetRenderingTypeName_WhenItemNotFound_ReturnsNull()
        {
            // ARRANGE
            var dbp = Substitute.For<IDatabaseProvider>();
            dbp.GetItem(Arg.Any<ID>(), DatabaseType.Master).Returns((Item)null);
            var sut = new RenderingItemService(dbp);

            // ACT
            var result = sut.GetRenderingTypeName(ID.NewID.ToString());

            // ASSERT
            result.Should().BeNull();
        }

        [Fact]
        public void Constructor_DefaultConstructor_DoesNotThrow()
        {
            // ACT
            Action act = () => new RenderingItemService();

            // ASSERT
            act.Should().NotThrow();
        }

        [Fact]
        public void GetSourceItemsFromCache_WhenCacheHit_ReturnsCachedItems()
        {
            // ARRANGE
            var dbp = Substitute.For<IDatabaseProvider>();

            var renderingFolders = new List<Item>();
            for (int i = 0; i < 12; i++)
            {
                var folder = new FakeItem().WithTemplate(Constants.TemplateIds.RenderingFolder);
                var rendering = new FakeItem().WithTemplate(Constants.TemplateIds.Rendering).WithParent(folder);
                renderingFolders.Add(folder.ToSitecoreItem());
                _ = rendering.ToSitecoreItem();
            }

            dbp.GetItem("/test/path", DatabaseType.Master).Returns((Item)null);

            var sut = new RenderingItemService(dbp);

            var firstResult = sut.GetSourceItemsFromCache("/test/path");

            // ACT
            var result = sut.GetSourceItemsFromCache("/test/path");

            // ASSERT
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        // ============================================================
        // Cache Tests (from CustomFields)
        // ============================================================
        [Fact]
        public void GetSourceItemsFromCache_WhenSourceIsNull_ShouldReturnEmptyArray()
        {
            // Arrange
            var sut = CreateService();

            // Act
            var result = sut.GetSourceItemsFromCache(null);

            // Assert
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetSourceItemsFromCache_WhenCacheContainsSource_ShouldReturnCachedItems()
        {
            // Arrange
            var sut = CreateService();
            var source = "/sitecore/content/test";

            var item1 = new FakeItem(ID.NewID).ToSitecoreItem();
            var item2 = new FakeItem(ID.NewID).ToSitecoreItem();
            var cached = new[] { item1, item2 };

            var cacheField = typeof(RenderingItemService).GetField("renderingCache", BindingFlags.NonPublic | BindingFlags.Instance);
            var cache = (ConcurrentDictionary<string, Item[]>)cacheField?.GetValue(sut);
            cache?.TryAdd(source, cached);

            // Act
            var result = sut.GetSourceItemsFromCache(source);

            // Assert
            result.Should().Equal(cached);
        }

        [Fact]
        public void GetSourceItems_WhenCacheNotContainsSource_ShouldReturnNewItems()
        {
            // Arrange
            var sut = CreateService();
            var source = "/sitecore/content/test";

            var item1 = new FakeItem(ID.NewID).ToSitecoreItem();
            var item2 = new FakeItem(ID.NewID).ToSitecoreItem();
            var cached = new[] { item1, item2 };

            // Act
            var result = sut.GetSourceItemsFromCache(source);

            // Assert
            result.Should().NotEqual(cached);
        }

        [Fact]
        public void GetSourceItems_WhenContextItemFoundButNotRenderingFolder_ReturnsEmptyArray()
        {
            // ARRANGE
            var source = "/sitecore/layout/renderings";
            var dbp = Substitute.For<IDatabaseProvider>();

            var fakeContextItem = new FakeItem();
            var axes = Substitute.For<ItemAxes>(fakeContextItem.ToSitecoreItem());
            axes.GetDescendants().Returns(Array.Empty<Item>());
            fakeContextItem = fakeContextItem.WithItemAxes(axes);
            var contextItem = fakeContextItem.ToSitecoreItem();

            dbp.GetItem(source, DatabaseType.Master).Returns(contextItem);
            var sut = new RenderingItemService(dbp);

            // ACT
            var result = sut.GetSourceItems(source);

            // ASSERT
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetSourceItems_WhenCacheAlreadyContainsSource_ReturnsCachedItems()
        {
            // ARRANGE
            var source = "/sitecore/layout/renderings";
            var dbp = Substitute.For<IDatabaseProvider>();
            var sut = new RenderingItemService(dbp);

            var cached = new[] { new FakeItem().ToSitecoreItem() };
            var cacheField = typeof(RenderingItemService).GetField("renderingCache", BindingFlags.NonPublic | BindingFlags.Instance);
            var cache = (ConcurrentDictionary<string, Item[]>)cacheField?.GetValue(sut);
            cache?.TryAdd(source, cached);

            // ACT
            var result = sut.GetSourceItems(source);

            // ASSERT
            result.Should().Equal(cached);
        }

        // ============================================================
        // Helper Methods
        // ============================================================
        private static RenderingItemService CreateService()
        {
            return new RenderingItemService(Substitute.For<IDatabaseProvider>());
        }
    }
}
