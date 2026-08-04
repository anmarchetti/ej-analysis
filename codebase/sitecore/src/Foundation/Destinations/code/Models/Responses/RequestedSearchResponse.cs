using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.Models.Domain;

namespace easyJet.Foundation.Destinations.Models.Responses
{
    public class RequestedSearchResponse : BaseSearchParametersResponse
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="RequestedSearchResponse"/> class.
        /// </summary>
        /// <param name="requestedSearch">Requested search object.</param>
        public RequestedSearchResponse(RequestedSearch requestedSearch)
            : base(requestedSearch)
        {
            Origin = requestedSearch.Origin;
            Destinations = requestedSearch.Destinations;
            Url = requestedSearch.Url;
            Periods = requestedSearch.Periods?.Select(x => new DatePeriodResponse(x));
            StartDate = requestedSearch.StartDate.ToString("o");
            EndDate = requestedSearch.EndDate.ToString("o");
            InitialSearchDays = requestedSearch.InitialSearchDays;
            BoardTypes = requestedSearch.BoardTypes;
            FacilityTypes = requestedSearch.FacilityTypes;
            StarRating = requestedSearch.StarRating;
            TripAdvisorRating = requestedSearch.TripAdvisorRating;
            MinPPPrice = requestedSearch.MinPPPrice;
            MaxPPPrice = requestedSearch.MaxPPPrice;
            MinTotalPrice = requestedSearch.MinTotalPrice;
            MaxTotalPrice = requestedSearch.MaxTotalPrice;
            DiscountAmountMin = requestedSearch.DiscountAmountMin;
            DiscountAmountMax = requestedSearch.DiscountAmountMax;
            DiscountPercentsMin = requestedSearch.DiscountPercentsMin;
            DiscountPercentsMax = requestedSearch.DiscountPercentsMax;
            DiscountOnly = requestedSearch.DiscountOnly;
            IsFlexibleDatesRange = requestedSearch.IsFlexibleDatesRange;
            FreeForKidsOnly = requestedSearch.FreeForKidsOnly;
            PromoCollections = requestedSearch.PromoCollections;
        }

        /// <summary>
        /// Gets start date.
        /// </summary>
        public string StartDate { get; }

        /// <summary>
        /// Gets end date.
        /// </summary>
        public string EndDate { get; }

        /// <summary>
        /// Gets the InitialSearchDays.
        /// </summary>
        public int InitialSearchDays { get; }

        /// <summary>
        /// Gets origin.
        /// </summary>
        public IEnumerable<string> Origin { get; }

        /// <summary>
        /// Gets Destinations.
        /// </summary>
        public IEnumerable<string> Destinations { get; }

        /// <summary>
        /// Gets url.
        /// </summary>
        public string Url { get; }

        /// <summary>
        /// Gets periods.
        /// </summary>
        public IEnumerable<DatePeriodResponse> Periods { get; }

        /// <summary>
        /// Gets origin.
        /// </summary>
        public IEnumerable<string> BoardTypes { get; }

        /// <summary>
        /// Gets origin.
        /// </summary>
        public IEnumerable<FacilityType> FacilityTypes { get; }

        /// <summary>
        /// Gets start rating.
        /// </summary>
        public IEnumerable<string> StarRating { get; }

        /// <summary>
        /// Gets trip advisor rating.
        /// </summary>
        public float TripAdvisorRating { get; }

        /// <summary>
        /// Gets min PP price.
        /// </summary>
        public float MinPPPrice { get; }

        /// <summary>
        /// Gets max PP price.
        /// </summary>
        public float MaxPPPrice { get; }

        /// <summary>
        /// Gets min total price.
        /// </summary>
        public float MinTotalPrice { get; }

        /// <summary>
        /// Gets max total price.
        /// </summary>
        public float MaxTotalPrice { get; }

        /// <summary>
        /// Gets discount percents min.
        /// </summary>
        public float DiscountPercentsMin { get; }

        /// <summary>
        /// Gets discount percents max.
        /// </summary>
        public float DiscountPercentsMax { get; }

        /// <summary>
        /// Gets discount amount min.
        /// </summary>
        public float DiscountAmountMin { get; }

        /// <summary>
        /// Gets discount amount max.
        /// </summary>
        public float DiscountAmountMax { get; }

        /// <summary>
        /// Gets a value indicating whether discount only.
        /// </summary>
        public bool DiscountOnly { get; }

        /// <summary>
        /// Gets a value indicating whether gets is flexible dates range.
        /// </summary>
        public bool IsFlexibleDatesRange { get; }

        /// <summary>
        /// Gets or sets a value indicating whether free for kids only.
        /// </summary>
        public bool FreeForKidsOnly { get; set; }

        /// <summary>
        /// Gets or sets assigned promo collections codes.
        /// </summary>
        public IEnumerable<string> PromoCollections { get; set; }
    }
}