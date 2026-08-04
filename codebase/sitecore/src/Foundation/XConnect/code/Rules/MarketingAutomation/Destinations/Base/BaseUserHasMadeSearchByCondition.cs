using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.PushNotifications.Extenstions;
using easyJet.Foundation.PushNotifications.Facets;
using easyJet.Foundation.XConnect.Common.Enums;
using Sitecore.Framework.Rules;
using Sitecore.XConnect;
using Sitecore.XConnect.Segmentation.Predicates;

namespace easyJet.Foundation.XConnect.Common.Rules.MarketingAutomation.Destinations.Base
{
    public abstract class BaseUserHasMadeSearchByCondition : ICondition
    {
        public string SearchDestination { get; set; }

        public StringOperationType Comparison { get; set; }

        protected abstract DestinationType Type { get; }

        public virtual bool Evaluate(IRuleExecutionContext context)
        {
            var contact = context.Fact<Contact>();
            var facets = contact.Interactions?.Select(interaction => interaction.UserSearchesFacet()).Where(facet => facet != null).ToList();
            var userSearches = facets?.SelectMany(us => us.Searches);
            return userSearches != null && IsConditionTrue(userSearches);
        }

        protected virtual bool IsConditionTrue(IEnumerable<UserSearch> userSearches) =>
            userSearches.Any(userSearch => userSearch.Destinations.Any(destination => destination.Type.Equals(Type.ToString(), StringComparison.OrdinalIgnoreCase) &&
                                                                                                 Comparison.Evaluate(destination.Name, SearchDestination)));
    }
}
