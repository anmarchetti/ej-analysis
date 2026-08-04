using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.Api.Domain.Data.PackageOffers.PriceGraph
{
    /// <summary>
    /// Flights price graph search request
    /// </summary>
    public class PriceGraphMonthRequest : PriceGraphBaseRequest
    {
        /// <summary>
        /// The inital search date. Use ISO Format yyyy-MM-dd
        /// </summary>
        [Required]
        public string Start { get; set; }

        /// <summary>
        /// The inital search date. Use ISO Format yyyy-MM-dd
        /// </summary>
        [Required]
        public string End { get; set; }

    }
}
