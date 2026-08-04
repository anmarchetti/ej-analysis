using easyJet.Foundation.XConnect.Common.Enums;
using easyJet.Foundation.XConnect.Common.Rules.MarketingAutomation.Destinations.Base;

namespace easyJet.Foundation.XConnect.Common.Rules.MarketingAutomation.Destinations
{
    public class UserHasMadeSearchByResort : BaseUserHasMadeSearchByCondition
    {
        protected override DestinationType Type => DestinationType.Resort;
    }
}