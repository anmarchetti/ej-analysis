using System;
using System.Linq;
using Sitecore.XConnect;
using Sitecore.XConnect.DataTools.Abstractions.Conditions;

namespace easyJet.Foundation.XConnect.Common.PurgeConditions
{
    public class AnonymousWithoutPushNotificationsCondition : ICondition
    {
        private const string PushNotificationsSource = "pushnotifications";

        public string ConditionId { get; } = nameof(AnonymousWithoutPushNotificationsCondition);

        public bool IsAccepted(Contact contact)
        {
            return !contact.IsKnown && !contact.Identifiers.Any(id => id.Source.Equals(PushNotificationsSource, StringComparison.OrdinalIgnoreCase));
        }
    }
}