using easyJet.Feature.Tracker.Events;
using easyJet.Foundation.Analytics.Models.Profiles;
using easyJet.Foundation.Analytics.Services;
using NSubstitute;
using NSubstitute.Extensions;
using Sitecore.Data.Events;
using Sitecore.Data.Items;
using Sitecore.Events;
using Xunit;

namespace easyJet.Feature.Tracker.Tests.Events
{
    public class ResortProfileItemEventHandlerTests
    {
        private readonly IProfileService profileServiceMock;
        private readonly ResortProfileItemEventHandler sut;

        public ResortProfileItemEventHandlerTests()
        {
            profileServiceMock = Substitute.For<IProfileService>();
            sut = Substitute.ForPartsOf<ResortProfileItemEventHandler>(profileServiceMock);
        }

        [Theory]
        [MemberData(nameof(ResortProfileItemEventHandlerTestData.ValidItems), MemberType = typeof(ResortProfileItemEventHandlerTestData))]
        public void OnItemCreated_WithSuitableItem_RetrievesParentProfileAndReferences(ItemCreatedEventArgs args)
        {
            // Arrange
            sut.Configure().WhenForAnyArgs(mock => mock.GetHotelThemeProfileForItem(default)).DoNotCallBase();
            sut.Configure().GetHotelThemeProfileForItem(default).ReturnsForAnyArgs(new HotelThemesProfile(default, default, default));
            var evArgs = new SitecoreEventArgs("anyGivenEvent", new object[] { args }, new EventResult());

            // Act
            sut.OnItemCreated(null, evArgs);

            // Assert
            profileServiceMock.ReceivedWithAnyArgs().TagGenericProfile<HotelThemesProfile>(default(Item), default, default);
        }

        [Theory]
        [MemberData(nameof(ResortProfileItemEventHandlerTestData.InvalidItems), MemberType = typeof(ResortProfileItemEventHandlerTestData))]
        public void OnItemCreated_WithInvalidItem_DoesNotTagProfile(ItemCreatedEventArgs args)
        {
            // Arrange
            var evArgs = new SitecoreEventArgs("anyGivenEvent", new object[] { args }, new EventResult());

            // Act
            sut.OnItemCreated(null, evArgs);

            // Assert
            profileServiceMock.DidNotReceiveWithAnyArgs().TagGenericProfile<HotelThemesProfile>(default(Item), default, default);
        }

        [Fact]
        public void OnItemCreated_WithNullArgs_DoesNotTagProfile()
        {
            // Arrange
            var evArgs = new SitecoreEventArgs("anyGivenEvent", new object[] { "not ItemCreatedEventArgs" }, new EventResult());

            // Act
            sut.OnItemCreated(null, evArgs);

            // Assert
            profileServiceMock.DidNotReceiveWithAnyArgs().TagGenericProfile<HotelThemesProfile>(default(Item), default, default);
        }
    }
}