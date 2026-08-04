using System;
using System.Collections.Generic;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class RequestedSearch : BaseSearchParameters
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="RequestedSearch"/> class.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        public RequestedSearch(Item item)
            : base(item)
        {
            if (item == null)
            {
                return;
            }

            SetChildAges(item, Constants.Fields.SearchParameters.ChildrenAges);
            SetThemeTypes(item, new[] { Constants.Fields.Filters.HolidayThemes, Constants.Fields.Filters.HolidayTypes });
            SetPromoCollections(item, Constants.Fields.Filters.PromoCollections);
        }

        /// <summary>
        /// Gets or sets origin.
        /// </summary>
        public List<string> Origin { get; set; }

        /// <summary>
        /// Gets or sets destinations.
        /// </summary>
        public List<string> Destinations { get; set; }

        /// <summary>
        /// Gets or sets start date.
        /// </summary>
        public DateTime StartDate { get; set; }

        /// <summary>
        /// Gets or sets end date.
        /// </summary>
        public DateTime EndDate { get; set; }

        /// <summary>
        /// Gets or sets InitialSearchDays.
        /// </summary>
        public int InitialSearchDays { get; set; }

        /// <summary>
        /// Gets or sets or sets periods.
        /// </summary>
        public List<TimePeriod> Periods { get; set; }

        /// <summary>
        /// Gets or sets or sets url.
        /// </summary>
        public string Url { get; set; }

        /// <summary>
        /// Gets or sets origin.
        /// </summary>
        public List<string> BoardTypes { get; set; }

        /// <summary>
        /// Gets or sets origin.
        /// </summary>
        public List<FacilityType> FacilityTypes { get; set; }

        /// <summary>
        /// Gets or sets start rating.
        /// </summary>
        public List<string> StarRating { get; set; }

        /// <summary>
        /// Gets or sets trip advisor rating.
        /// </summary>
        public float TripAdvisorRating { get; set; }

        /// <summary>
        /// Gets or sets min PP price.
        /// </summary>
        public float MinPPPrice { get; set; }

        /// <summary>
        /// Gets or sets max PP price.
        /// </summary>
        public float MaxPPPrice { get; set; }

        /// <summary>
        /// Gets or sets min total price.
        /// </summary>
        public float MinTotalPrice { get; set; }

        /// <summary>
        /// Gets or sets max total price.
        /// </summary>
        public float MaxTotalPrice { get; set; }

        /// <summary>
        /// Gets or sets discount percents min.
        /// </summary>
        public float DiscountPercentsMin { get; set; }

        /// <summary>
        /// Gets or sets discount percents max.
        /// </summary>
        public float DiscountPercentsMax { get; set; }

        /// <summary>
        /// Gets or sets discount amount min.
        /// </summary>
        public float DiscountAmountMin { get; set; }

        /// <summary>
        /// Gets or sets discount amount max.
        /// </summary>
        public float DiscountAmountMax { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether discount only.
        /// </summary>
        public bool DiscountOnly { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether Gets or sets is flexible dates range.
        /// </summary>
        public bool IsFlexibleDatesRange { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether free for kids only.
        /// </summary>
        public bool FreeForKidsOnly { get; set; }
    }
}