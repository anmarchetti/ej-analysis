using System.Collections.Generic;

namespace easyJet.Foundation.Destinations.Models.Responses
{
    public class LivePriceSettingsResponse
    {
        public IEnumerable<NamedSearchResponse> NamedSearches { get; set; }
    }
}