using easyJet.Foundation.XConnect.Common.Enums;
using easyJet.Foundation.XConnect.Common.Rules.MarketingAutomation.Destinations.Base;

namespace easyJet.Foundation.XConnect.Common.Rules.MarketingAutomation.Destinations
{
    public class UserHasMadeSearchByRegion : BaseUserHasMadeSearchByCondition
    {
        protected override DestinationType Type => DestinationType.Region;
    }
}