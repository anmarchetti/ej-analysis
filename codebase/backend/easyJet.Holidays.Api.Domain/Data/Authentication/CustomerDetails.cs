using easyJet.Holidays.Api.Domain.Data.Attributes;
using Newtonsoft.Json;
using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace easyJet.Holidays.Api.Domain.Data.Authentication
{
    /// <summary>
    /// Customer details
    /// </summary>
    public class CustomerDetails : IValidatableObject
    {
        /// <summary>
        /// Customer id
        /// </summary>
        [JsonIgnore]
        public string Id { get; set; }

        /// <summary>
        /// Title: MR, MRS, MS, Miss
        /// </summary>
        [Required]
        public string Title { get; set; }

        /// <summary>
        /// Email address
        /// </summary>
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        /// <summary>
        /// First name
        /// </summary>
        [Required]
        [StringLength(30, MinimumLength = 1)]
        [RegularExpression(@"^[^0-9+;:""`|!?<>().,/\\@#$£%^&*]*$", ErrorMessage = "The field {0} must not contain invalid characters.")]
        public string FirstName { get; set; }

        /// <summary>
        /// Last name
        /// </summary>
        [Required]
        [StringLength(30, MinimumLength = 1)]
        [RegularExpression(@"^[^0-9+;:""`|!?<>().,/\\@#$£%^&*]*$", ErrorMessage = "The field {0} must not contain invalid characters.")]
        public string LastName { get; set; }

        /// <summary>
        /// Dialing Code
        /// </summary>
        [Required]
        [StringLength(4)]
        [RegularExpression("\\+?[0-9]*", ErrorMessage = "The field {0} must not contain invalid characters.")]
        public string DialingCode { get; set; }

        /// <summary>
        /// Mobile phone number
        /// </summary>
        [Required]
        [StringLength(12, MinimumLength = 3)]
        [RegularExpression(@"^0?\d*$", ErrorMessage = "The field {0} must not contain invalid characters.")]
        public string MobilePhone { get; set; }

        /// <summary>
        /// Birth date yyyy-MM-dd
        /// </summary>
        // [Required(AllowEmptyStrings = false)]
        [DataType(DataType.Date)]
        [Range(typeof(DateTimeOffset), "1900-01-01", "2100-12-31", ErrorMessage = "The field {0} is required and should be between {1:yyyy-MM-dd} and {2:yyyy-MM-dd}")]
        public DateTimeOffset? BirthDate { get; set; }

        /// <summary>
        /// Address line 1
        /// </summary>
        [Required]
        [StringLength(32, MinimumLength = 4)]
        [RegularExpression(@"^[^;:""`|!?<>\\@$£%^*\]\[]*$", ErrorMessage = "The field {0} must not contain invalid characters.")]
        public string Address1 { get; set; }

        /// <summary>
        /// Address line 2 (optional)
        /// </summary>
        [StringLengthAllowEmpty(32, MinimumLength = 4)]
        [RegularExpression(@"^[^;:""`|!?<>\\@$£%^*\]\[]*$", ErrorMessage = "The field {0} must not contain invalid characters.")]
        public string Address2 { get; set; }

        /// <summary>
        /// Town/city
        /// </summary>
        [Required]
        [StringLength(30, MinimumLength = 2)]
        [RegularExpression(@"^([^;:""`|!?<>\\@$£%^*\]\[]*)$", ErrorMessage = "The field {0} must not contain invalid characters.")]
        public string City { get; set; }

        /// <summary>
        /// Postal code
        /// </summary>
        [Required]
        [StringLength(8, MinimumLength = 2, ErrorMessage = "Postal code must be between two and fifteen characters of length.")]
        [RegularExpression(@"^.*$", ErrorMessage = "The field {0} must not contain invalid characters.")]
        public string PostalCode { get; set; }

        /// <summary>
        /// Country code
        /// </summary>
        [Required]
        [StringLength(3)]
        [RegularExpression("AFG|ALA|ALB|DZA|ASM|AND|AGO|AIA|ATA|ATG|ARG|ARM|ABW|AUS|AUT|AZE|BHS|BHR|BGD|BRB|BLR|BEL|BLZ|BEN|BMU|BTN|BOL|BES|BIH|BWA|BVT|BRA|IOT|VGB|BRN|BGR|BFA|BDI|CIV|KHM|CMR|CAN|CPV|CYM|CAF|TCD|CHL|CHN|CXR|CCK|COL|COM|COG|COD|COK|CRI|HRV|CUB|CUW|CYP|CZE|DNK|DJI|DMA|DOM|ECU|EGY|SLV|GNQ|ERI|EST|ETH|FLK|FRO|FJI|FIN|FRA|GLP|GUF|PYF|ATF|GAB|GMB|GEO|D|GHA|GIB|GRC|GRL|GRD|GUM|GTM|GIN|GNB|GUY|HTI|HND|HKG|HUN|ISL|IND|IDN|IRQ|IRL|IRN|IMN|ISR|ITA|JAM|JPN|JOR|KAZ|KEN|KIR|PRK|KOR|KWT|KGZ|LVA|LBN|LSO|LBR|LBY|LIE|LTU|LUX|MAC|MKD|MDG|MWI|MYS|MDV|MLI|MLT|MHL|MTQ|MRT|MUS|MYT|MEX|FSM|MDA|MCO|MNG|MNE|MSR|MAR|MOZ|MMR|NAM|NRU|NPL|NLD|ANT|NCL|NZL|NIC|NER|NGA|NIU|NFK|MNP|NOR|OMN|PAK|PLW|PSE|PAN|PNG|PRY|PER|PHL|PCN|POL|PRT|PRI|QAT|REU|ROU|RUS|RWA|LCA|SXM|WSM|SMR|STP|SAU|SEN|SRB|SYC|SLE|SGP|SVK|SVN|SLB|SOM|ZAF|SGS|ESP|LKA|SHN|KNA|SPM|VCT|SDN|SUR|SJM|SWZ|SWE|CHE|SYR|TWN|TJK|TZA|THA|TLS|TGO|TKL|TON|TTO|TUN|TUR|TKM|TCA|TUV|UGA|UKR|ARE|GBR|USA|UMI|VIR|URY|UZB|VUT|VAT|VEN|VNM|WLF|ESH|YEM|ZMB|ZWE", ErrorMessage = "The field {0} must contain valid country code.")]
        public string CountryCode { get; set; }

        /// <summary>
        /// Whether receive easyJet partner offers and updates
        /// </summary>
        [Required]
        public bool MailingsFlag { get; set; }

        /// <summary>
        /// Whether receive easyJet offers and updates
        /// </summary>
        [Required]
        public bool easyJetMailingsFlag { get; set; }

        /// <summary>
        /// Preferred airports collection.
        /// Can have maximum 3 airports. It allows length upto 3 characters for each code
        /// </summary>l
        public List<string> PreferredAirports { get; set; }

        /// <summary>
        /// Validate title values
        /// </summary>
        /// <param name="validationContext">additional information, such as the model instance created by model binding</param>
        /// <returns>validation results</returns>
        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            var titleRegex = new Regex("^(MR|MRS|MS|Miss)$", RegexOptions.IgnoreCase);

            if (!titleRegex.IsMatch(Title))
            {
                yield return new ValidationResult($"The field Title must be: MR, MRS, MS or Miss.");
            }

            if (MobilePhone != null && (MobilePhone.Replace(" ", "").Length + DialingCode.Length) > 15)
            {
                yield return new ValidationResult($"The field MobilePhone must be a string with a maximum length of {15 - DialingCode.Length}.");
            }

            if (PreferredAirports != null)
            {
                if (PreferredAirports.Count > 3)
                {
                    yield return new ValidationResult($"PreferredAirports maximum length is 3.");
                }

                if (PreferredAirports.Any(x => x.Length == 0 || x.Length > 3))
                {
                    yield return new ValidationResult($"PreferredAirports items should be not empty and has length upto 3 characters.");
                }
            }
        }
    }
}