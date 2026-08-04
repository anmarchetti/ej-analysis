using System.Collections.Generic;
using Newtonsoft.Json;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class LuggageRoot
    {
        public List<LuggageCategory> LuggageCategories { get; set; }
    }
}
