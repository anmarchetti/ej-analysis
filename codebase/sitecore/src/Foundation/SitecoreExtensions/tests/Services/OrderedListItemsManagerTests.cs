using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.SitecoreExtensions.Tests.Services
{
    public class OrderedListItemsManagerTests
    {
        private readonly OrderedListItemsManager manager;

        public OrderedListItemsManagerTests()
        {
            manager = Substitute.ForPartsOf<OrderedListItemsManager>();
        }

        [Theory]
        [AutoData]
        public void GetOrderedItemIds_ShouldOrderItems_IfFieldsAndLookupItemsHasValues(ID id1, ID id2, ID id3, ID id4, string source)
        {
            // Arrange
            string controlValue = $"{id2}|{id1}|{id3}";
            Item fakeItem = new FakeItem();
            List<ID> lookupIds = new List<ID>() { id1, id2, id3, id4 };
            manager.GetLookupItemIds(Arg.Any<Item>(), Arg.Any<string>()).Returns(lookupIds);

            // Act
            var actual = manager.GetOrderedItemIds(controlValue, source, fakeItem);

            // Assert
            actual.Length.Should().Be(4);
            actual[0].Should().Be(id2);
            actual[1].Should().Be(id1);
            actual[2].Should().Be(id3);
            actual[3].Should().Be(id4);
        }

        [Theory]
        [AutoData]
        public void GetOrderedItemIds_ShouldBeEmpty_IfFieldsAndLookupItemsReturnEmtpy(string source)
        {
            // Arrange
            string controlValue = string.Empty;
            Item fakeItem = new FakeItem();
            List<ID> lookupIds = new List<ID>();
            manager.GetLookupItemIds(Arg.Any<Item>(), Arg.Any<string>()).Returns(lookupIds);

            // Act
            var actual = manager.GetOrderedItemIds(controlValue, source, fakeItem);

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void GetOrderedItems_ShouldOrderItems_IfFieldsAndLookupItemsHasValues(ID id1, ID id2, ID id3, ID id4, string source, string fieldName)
        {
            // Arrange
            string controlValue = $"{id2}|{id1}|{id3}";
            var fakeContextItem = new FakeItem().WithField(fieldName, controlValue);
            fakeContextItem.ToSitecoreItem().Fields[fieldName].Source.Returns(source);

            Item fakeItem1 = new FakeItem(id: id1);
            Item fakeItem2 = new FakeItem(id: id2);
            Item fakeItem3 = new FakeItem(id: id3);
            Item fakeItem4 = new FakeItem(id: id4);

            fakeContextItem.ToSitecoreItem().Fields[fieldName].Database.GetItem(id1, fakeItem1.Language).Returns(fakeItem1);
            fakeContextItem.ToSitecoreItem().Fields[fieldName].Database.GetItem(id2, fakeItem2.Language).Returns(fakeItem2);
            fakeContextItem.ToSitecoreItem().Fields[fieldName].Database.GetItem(id3, fakeItem3.Language).Returns(fakeItem3);
            fakeContextItem.ToSitecoreItem().Fields[fieldName].Database.GetItem(id4, fakeItem4.Language).Returns(fakeItem4);

            List<ID> lookupIds = new List<ID>() { id1, id2, id3, id4 };
            manager.GetLookupItemIds(Arg.Any<Item>(), Arg.Any<string>()).Returns(lookupIds);

            // Act
            var actual = manager.GetOrderedItems(fakeContextItem, fieldName);

            // Assert
            actual.Count.Should().Be(4);
            actual[0].ID.Should().Be(id2);
            actual[1].ID.Should().Be(id1);
            actual[2].ID.Should().Be(id3);
            actual[3].ID.Should().Be(id4);
        }
    }
}
