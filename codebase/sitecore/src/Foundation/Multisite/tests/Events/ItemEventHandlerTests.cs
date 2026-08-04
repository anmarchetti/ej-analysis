using AutoFixture.Xunit2;
using easyJet.Foundation.Multisite.Events;
using FluentAssertions;
using Sitecore;
using Sitecore.Events;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Multisite.Tests.Events
{
    public class ItemEventHandlerTests
    {
        private readonly ItemEventHandler handler;

        public ItemEventHandlerTests()
        {
            handler = new ItemEventHandler();
        }

        [Theory]
        [AutoData]
        public void OnVersionAdded_PublishFieldsShouldBeEmpry_IfNewVerionAdded(Db db)
        {
            // Arrange
            var itemDb = new DbItem("Item");
            itemDb.Fields.Add(FieldIDs.ValidFrom, string.Empty);
            itemDb.Fields.Add(FieldIDs.ValidTo, string.Empty);

            db.Add(itemDb);
            var item = db.GetItem(itemDb.ID);
            var args = new SitecoreEventArgs("OnVersionAdded", new object[] { item }, new EventResult());

            // Act
            item.Editing.BeginEdit();
            handler.OnVersionAdded(null, args);
            item.Editing.EndEdit();

            // Assert
            item[FieldIDs.ValidFrom].Should().BeEmpty();
            item[FieldIDs.ValidTo].Should().BeEmpty();
        }
    }
}
