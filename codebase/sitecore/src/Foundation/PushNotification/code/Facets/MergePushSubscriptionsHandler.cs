using Sitecore.XConnect;
using Sitecore.XConnect.Service;

namespace easyJet.Foundation.PushNotifications.Facets
{
    /// <summary>
    /// Merge calculated facet handler determines what happens to this facet when two contacts are merged.
    /// In this, the PushSubscriptions will be merged by device ID.
    /// </summary>
    public class MergePushSubscriptionsHandler : MergingCalculatedFacetHandler<PushSubscriptions>
    {
        public MergePushSubscriptionsHandler()
            : base(PushSubscriptions.DefaultFacetKey, null)
        {
        }

        /// <summary>
        /// Merge facets by device ID.
        /// </summary>
        /// <param name="source">Source push notification.</param>
        /// <param name="target">Target push notification.</param>
        /// <returns>Is push notifications merged.</returns>
        protected override bool Merge(PushSubscriptions source, PushSubscriptions target)
        {
            if (source == null || target == null)
            {
                // No contacts changed - return false
                return false;
            }

            foreach (var device in source.Subscriptions.Keys)
            {
                if (target.Subscriptions.ContainsKey(device))
                {
                    target.Subscriptions[device] = source.Subscriptions[device];
                }
                else
                {
                    target.Subscriptions.Add(device, source.Subscriptions[device]);
                }
            }

            return true;
        }

        /// <summary>
        ///  Method determines what happens when a new interaction is submitted to xConnect.
        /// </summary>
        /// <param name="currentFacet">Current facet.</param>
        /// <param name="interaction">Interaction.</param>
        /// <returns>Is facet updated.</returns>
        protected override bool UpdateFacet(PushSubscriptions currentFacet, Interaction interaction)
        {
            // For calculated facets only
            // Return false as contact not changed by this method
            return false;
        }
    }
}