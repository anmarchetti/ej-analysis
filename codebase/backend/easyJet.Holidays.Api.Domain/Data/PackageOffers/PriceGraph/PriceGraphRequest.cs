using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.Api.Domain.Data.PackageOffers.PriceGraph
{
    /// <summary>
    /// Flights price graph search request
    /// </summary>
    public class PriceGraphRequest : PriceGraphBaseRequest
    {
        /// <summary>
        /// The inital search date. Use ISO Format yyyy-MM-dd
        /// </summary>
        [Required]
        public string InitialDate { get; set; }

    }
}
