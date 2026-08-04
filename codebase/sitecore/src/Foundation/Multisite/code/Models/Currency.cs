using Sitecore.Data.Items;

namespace easyJet.Foundation.Multisite.Models
{
    public class Currency
    {
        public Currency(Item item)
        {
            Code = item?.Fields[Templates.Market.Fields.Code]?.Value;
        }

        public string Code { get; }
    }
}
