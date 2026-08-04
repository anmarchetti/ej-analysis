using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class ExemptionList
    {
        public ExemptionList(Item item)
        {
            if (item != null)
            {
                BookingReferences = item.Fields[Constants.Fields.ExemptionList.BookingReferences].Value
                    .Split(new string[] { "," }, StringSplitOptions.RemoveEmptyEntries)
                    .Select(x => x.Replace(Environment.NewLine, string.Empty).Replace("\r", string.Empty));
            }
        }

        /// <summary>
        /// Gets or sets exemption list.
        /// </summary>
        public IEnumerable<string> BookingReferences { get; set; }
    }
}