using System.ComponentModel.DataAnnotations;
using easyJet.Holidays.Api.Domain.Attributes;

namespace easyJet.Holidays.Api.Domain.Data.PackageOffers.PriceGraph
{
    /// <summary>
    /// Flights price graph search request
    /// </summary>
    public class PriceGraphBaseRequest : BaseSearchRequest
    {
        /// <summary>
        /// Comma separated list of accommodation id's, e.g. 345678,345654
        /// </summary>
        [Required]
        [TrimCommaSeparatedValues]
        public string AccommodationIds { get; set; }

        /// <summary>
        /// Flag to dictate results set.  Either keep room selection or order by cheapest room.
        /// </summary>
        public bool? IsCheapestRoom { get; set; }
    }
}
