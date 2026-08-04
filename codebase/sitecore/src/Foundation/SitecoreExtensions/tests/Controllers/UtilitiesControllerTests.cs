using System.Linq;
using System.Net;
using AutoFixture.Xunit2;
using easyJet.Foundation.SitecoreExtensions.Controllers;
using easyJet.Foundation.SitecoreExtensions.Models;
using FluentAssertions;
using NSubstitute;
using Sitecore.ContentSearch;
using Sitecore.Data;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.SitecoreExtensions.Tests.Controllers
{
    public class UtilitiesControllerTests
    {
        private readonly UtilitiesController controller;

        public UtilitiesControllerTests()
        {
            controller = new UtilitiesController();
        }

        [Theory]
        [AutoData]
        public void IndexRebuild_ShouldBeFalse_IfThrowException(string indexName)
        {
            // Act
            var actual = controller.IndexRebuild(indexName);

            // Assert
            actual.Should().NotBeNull();
        }

        [Theory(Skip = "After the sitecore migration, the test has been broken. Need to be fixed.")]
        [AutoData]
        public void IndexRebuild_ShouldBeTrue_IfIndexRebuilded(string indexName)
        {
            try
            {
                // Assert
                var index = Substitute.For<ISearchIndex>();
                ContentSearchManager.SearchConfiguration.Indexes.Add(indexName, index);

                // Act
                var actual = controller.IndexRebuild(indexName);

                // Assert
                actual.Should().StartWith("Index_Update");
            }
            finally
            {
               ContentSearchManager.SearchConfiguration.Indexes.Remove(indexName);
            }
        }

        [Fact]
        public void SortItems_ShouldReturnBadRequest_WhenSortItemsIsNull()
        {
            // Act
            var actual = controller.SortItems(null).StatusCode;

            // Assert
            actual.Should().Be(HttpStatusCode.BadRequest);
        }

        [Fact]
        public void SortItems_ShouldReturnBadRequest_WhenItemIdsIsNull()
        {
            // Arrange
            var sortItems = new SortItems { ItemIds = null, SortOrders = new[] { "100" } };

            // Act
            var actual = controller.SortItems(sortItems).StatusCode;

            // Assert
            actual.Should().Be(HttpStatusCode.BadRequest);
        }

        [Fact]
        public void SortItems_ShouldReturnBadRequest_WhenSortOrdersIsNull()
        {
            // Arrange
            var sortItems = new SortItems { ItemIds = new[] { ID.NewID.ToString() }, SortOrders = null };

            // Act
            var actual = controller.SortItems(sortItems).StatusCode;

            // Assert
            actual.Should().Be(HttpStatusCode.BadRequest);
        }

        [Theory]
        [AutoData]
        public void SortItems_ShouldReturnNoContentResponseMessage_IfExceptionDoesNotThrown(Db db, SortItems sortItems)
        {
            // Arrange
            foreach (string itemId in sortItems.ItemIds)
            {
                db.Add(new DbItem("itemToSort", new ID(itemId)));
            }

            // Act
            var actual = controller.SortItems(sortItems).StatusCode;

            // Assert
            actual.Should().Be(HttpStatusCode.NoContent);
        }

        [Theory]
        [AutoData]
        public void DeleteItems_ShouldReturnNoContentResponseMessageAndDeleteItems_IfExceptionDoesNotThrown(Db db, ID[] ids)
        {
            // Arrange
            foreach (var itemId in ids)
            {
                db.Add(new DbItem($"Item-{itemId}", itemId));
            }

            // Act
            var actual = controller.DeleteItems(ids.Select(x => x.ToString()).ToArray()).StatusCode;
            var deletedItem = db.GetItem(ids[0]);

            // Assert
            deletedItem.Should().BeNull();
            actual.Should().Be(HttpStatusCode.NoContent);
        }
    }
}
