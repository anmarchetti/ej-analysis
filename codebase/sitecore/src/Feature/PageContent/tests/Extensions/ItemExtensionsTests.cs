using easyJet.Feature.PageContent.Extensions;
using FluentAssertions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Feature.PageContent.Tests.Extensions
{
    public class ItemExtensionsTests
    {
        public ItemExtensionsTests()
        {
        }

        [Fact]
        public void IsTransparentItem_ForItemWithTransparency_CorrectlyIdentifiesAsTransparent()
        {
            // Arrange
            var itemID = ID.NewID;
            var db = new Db()
            {
                new DbItem("testItem", itemID)
                {
                    Fields = { { Constants.Fields.TransparentFolder.TransparentItem, "1" } }
                }
            };
            var item = db.GetItem(itemID);

            // Act
            var result = item.IsTransparentItem();

            // Assert
            result.Should().BeTrue();
        }

        [Theory]
        [MemberData(nameof(ItemExtensionsTestData.ItemsWithoutTransparency), MemberType = typeof(ItemExtensionsTestData))]
        public void IsTransparentItem_ForItemWithoutTransparency_CorrectlyIdentifiesAsNotTransparent(Item testSubject)
        {
            // Arrange

            // Act
            var result = testSubject.IsTransparentItem();

            // Assert
            result.Should().BeFalse();
        }
    }
}
