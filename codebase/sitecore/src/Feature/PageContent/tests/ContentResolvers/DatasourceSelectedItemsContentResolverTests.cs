using System.Collections.Generic;
using System.Linq;
using easyJet.Feature.PageContent.ContentResolvers;
using FluentAssertions;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Feature.PageContent.Tests.ContentResolvers
{
    public class DatasourceSelectedItemsContentResolverTests
    {
        [Fact]
        public void GetItems_ShouldReturnEmptyCollection_WhenItemsFieldDoesNotExist()
        {
            // Arrange
            var db = new Db();
            var datasourceItem = new DbItem("Datasource item");
            db.Add(datasourceItem);
            var contextItem = db.GetItem(datasourceItem.ID);

            var resolver = new TestableDatasourceSelectedItemsContentResolver();

            // Act
            var actual = resolver.GetItemsForTest(contextItem);

            // Assert
            actual.Should().NotBeNull();
            actual.Should().BeEmpty();
        }

        [Fact]
        public void GetItems_ShouldReturnVersionedItemsFromMultilist_WhenItemsFieldExists()
        {
            // Arrange
            var db = new Db();
            var selectedItem1 = new DbItem("Selected item 1");
            var selectedItem2 = new DbItem("Selected item 2");

            var datasourceItem = new DbItem("Datasource item")
            {
                new DbField("Items")
                {
                    Type = "Multilist",
                    Value = $"{selectedItem1.ID}|{selectedItem2.ID}"
                }
            };

            db.Add(selectedItem1);
            db.Add(selectedItem2);
            db.Add(datasourceItem);

            var contextItem = db.GetItem(datasourceItem.ID);
            var resolver = new TestableDatasourceSelectedItemsContentResolver();

            // Act
            var actual = resolver.GetItemsForTest(contextItem).ToList();

            // Assert
            actual.Should().HaveCount(2);
            actual.Select(x => x.ID).Should().BeEquivalentTo(new[] { selectedItem1.ID, selectedItem2.ID });
        }

        private class TestableDatasourceSelectedItemsContentResolver : DatasourceSelectedItemsContentResolver
        {
            public IEnumerable<Item> GetItemsForTest(Item contextItem)
            {
                return GetItems(contextItem);
            }
        }
    }
}