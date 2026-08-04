using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.Api.Domain.Data.Hotels.Facilities
{
    /// <summary>
    /// Hotel facility group
    /// </summary>
    public class AccommodationFacilityGroup
    {
        /// <summary>
        /// Group code
        /// </summary>
        public string Code { get; set; }

        /// <summary>
        /// Group name
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Group icon url
        /// </summary>
        public string IconUrl { get; set; }

        /// <summary>
        /// Group Id
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Group description
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Image
        /// </summary>
        public HotelImage Image { get; set; }

        /// <summary>
        /// Group Title
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Group items
        /// </summary>
        public IEnumerable<AccommodationFacility> Items { get; set; }
    }
}