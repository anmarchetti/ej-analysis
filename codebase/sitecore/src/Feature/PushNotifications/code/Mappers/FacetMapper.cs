using System.Collections.Generic;
using easyJet.Foundation.PushNotifications.Facets;

namespace easyJet.Feature.PushNotifications.Mappers
{
    public static class FacetMapper
    {
        public static PushSubscription MapFromPushSubscriptionRequest(Models.Domain.PushSubscription subscription)
        {
            var facetSubscription = new PushSubscription();

            // If the token has value it means that the contact subscribes to push notifications via Safari.
            if (!string.IsNullOrEmpty(subscription.Token))
            {
                facetSubscription.Token = subscription.Token;
            }
            else
            {
                facetSubscription.Endpoint = subscription.Endpoint;
                facetSubscription.Keys = new Dictionary<string, string>();

                foreach (var key in subscription.Keys.Keys)
                {
                    facetSubscription.Keys.Add(key, subscription.Keys[key]);
                }
            }

            return facetSubscription;
        }
    }
}