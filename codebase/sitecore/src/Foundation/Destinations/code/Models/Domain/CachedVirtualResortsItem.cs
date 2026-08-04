using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain.Base;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class CachedVirtualResortsItem : BaseCachedItem
    {
        public IEnumerable<VirtualResortItem> VirtualResorts { get; set; }
    }
}
