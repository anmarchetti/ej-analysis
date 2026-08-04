using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.Api.Domain.Data.PackageOffers.AlternativeFlights
{
    /// <summary>
    /// Alternative flights  search request
    /// </summary>
    public class AlternativeFlightsSearchRequest : BaseSearchRequest
    {
        /// <summary>
        /// Accommodation code, e.g. 345678
        /// </summary>
        [Required]
        public string AccommodationId { get; set; }

        /// <summary>
        /// Will add hotel info toresponse
        /// </summary>
        public bool? WithHotels { get; set; }

        public string OriginalAirport { get; set; }
    }
}
