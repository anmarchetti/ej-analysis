using easyJet.Foundation.PushNotifications.Facets;
using Sitecore.XConnect;

namespace easyJet.Foundation.PushNotifications.Tests.Facet
{
    internal class MergePushSubscriptionsHandlerTest : MergePushSubscriptionsHandler
    {
        public bool MergePublic(PushSubscriptions source, PushSubscriptions target)
        {
            return Merge(source, target);
        }

        public bool UpdateFacetPublic(PushSubscriptions currentFacet, Interaction interaction)
        {
            return UpdateFacet(currentFacet, interaction);
        }
    }
}
