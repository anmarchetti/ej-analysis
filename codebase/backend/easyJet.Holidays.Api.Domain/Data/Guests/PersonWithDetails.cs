using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;
using System.Text.RegularExpressions;

namespace easyJet.Holidays.Api.Domain.Data.Guests
{
    public class PersonWithDetails : Person, IValidatableObject
    {
        /// <summary>
        /// How the person should be treated formally. Mr./Ms./Mrs.
        /// </summary>
        [DataMember(Name = "title")]
        public string Title { get; set; }

        /// <summary>
        /// First Name
        /// </summary>
        [DataMember(Name = "firstName")]
        [Display(Name = "First Name")]
        [Required]
        [StringLength(30, MinimumLength = 1)]
        [RegularExpression(@"^[^0-9+;:""`|!?<>().,/\\@#$£%^&*]*$", ErrorMessage = "The field {0} must not contain invalid characters.")]
        public string FirstName { get; set; }

        /// <summary>
        /// Last Name
        /// </summary>
        [DataMember(Name = "lastName")]
        [Display(Name = "Last Name")]
        [Required]
        [StringLength(30, MinimumLength = 1)]
        [RegularExpression(@"^[^0-9+;:""`|!?<>().,/\\@#$£%^&*]*$", ErrorMessage = "The field {0} must not contain invalid characters.")]
        public string LastName { get; set; }

        /// <summary>
        /// Date of birth is mandatory for children and lead passengers only
        /// </summary>
        [DataMember(Name = "dateOfBirth")]
        [Display(Name = "Date of Birth")]
        [Range(typeof(DateTimeOffset), "1900-01-01", "2100-12-31", ErrorMessage = "The field {0} is required and should be between {1:yyyy-MM-dd} and {2:yyyy-MM-dd}")]
        public DateTimeOffset? DateOfBirth { get; set; }

        /// <summary>
        /// If the passenger is the person, who is responsible for all other people in the booking
        /// </summary>
        [DataMember(Name = "isLead")]
        public bool IsLead { get; set; }

        /// <summary>
        /// passenger index from atcom
        /// </summary>
        [DataMember(Name = "index")]
        public string Index { get; set; }

        /// <summary>
        /// Infant only. indicates, if an infant is still being carried by his/her mother by the moment, booking is done
        /// </summary>
        [DataMember(Name = "notBornYet")]
        public bool NotBornYet { get; set; }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="validationContext">additional information, such as the model instance created by model binding</param>
        /// <returns>validation results</returns>
        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            var saveTitle = Title ?? string.Empty; // Assign empty string because e.g. RgExp validation fails for null values
            if (Type == PersonType.Adult)
            {
                var adultTitle = new Regex("^(Mr|Mrs|Miss|Ms|Chd|Mr\\+Inf|Mrs\\+Inf|Ms\\+Inf|Miss\\+Inf)$", RegexOptions.IgnoreCase);

                if (string.IsNullOrEmpty(saveTitle))
                {
                    yield return new ValidationResult($"The Title field is required.");
                }

                if (!adultTitle.IsMatch(saveTitle))
                {
                    yield return new ValidationResult($"The Title field can only be one of Mr, Mrs, Miss, Ms, Chd, Mr+Inf, Mrs+Inf, Miss+Inf or Ms+Inf.");
                }
            }

            if (Type == PersonType.Child)
            {
                var childrenTitle = new Regex("^(Mr|Mrs|Miss|Ms|Chd|Mr\\+Inf|Mrs\\+Inf|Ms\\+Inf|Miss\\+Inf)$", RegexOptions.IgnoreCase);

                if (string.IsNullOrEmpty(saveTitle))
                {
                    yield return new ValidationResult($"The Title field is required.");
                }

                if (!childrenTitle.IsMatch(saveTitle))
                {
                    yield return new ValidationResult($"The Title field can only be one of Mr, Mrs, Miss, Ms, Chd, Mr+Inf, Mrs+Inf, Miss+Inf or Ms+Inf.");
                }

                if (!DateOfBirth.HasValue)
                {
                    yield return new ValidationResult($"The Date Of Birth field is required.");
                }
            }

            if (Type == PersonType.Infant)
            {

            }
        }
    }
}
