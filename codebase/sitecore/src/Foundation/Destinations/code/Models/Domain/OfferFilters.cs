using System.Collections.Generic;
using System.Linq;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class OfferFilters
    {
        public IEnumerable<OfferFilter> Filters { get; set; }

        public OfferFilters(Item item)
        {
            Filters = item.Children.Select(x => new OfferFilter(x));
        }
    }
}