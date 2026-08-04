using easyJet.Holidays.Api.Domain.Data.Attributes;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Guests
{
    /// <summary>
    /// Passenger, who is responsible for other passengers in the booking
    /// </summary>
    public class LeadPassenger : Person, IValidatableObject
    {
        public LeadPassenger() { }

        public LeadPassenger(Person person)
        {
            Sex = person.Sex;
            Type = person.Type;
        }

        /// <summary>
        /// Email
        /// </summary>
        [DataMember(Name = "email")]
        [Required]
        [StringLength(256)]
        [EmailAddress]
        public string Email { get; set; }

        /// <summary>
        /// Dialing code for lead's country phone number
        /// </summary>
        [DataMember(Name = "dialingCode")]
        [Display(Name = "Dialing Code")]
        [Required]
        [StringLength(4)]
        [RegularExpression("\\+?[0-9]*", ErrorMessage = "The {0} field must not contain invalid characters.")]
        public string DialingCode { get; set; }

        /// <summary>
        /// Phone number
        /// </summary>
        [DataMember(Name = "phone")]
        [Required]
        [StringLength(12, MinimumLength = 3)]
        [RegularExpression(@"^0?\d*$", ErrorMessage = "The field {0} must not contain invalid characters.")]
        public string Phone { get; set; }

        /// <summary>
        /// 3-letter code for country
        /// </summary>
        [DataMember(Name = "countryCode")]
        [Display(Name = "Country Code")]
        [RequiredOutsideOfTradePortal]
        [StringLength(3)]
        [RegularExpression("AFG|ALA|ALB|DZA|ASM|AND|AGO|AIA|ATA|ATG|ARG|ARM|ABW|AUS|AUT|AZE|BHS|BHR|BGD|BRB|BLR|BEL|BLZ|BEN|BMU|BTN|BOL|BES|BIH|BWA|BVT|BRA|IOT|VGB|BRN|BGR|BFA|BDI|CIV|KHM|CMR|CAN|CPV|CYM|CAF|TCD|CHL|CHN|CXR|CCK|COL|COM|COG|COD|COK|CRI|HRV|CUB|CUW|CYP|CZE|DNK|DJI|DMA|DOM|ECU|EGY|SLV|GNQ|ERI|EST|ETH|FLK|FRO|FJI|FIN|FRA|GLP|GUF|PYF|ATF|GAB|GMB|GEO|D|GHA|GIB|GRC|GRL|GRD|GUM|GTM|GIN|GNB|GUY|HTI|HND|HKG|HUN|ISL|IND|IDN|IRQ|IRL|IRN|IMN|ISR|ITA|JAM|JPN|JOR|KAZ|KEN|KIR|PRK|KOR|KWT|KGZ|LVA|LBN|LSO|LBR|LBY|LIE|LTU|LUX|MAC|MKD|MDG|MWI|MYS|MDV|MLI|MLT|MHL|MTQ|MRT|MUS|MYT|MEX|FSM|MDA|MCO|MNG|MNE|MSR|MAR|MOZ|MMR|NAM|NRU|NPL|NLD|ANT|NCL|NZL|NIC|NER|NGA|NIU|NFK|MNP|NOR|OMN|PAK|PLW|PSE|PAN|PNG|PRY|PER|PHL|PCN|POL|PRT|PRI|QAT|REU|ROU|RUS|RWA|LCA|SXM|WSM|SMR|STP|SAU|SEN|SRB|SYC|SLE|SGP|SVK|SVN|SLB|SOM|ZAF|SGS|ESP|LKA|SHN|KNA|SPM|VCT|SDN|SUR|SJM|SWZ|SWE|CHE|SYR|TWN|TJK|TZA|THA|TLS|TGO|TKL|TON|TTO|TUN|TUR|TKM|TCA|TUV|UGA|UKR|ARE|GBR|USA|UMI|VIR|URY|UZB|VUT|VAT|VEN|VNM|WLF|ESH|YEM|ZMB|ZWE", ErrorMessage = "The {0} field must contain valid country code.")]
        public string CountryCode { get; set; }

        /// <summary>
        /// Lead's address
        /// </summary>
        [DataMember(Name = "address")]
        [RequiredOutsideOfTradePortal]
        [StringLengthAllowEmpty(50, MinimumLength = 4)]
        [RegularExpression(@"^[^;:""`|!?<>\\@$£%^*\]\[]*$", ErrorMessage = "The field {0} must not contain invalid characters.")]
        public string Address { get; set; }

        /// <summary>
        /// Lead's address. 2-nd line for complex addresses
        /// </summary>
        [DataMember(Name = "address2")]
        [Display(Name = "Address Line 2")]
        [StringLengthAllowEmpty(50, MinimumLength = 4)]
        [RegularExpression(@"^[^;:""`|!?<>\\@$£%^*\]\[]*$", ErrorMessage = "The field {0} must not contain invalid characters.")]
        public string Address2 { get; set; }

        /// <summary>
        /// Town or City
        /// </summary>
        [DataMember(Name = "townCity")]
        [Display(Name = "Town / City")]
        [RequiredOutsideOfTradePortal]
        [StringLengthAllowEmpty(30, MinimumLength = 2)]
        [RegularExpression(@"^([^;:""`|!?<>\\@$£%^*\]\[]*)$", ErrorMessage = "The field {0} must not contain invalid characters.")]
        public string TownCity { get; set; }

        /// <summary>
        /// Postal code
        /// </summary>
        [DataMember(Name = "postCode")]
        [Display(Name = "Postcode")]
        [RequiredOutsideOfTradePortal]
        [StringLengthAllowEmpty(15, MinimumLength = 2, ErrorMessage = "Postal code must be between two and fifteen characters of length.")]
        [RegularExpression(@"^.*$", ErrorMessage = "The field {0} must not contain invalid characters.")]
        public string PostCode { get; set; }

        /// <summary>
        /// Date of birth is mandatory for children and lead passengers only
        /// </summary>
        [DataMember(Name = "dateOfBirth")]
        [Display(Name = "Date of Birth")]
        [Required(AllowEmptyStrings = false)]
        [Range(typeof(DateTimeOffset), "1900-01-01", "2100-12-31", ErrorMessage = "The field {0} is required and should be between {1:yyyy-MM-dd} and {2:yyyy-MM-dd}")]
        public DateTimeOffset DateOfBirth { get; set; }

        /// <param name="validationContext">additional information, such as the model instance created by model binding</param>
        /// <returns>validation results</returns>
        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (Phone.Length + DialingCode.Length > 15)
            {
                yield return new ValidationResult($"Phone number should be less than {15 - DialingCode.Length}");
            }
        }
    }
}
