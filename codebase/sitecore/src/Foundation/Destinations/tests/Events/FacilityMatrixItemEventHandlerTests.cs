using easyJet.Foundation.Destinations.Events;
using FluentAssertions;
using Sitecore.Data.Events;
using Sitecore.Events;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Events
{
    public class FacilityMatrixItemEventHandlerTests
    {
        [Fact]
        public void FacilityMatrixCreateEvent_CodeGenerated()
        {
            // Arrange
            var itemFacilityMatrix = new FakeItem();
            itemFacilityMatrix.WithTemplate(Foundation.Destinations.Constants.TemplateIds.FacilityMatrix);
            itemFacilityMatrix.WithField("Code", string.Empty);
            itemFacilityMatrix.WithItemEditing();
            var item = itemFacilityMatrix.ToSitecoreItem();
            var onItemCreatedArgs = new ItemCreatedEventArgs(item);
            var eventArgs = new SitecoreEventArgs("anyGivenEvent", new object[] { onItemCreatedArgs }, new EventResult());

            // Act
            var eventHandler = new FacilityMatrixItemEventHandler();
            eventHandler.OnItemCreated(this, eventArgs);

            // Assert
            item["Code"].Should().NotBeNullOrEmpty();
            item["Code"].Should().BeEquivalentTo($"{item.Name}-code");
        }
    }
}
