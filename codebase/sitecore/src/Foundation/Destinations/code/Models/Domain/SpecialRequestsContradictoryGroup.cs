using System.Collections.Generic;
using System.Linq;
using Sitecore;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class SpecialRequestsContradictoryGroup : DatasourceObject
    {
        public SpecialRequestsContradictoryGroup()
        {
        }

        public SpecialRequestsContradictoryGroup(Item item)
            : base(item)
        {
            Name = item.DisplayName;

            MultilistField multilist = item?.Fields[Constants.Fields.SpecialRequestsContradictoryOptions.SpecialRequestsContradictoryGroupOptions];
            if (multilist != null)
            {
                SpecialRequests = multilist.GetItems().Select(request => new SpecialRequest(request));
            }
        }

        public IEnumerable<SpecialRequest> SpecialRequests { get; set; }
    }
}