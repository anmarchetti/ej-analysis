using System.Collections.Generic;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class LuggageCategory
    {
        public string Code { get; set; }

        public string Name { get; set; }

        public string Type { get; set; }

        public List<LuggageItemBase> Children { get; set; }
    }
}
