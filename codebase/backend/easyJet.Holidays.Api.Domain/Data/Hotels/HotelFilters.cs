#nullable enable

namespace easyJet.Holidays.Api.Domain.Data.Hotels
{
    /// <summary>
    /// Response model for sitecore api/DestinationsSearchFilters/GetAllFilters endpoint
    /// </summary>
    public class HotelFilters
    {
        public string Code { get; set; }

        public string Name { get; set; }

        public int StarRating { get; set; }

        /// <summary>
        /// Tripadvisor hotel rating
        /// </summary>
        public double TripAdvisorRating { get; set; }

        public BoardType[] Boards { get; set; }

        public FacilityGroup[] FacilityGroups { get; set; }

        /// <summary>
        /// All hotel types applicable to this hotel according to facility matrix from sitecore
        /// </summary>
        public HotelType[]? FacilityMatrix { get; set; }

        /// <summary>
        /// Pre-calculated facilities codes in upper case from Facility Groups
        /// </summary>
        public List<string> FacilitiesCodes { get; set; }
    }
}