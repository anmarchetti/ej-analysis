using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain.Base;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class CachedVirtualRegionsItem : BaseCachedItem
    {
        public IEnumerable<VirtualRegionItem> VirtualRegions { get; set; }
    }
}
