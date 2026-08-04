using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Payment
{
    /// <summary>
    /// Billing information model
    /// </summary>
    [Serializable]
    public class BillingInfo
    {
        /// <summary>
        /// Billing info - Full Name
        /// </summary>
        [DataMember(Name = "fullName")]
        [StringLength(61, MinimumLength = 1)]
        [RegularExpression(@"^[^0-9+;:""`\\\\|!?<>().,/\\@#$£%^&*]*$", ErrorMessage = "The field {0} must not contain invalid characters.")]
        public string FullName { get; set; }

        /// <summary>
        /// Address
        /// </summary>
        [DataMember(Name = "address")]
        [StringLength(50, MinimumLength = 4)]
        [RegularExpression(@"^[^;:""`|!?<>\\@$£%^*\]\[]*$", ErrorMessage = "The field {0} must not contain invalid characters.")]
        public string Address { get; set; }

        /// <summary>
        /// Address. 2-nd line for complex addresses
        /// </summary>
        [DataMember(Name = "address2")]
        [StringLength(50)]
        [RegularExpression(@"^[^;:""`|!?<>\\@$£%^*\]\[]*$", ErrorMessage = "The field {0} must not contain invalid characters.")]
        public string Address2 { get; set; }

        /// <summary>
        /// Town/City
        /// </summary>
        [DataMember(Name = "city")]
        [StringLength(30, MinimumLength = 2)]
        [RegularExpression(@"^([^;:""`|!?<>\\@$£%^*\]\[]*)$", ErrorMessage = "The field {0} must not contain invalid characters.")]
        public string City { get; set; }

        /// <summary>
        /// Postal code
        /// </summary>
        [DataMember(Name = "postCode")]
        [StringLength(15, MinimumLength = 2)]
        public string PostCode { get; set; }
    }
}
