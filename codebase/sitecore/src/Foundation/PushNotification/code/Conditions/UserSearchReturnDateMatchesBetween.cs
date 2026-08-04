using System;
using System.Linq;
using easyJet.Foundation.PushNotifications.Extenstions;
using easyJet.Foundation.PushNotifications.Utils;
using Sitecore.Framework.Rules;
using Sitecore.XConnect;

namespace easyJet.Foundation.PushNotifications.Conditions
{
    public class UserSearchReturnDateMatchesBetween : ICondition
    {
        public string MinDate { get; set; }

        public string MaxDate { get; set; }

        public bool Evaluate(IRuleExecutionContext context)
        {
            Contact contact = context.Fact<Contact>();

            // TODO: make MaxDate and MinDate as DateTime property when Sitecore's issue with parsing ISO DateTime in condtion rule will be resolved.
            if (!DateUtil.TryParseIsoDateToDateTime(MinDate, out var minDate) || !DateUtil.TryParseIsoDateToDateTime(MaxDate, out var maxDate))
            {
                return false;
            }

            return contact.Interactions != null && contact.Interactions.Any(i => i.UserSearchesFacet() != null && i.UserSearchesFacet().Searches.Any(s =>
            {
                DateTime? endData = s.EndDate;
                return endData.HasValue && endData >= minDate && endData <= maxDate;
            }));
        }
    }
}