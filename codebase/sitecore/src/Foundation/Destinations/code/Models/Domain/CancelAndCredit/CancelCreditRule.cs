using Sitecore;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain.CancelAndCredit
{
    /// <summary>
    /// Cancel and credit setting.
    /// </summary>
    public class CancelCreditRule : BaseCreditRule
    {
        public CancelCreditRule(Item item)
            : base(item)
        {
            if (item != null)
            {
                AllowCancelPartialRefundLess28Days = MainUtil.GetBool(item.Fields[Constants.Fields.CancelCreditSetting.AllowCancelPartialRefundLess28Days].Value, false);
            }
        }

        /// <summary>
        /// Gets or sets a value indicating whether gets or sets allow cancel & partial refund when it is less than 28 days from departure.
        /// </summary>
        public bool AllowCancelPartialRefundLess28Days { get; set; }
    }
}