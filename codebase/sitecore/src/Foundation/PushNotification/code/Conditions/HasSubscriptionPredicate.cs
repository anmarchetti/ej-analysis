using easyJet.Foundation.PushNotifications.Facets;
using Sitecore.Framework.Rules;
using Sitecore.XConnect;

namespace easyJet.Foundation.PushNotifications.Conditions
{
    /// <summary>
    /// XConnect rule which check if contact is subscribed for Web Push Notifications.
    /// </summary>
    public class HasSubscriptionPredicate : ICondition
    {
        public bool Evaluate(IRuleExecutionContext context)
        {
            Contact contact = context.Fact<Contact>();

            var subscriptions = contact.GetFacet<PushSubscriptions>();

            return subscriptions != null && subscriptions.Subscriptions.Count > 0;
        }
    }
}