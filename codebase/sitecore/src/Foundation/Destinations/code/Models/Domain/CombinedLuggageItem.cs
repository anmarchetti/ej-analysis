using System.Collections.Generic;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class CombinedLuggageItem : LuggageItemBase
    {
        public List<string> Codes { get; set; }
    }
}
