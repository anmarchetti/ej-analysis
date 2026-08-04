using System.ComponentModel;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class LuggageItemBase
    {
        public string Name { get; set; }

        public string Description { get; set; }

        public string Icon { get; set; }

        public bool IsLuggageItemEnabled { get; set; }

        public string Type { get; set; }
    }
}
