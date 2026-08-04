using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.PrisePromise
{
    [DataContract]
    public class PricePromiseModel
    {
        [DataMember]
        [Required]
        [StringLength(30, MinimumLength = 1)]
        [RegularExpression(@"^[^0-9+;:""`|!?<>().,/\\@#$£%^&*]*$", ErrorMessage = "The field {0} must not contain invalid characters.")]
        public string Name { get; set; }

        [DataMember]
        [Required]
        public string BookingReference { get; set; }

        [DataMember]
        public string MarketCode { get; set; }

        [DataMember]
        [Required]
        public DateTimeOffset DepartureDate { get; set; }

        [DataMember]
        public bool? DifferentCompany { get; set; }

        [DataMember]
        [Required]
        public bool SameDatesOfTravel { get; set; }

        [DataMember]
        [Required]
        public bool SameFlights { get; set; }

        [DataMember]
        [Required]
        public bool SamePartyComposition { get; set; }

        [DataMember]
        [Required]
        public bool SameRoomType { get; set; }

        [DataMember]
        [Required]
        public bool InclusiveOn23kg { get; set; }

        [DataMember]
        [Required]
        public bool BookedWithinLast24h { get; set; }

        [DataMember]
        public bool InclusiveOfTransfers { get; set; }

        [DataMember]
        [Required]
        public string Link { get; set; }

        [DataMember]
        [Required]
        public IEnumerable<IFormFile> Screenshots { get; set; }
    }
}