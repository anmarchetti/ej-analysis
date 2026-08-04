using easyJet.Holidays.Api.Domain.Data.Hotels;

namespace easyJet.Holidays.External.AWS.Models.RequestedPrice
{
    /// <summary>
    /// Represents the response for a named search operation.
    /// </summary>
    public class NamedSearchResponse
    {
        /// <summary>
        /// Name of the search.
        /// </summary>
        public required string Name { get; set; }

        /// <summary>
        /// Number of adults included in the search.
        /// </summary>
        public int NumberOfAdults { get; set; }

        /// <summary>
        /// Number of children included in the search.
        /// </summary>
        public int NumberOfChildren { get; set; }

        /// <summary>
        /// Number of infants included in the search.
        /// </summary>
        public int NumberOfInfants { get; set; }

        /// <summary>
        /// Default duration of the search in days.
        /// </summary>
        public int DefaultDuration { get; set; }

        /// <summary>
        /// Ages of the children included in the search.
        /// </summary>
        public IEnumerable<string> ChildAges { get; set; }

        /// <summary>
        /// Theme type codes associated with the search.
        /// </summary>
        public IEnumerable<string> ThemeTypesCodes { get; set; }

        /// <summary>
        /// Periods by destination response for the search.
        /// </summary>
        public IEnumerable<PeriodByDestinationResponse> Periods { get; set; }

        /// <summary>
        /// Origin locations for the search.
        /// </summary>
        public IEnumerable<string> Origin { get; set; }

        /// <summary>
        /// Destination locations for the search.
        /// </summary>
        public IEnumerable<string> Destinations { get; set; }

        /// <summary>
        /// URL associated with the search.
        /// </summary>
        public Uri Url { get; set; }

        /// <summary>
        /// Start date of the search.
        /// </summary>
        public DateTime StartDate { get; set; }

        /// <summary>
        /// End date of the search.
        /// </summary>
        public DateTime EndDate { get; set; }

        /// <summary>
        /// Number of initial search days.
        /// </summary>
        public int InitialSearchDays { get; set; }

        /// <summary>
        /// Board types included in the search.
        /// </summary>
        public IEnumerable<string> BoardTypes { get; set; }

        /// <summary>
        /// Facility types included in the search.
        /// </summary>
        public IEnumerable<Facility> FacilityTypes { get; set; }

        /// <summary>
        /// Star ratings included in the search.
        /// </summary>
        public IEnumerable<string> StarRating { get; set; }

        /// <summary>
        /// TripAdvisor rating for the search.
        /// </summary>
        public double TripAdvisorRating { get; set; }

        /// <summary>
        /// Minimum price per person for the search.
        /// </summary>
        public decimal MinPPPrice { get; set; }

        /// <summary>
        /// Maximum price per person for the search.
        /// </summary>
        public decimal MaxPPPrice { get; set; }

        /// <summary>
        /// Minimum total price for the search.
        /// </summary>
        public decimal MinTotalPrice { get; set; }

        /// <summary>
        /// Maximum total price for the search.
        /// </summary>
        public decimal MaxTotalPrice { get; set; }

        /// <summary>
        /// Minimum discount percentage for the search.
        /// </summary>
        public decimal DiscountPercentsMin { get; set; }

        /// <summary>
        /// Maximum discount percentage for the search.
        /// </summary>
        public decimal DiscountPercentsMax { get; set; }

        /// <summary>
        /// Minimum discount amount for the search.
        /// </summary>
        public decimal DiscountAmountMin { get; set; }

        /// <summary>
        /// Maximum discount amount for the search.
        /// </summary>
        public decimal DiscountAmountMax { get; set; }

        /// <summary>
        /// Indicates whether the search is for discounted items only.
        /// </summary>
        public bool DiscountOnly { get; set; }

        /// <summary>
        /// Indicates whether the search has flexible date ranges.
        /// </summary>
        public bool IsFlexibleDatesRange { get; set; }

        /// <summary>
        /// Indicates whether the search is for free-for-kids offers only.
        /// </summary>
        public bool FreeForKidsOnly { get; set; }
        
        /// <summary>
        /// Assigned promo collection codes
        /// </summary>
        public IEnumerable<string> PromoCollections { get; set; }
    }
}
