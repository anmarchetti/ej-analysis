using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain.Base;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class CachedVirtualResorts : BaseCachedItem
    {
        public IEnumerable<VirtualResort> VirtualResorts { get; set; }
    }
}
