using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants
{
    /// <summary>
    /// Accommodation offers search request
    /// </summary>
    public class RoomVariantsSearchRequest : BaseSearchRequest
    {
        /// <summary>
        /// Accommodation code
        /// </summary>
        [Required]
        public string AccommodationId { get; set; }

        /// <summary>
        /// Outbound flight id
        /// </summary>
        [Required]
        public string OutboundRouteId { get; set; }

        /// <summary>
        /// Inbound flight id
        /// </summary>
        [Required]
        public string InboundRouteId { get; set; }

        /// <summary>
        /// Package id
        /// </summary>
        [Required]
        public string PackageId { get; set; }

        /// <summary>
        /// Alternative accomodations from other systems
        /// </summary>
        [BindProperty(Name = "altAcc")]
        public AlternativeAccomodation[] AlternativeAccomodations { get; set; } = Array.Empty<AlternativeAccomodation>();

        /// <summary>
        /// Whether accommodation is external or not
        /// </summary>
        public bool IsExt { get; set; }

        /// <summary>
        /// Optional selected transfer code
        /// </summary>
        public string Transfer { get; set; }
    }

    /// <summary>
    /// Alternative accomodation
    /// </summary>
    public class AlternativeAccomodation
    {
        /// <summary>
        /// Accommodation code
        /// </summary>
        [Required]
        [BindProperty(Name = "accId")]
        public string AccomodationId { get; set; }

        /// <summary>
        /// Package id
        /// </summary>
        [Required]
        [BindProperty(Name = "packId")]
        public string PackageId { get; set; }
    }
}
