using System.Collections.Generic;

namespace easyJet.Foundation.Destinations.Models.Responses
{
    public class RequestedSearchesResponse
    {
        /// <summary>
        /// Gets or sets requested searches.
        /// </summary>
        public IEnumerable<RequestedSearchResponse> RequestedSearches { get; set; }
    }
}