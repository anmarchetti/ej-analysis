using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.PushNotifications.Extenstions;
using Sitecore.Framework.Rules;
using Sitecore.XConnect;

namespace easyJet.Foundation.XConnect.Common.Rules.MarketingAutomation.Destinations
{
    public class UserHasMadeSearchFromDepartureAirports : ICondition
    {
        public string DepartureAirports { get; set; }

        public bool Evaluate(IRuleExecutionContext context)
        {
            var contact = context.Fact<Contact>();
            var facets = contact.Interactions?.Select(interaction => interaction.UserSearchesFacet()).Where(facet => facet != null).ToList();
            var userSearches = facets?.SelectMany(us => us.Searches);
            var departureAirports = DepartureAirports?.Split(new[] { "," }, StringSplitOptions.RemoveEmptyEntries).Select(x => x.Trim()).ToList() ?? new List<string>();

            var isConditionTrue = userSearches?.Any(x => x.Airports.Any(i => departureAirports.Any(da => da.Equals(i.Code, StringComparison.OrdinalIgnoreCase)))) ?? false;

            return userSearches != null && isConditionTrue;
        }
    }
}