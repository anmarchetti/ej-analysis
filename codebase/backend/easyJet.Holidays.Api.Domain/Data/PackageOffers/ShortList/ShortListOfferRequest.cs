using easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.ShortList;
using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.Api.Domain.Data.PackageOffers.AccommodationOffer
{
    public class ShortListOfferRequest : AccommodationOfferRequest
    {
        /// <summary>
        /// Initial offer departure airport code
        /// </summary>
        public string IDepAirport { get; set; }

        /// <summary>
        /// Initial offer arrival airport code
        /// </summary>
        public string IArrAirport { get; set; }

        /// <summary>
        /// Initial offer theme
        /// </summary>
        public string ITheme { get; set; }

        /// <summary>
        /// Unique shortlist offer request ID
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// ShortList type
        /// </summary>
        public ShortListType ShortListType { get; set; }

        /// <summary>
        /// Date time request was created
        /// </summary>
        public string CreatedAt { get; set; }

        /// <summary>
        /// Language in which request was created
        /// </summary>
        public string Language { get; set; }

        /// <summary>
        /// Gets or sets the giata code.
        /// </summary>
        public string GiataCode { get; set; }

        public new IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            var baseValidationResults = base.Validate(validationContext);
            foreach (var result in baseValidationResults)
            {
                yield return result;
            }

            if (string.IsNullOrEmpty(IDepAirport))
            {
                yield return new ValidationResult($"Initial departure airport required");
            }

            if (string.IsNullOrEmpty(IArrAirport))
            {
                yield return new ValidationResult($"Initial arrival airport required");
            }

            if (string.IsNullOrEmpty(ITheme))
            {
                yield return new ValidationResult($"Initial holiday theme is required");
            }
        }
    }
}
