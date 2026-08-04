using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain.CancelAndCredit
{
    /// <summary>
    /// Credit only rule setting.
    /// </summary>
    public class CreditOnlyRule : BaseCreditRule
    {
        public CreditOnlyRule(Item item)
            : base(item)
        {
        }
    }
}