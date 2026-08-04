using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.Api.Domain.Data.Destinations
{
    /// <summary>
    /// Destination titles request body
    /// </summary>
    public class GetTitlesRequest
    {
        /// <summary>
        /// Destination codes
        /// </summary>
        [Required]
        [MinLength(1)]
        public string[] Codes { get; set; }
    }
}
