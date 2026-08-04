using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.Api.Domain.Data.Hotels.Facilities
{
    /// <summary>
    /// Hotel featured facility.
    /// </summary>
    public class FeaturedFacility
    {
        /// <summary>
        /// Featured facility title.
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Featured facility description.
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Featured facility image url.
        /// </summary>
        public string Image { get; set; }

        /// <summary>
        /// Featured facility link.
        /// </summary>
        public Link Link { get; set; }

        /// <summary>
        /// Featured facility external image.
        /// </summary>
        public HotelImage ExternalImage { get; set; }
    }
}
