using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain.Base;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class CachedVirtualRegions : BaseCachedItem
    {
        public IEnumerable<VirtualRegion> VirtualRegionsCodes { get; set; }
    }
}
