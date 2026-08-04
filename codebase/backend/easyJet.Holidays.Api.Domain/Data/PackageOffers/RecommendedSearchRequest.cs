using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.Api.Domain.Data.PackageOffers
{
    public class RecommendedSearchRequest : PackagesSearchRequest, IValidatableObject
    {
        public string Departure
        {
            get => base.Departure;
            set => base.Departure = value;
        }

        public string StartDate
        {
            get => base.StartDate;
            set => base.StartDate = value;
        }

        /// <summary>
        /// Page where recommendation will be shown
        /// </summary>
        public string PageType { get; set; }

        /// <summary>
        /// Place on a page where recommendation will be shown
        /// </summary>
        public string PlacementId { get; set; }

        public bool IsDestinationSearch { get; set; }

        public bool IsLivePrice { get; set; }

        public string HotelThemeTypes { get; set; }

        public string RequestedAmountOfHotels { get; set; }

        public new IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            var results = new List<ValidationResult>();
            if (IsDestinationSearch)
            {
                // ignore validation for destination recommendation request
                return results;
            }
            return base.Validate(validationContext);
        }
    }
}
