using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.Models.Domain;

namespace easyJet.Foundation.Destinations.Models.Responses
{
    public class NamedSearchResponse : BaseSearchParametersResponse
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="NamedSearchResponse"/> class.
        /// </summary>
        /// <param name="item">Named search item.</param>
        public NamedSearchResponse(NamedSearchItem item)
            : base(item)
        {
            Periods = item.Periods?.Select(x => new PeriodByDestinationResponse(x));
        }

        /// <summary>
        /// Gets periods.
        /// </summary>
        public IEnumerable<PeriodByDestinationResponse> Periods { get; }
    }
}