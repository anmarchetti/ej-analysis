using System.Collections.Generic;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class AcmiSettings
    {
        public Dictionary<string, string> MessagesByCode { get; set; }

        public List<Carrier> Carriers { get; set; }
    }
}
