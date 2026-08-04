using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class AirportBase : DatasourceObject
    {
        public AirportBase()
        {
        }

        public AirportBase(Item item)
            : base(item)
        {
        }
    }
}
