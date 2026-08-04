using System.Collections.Generic;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Atcom.Models.Sitecore
{
    public class Destination
    {
        public Destination(Item item)
        {
            Item = item;
            Children = new List<Destination>();
        }

        public Item Item { get; set; }

        public List<Destination> Children { get; set; }
    }
}