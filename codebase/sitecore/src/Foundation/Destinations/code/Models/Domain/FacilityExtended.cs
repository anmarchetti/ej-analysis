using System;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class FacilityExtended : Facility
    {
        public FacilityExtended()
        {
        }

        public FacilityExtended(Item item)
            : base(item)
        {
            ItemID = item.ID.Guid;
        }

        public Guid ItemID { get; set; }
    }
}