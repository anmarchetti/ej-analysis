using System.Collections.Generic;
using System.Linq;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class SpecialRequestType : DatasourceObject
    {
        // Requires for deserialization
        public SpecialRequestType()
        {
        }

        public SpecialRequestType(Item item)
            : base(item)
        {
            Code = item?.Fields[Constants.Fields.DatasourceItem.Code]?.Value;
            Name = item?.Fields[Constants.Fields.DatasourceItem.Name]?.Value;

            MultilistField multilist = item?.Fields[Constants.Fields.SpecialRequestType.SpecialRequests];
            if (multilist != null)
            {
                SpecialRequests = multilist.GetItems().Select(request => new SpecialRequest(request));
            }
        }

        public IEnumerable<SpecialRequest> SpecialRequests { get; set; }
    }
}