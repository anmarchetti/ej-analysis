using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.Api.Domain.Data.PackageOffers.ShortList
{
    /// <summary>
    /// ShortList hotel request
    /// </summary>
    public class ShortListHotelRequest
    {
        /// <summary>
        /// Gets or sets the giata code.
        /// </summary>
        [Required]
        public string GiataCode { get; set; }

        /// <summary>
        /// Initial offer theme with type (e.g. "BO", "BL"...)
        /// </summary>
        public string ITheme { get; set; }
    }
}
