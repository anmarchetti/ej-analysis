using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking
{
    public class AlternativePackage
    {
        /// <summary>
        /// Price of the alternative package
        /// </summary>
        [DataMember(Name = "AlternativePackagePrice")]
        [Required]
        public decimal AlternativePackagePrice { get; set; }

        /// <summary>
        /// Price per person of the alternative package
        /// </summary>
        [DataMember(Name = "AlternativePackagePricePerPerson")]
        [Required]
        public decimal AlternativePackagePricePerPerson { get; set; }

        /// <summary>
        /// Duration of the booking
        /// </summary>
        [DataMember(Name = "Duration")]
        [Required]
        public int Duration { get; set; }

        /// <summary>
        /// Transport data
        /// </summary>
        [DataMember(Name = "transports")]
        [Required]
        public Transport Transport { get; set; }
    }
}
