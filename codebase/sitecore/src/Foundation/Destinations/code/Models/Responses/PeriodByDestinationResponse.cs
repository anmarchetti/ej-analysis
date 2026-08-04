using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.Models.Domain;

namespace easyJet.Foundation.Destinations.Models.Responses
{
    public class PeriodByDestinationResponse : DatePeriodResponse
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="PeriodByDestinationResponse"/> class.
        /// </summary>
        /// <param name="item">Period by destination object.</param>
        public PeriodByDestinationResponse(PeriodByDestination item)
            : base(item)
        {
            if (item == null)
            {
                return;
            }

            DestinationCodes = item.Destinations?.Select(x => x.Code);
        }

        /// <summary>
        /// Gets destinations code.
        /// </summary>
        public IEnumerable<string> DestinationCodes { get; }
    }
}