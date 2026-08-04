using System.Collections.Generic;
using System.Linq;
using System.Web.Script.Serialization;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Multisite.Models
{
    public class MarketSettings
    {
        public MarketSettings(Item item)
        {
            Code = item?.Fields[Templates.Market.Fields.Code]?.Value;
            CountryCode = item?.Fields[Templates.Market.Fields.CountryCode]?.Value;
            var currencyItem = ((LookupField)item?.Fields[Templates.Market.Fields.Currency])?.TargetItem;
            Currency = currencyItem != null ? new Currency(currencyItem) : null;
            AirportDepartureCodes = item?
                .GetItems(Templates.Market.Fields.DepartureAirports)
                .Select(x => x[Templates.Market.Fields.DepartureAirportCode])
                .ToHashSet();
            DefaultDepositPrice = MainUtil.GetInt(item?.Fields[Templates.Market.Fields.DefaultDepositPrice]?.Value, 0);

            Item = item;
        }

        public string Code { get; }

        public string CountryCode { get; set; }

        public Currency Currency { get; }

        public HashSet<string> AirportDepartureCodes { get; set; }

        public int DefaultDepositPrice { get; set; }

        [ScriptIgnore]
        public Item Item { get; set; }
    }
}
