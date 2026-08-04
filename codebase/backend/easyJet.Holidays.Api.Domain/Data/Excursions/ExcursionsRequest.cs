using easyJet.Holidays.Api.Domain.Utils;
using System.ComponentModel.DataAnnotations;
using System.Globalization;

namespace easyJet.Holidays.Api.Domain.Data.Excursions
{
    /// <summary>
    /// Excursion request
    /// </summary>
    public class ExcursionsRequest : IValidatableObject
    {
        /// <summary>
        /// Destination code (e.g. "IT" - for county, "ESBA" - for region, "ESBASS" - for resort)
        /// </summary>
        [Required]
        public string DestinationCode { get; set; }

        /// <summary>
        /// Maximum number of results
        /// </summary>
        public uint? Take { get; set; }

        /// <summary>
        /// The earliest start date to be searched for activities. Use ISO Format yyyy-MM-dd
        /// </summary>
        public string StartDate { get; set; }

        /// <summary>
        /// End date to be searched for activities. Use ISO Format yyyy-MM-dd
        /// </summary>
        public string EndDate { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if ((!string.IsNullOrWhiteSpace(StartDate) && string.IsNullOrWhiteSpace(EndDate)) || (string.IsNullOrWhiteSpace(StartDate) && !string.IsNullOrWhiteSpace(EndDate)))
            {
                yield return new ValidationResult($"Both date range filters [`{nameof(StartDate)}`,`{nameof(EndDate)}`] must be provided");
            }

            if (!string.IsNullOrWhiteSpace(StartDate) && !string.IsNullOrWhiteSpace(EndDate))
            {
                if (!DateTime.TryParseExact(StartDate, DateFormatUtils.DateOnlyFormat, CultureInfo.InvariantCulture, DateTimeStyles.None, out var startDate))
                {
                    yield return new ValidationResult($"Can not parse startDate: {StartDate}, expected format: {DateFormatUtils.DateOnlyFormat}");
                }

                if (!DateTime.TryParseExact(EndDate, DateFormatUtils.DateOnlyFormat, CultureInfo.InvariantCulture, DateTimeStyles.None, out var endDate))
                {
                    yield return new ValidationResult($"Can not parse endDate: {EndDate}, expected format: {DateFormatUtils.DateOnlyFormat}");
                }

                if (startDate > endDate)
                {
                    yield return new ValidationResult($"StartDate: {StartDate} cannot be greater then EndDate: {EndDate}");
                }
            }
        }
    }
}
