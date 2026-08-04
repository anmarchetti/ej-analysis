using Sitecore.Data.Items;

namespace easyJet.Foundation.SiteModes.Models.Domain
{
    public class MaintenanceModePerMarkets : BaseMaintenanceMode
    {
        public MaintenanceModePerMarkets()
          : base(null)
        {
        }

        public MaintenanceModePerMarkets(Item item, string marketCode)
            : base(item)
        {
            MarketCode = marketCode;
        }

        public string MarketCode { get; set; }
    }
}