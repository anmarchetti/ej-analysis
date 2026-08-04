using System.Collections.Generic;
using Sitecore.Data.Items;

namespace easyJet.Foundation.SiteModes.Models.Domain
{
    public class MaintenanceModeSettings : BaseMaintenanceMode
    {
        public MaintenanceModeSettings(Item item)
                : base(item)
        {
        }

        /// <summary>
        /// Gets or Sets maintenance mode settings per market
        /// Where 'key' - market code, and 'value' is maintenance mode setting.
        /// </summary>
        public Dictionary<string, MaintenanceModePerMarkets> MaintenanceModePerMarkets { get; set; }
    }
}