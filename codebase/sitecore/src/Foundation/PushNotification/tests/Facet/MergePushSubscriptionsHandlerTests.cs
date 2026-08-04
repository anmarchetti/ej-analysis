using AutoFixture.Xunit2;
using easyJet.Foundation.PushNotifications.Facets;
using FluentAssertions;
using Xunit;

namespace easyJet.Foundation.PushNotifications.Tests.Facet
{
    public class MergePushSubscriptionsHandlerTests : MergePushSubscriptionsHandler
    {
        private readonly MergePushSubscriptionsHandlerTest mergePushSubscriptionsHandler;

        public MergePushSubscriptionsHandlerTests()
        {
            mergePushSubscriptionsHandler = new MergePushSubscriptionsHandlerTest();
        }

        [Fact]
        public void Merge_ShoulBeFalse_IfSourceOrTargetNull()
        {
            // Act
            var actual = mergePushSubscriptionsHandler.MergePublic(null, null);

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void UpdateFacet_ShoulBeFalse()
        {
            // Act
            var actual = mergePushSubscriptionsHandler.UpdateFacetPublic(null, null);

            // Assert
            actual.Should().BeFalse();
        }

        [AutoData]
        [Theory]
        public void Merge_ShoulBeTrue_IfSourceOrTargetIsNotNull(PushSubscriptions source, PushSubscriptions target)
        {
            // Act
            var actual = mergePushSubscriptionsHandler.MergePublic(source, target);

            // Assert
            actual.Should().BeTrue();
        }
    }
}
