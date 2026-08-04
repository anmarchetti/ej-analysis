using System.Collections.Generic;
using EasyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain.CancelAndCredit
{
    public class CancelAndCreditRule
    {
        public CancelAndCreditRule(Item item)
        {
            if (item == null)
            {
                return;
            }

            Name = item.Name;
            AirportsIds = item.Fields[Constants.Fields.BaseCreditSetting.DestinationAirports].Value?.Separate();
            ParentName = item.Parent.Name;
        }

        /// <summary>
        /// Gets or sets cancel and credit rule name.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Gets or sets selected airports ids.
        /// </summary>
        public IEnumerable<string> AirportsIds { get; set; }

        /// <summary>
        /// Gets or sets cancel and credit folder name.
        /// </summary>
        public string ParentName { get; set; }
    }
}