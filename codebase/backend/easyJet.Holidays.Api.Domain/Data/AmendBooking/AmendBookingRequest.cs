using easyJet.Holidays.Api.Domain.CustomJsonConverters;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.Payment;
using Newtonsoft.Json;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking
{
    /// <summary>
    /// Modify booking request
    /// </summary>
    [Serializable]
    [DataContract]
    public class AmendBookingRequest : AmendInfoBookingRequest
    {
        /// <summary>
        /// Session ID
        /// </summary>
        [DataMember(Name = "sessionId")]
        public string SessionId { get; set; }

        /// <summary>
        /// Request ID
        /// </summary>
        public string RequestId { get; set; }

        /// <summary>
        /// Lead passenger details
        /// </summary>
        [DataMember(Name = "leadPassenger")]
        public LeadPassenger LeadPassenger { get; set; }

        /// <summary>
        /// Payment information
        /// </summary>
        [DataMember(Name = "paymentInfo")]
        [JsonConverter(typeof(PaymentInfoConverter))]
        public PaymentInfo PaymentInfo { get; set; }

        /// <summary>
        /// Browser Info
        /// </summary>
        [DataMember(Name = "browserInfo")]
        [Required]
        public BrowserInfo BrowserInfo { get; set; }

        /// <summary>
        /// Device ID (InAuth), used as part of fraud assessment
        /// </summary>
        [DataMember(Name = "deviceId")]
        public string DeviceId { get; set; }

        /// <summary>
        /// Convert type
        /// </summary>
        [DataMember(Name = "convertType")]
        public ConvertType? ConvertType { get; set; }

        /// <summary>
        /// Validation
        /// </summary>
        /// <param name="validationContext"></param>
        /// <returns></returns>
        public new IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            var validationResults = base.Validate(validationContext);

            foreach (var validationResult in validationResults)
            {
                yield return validationResult;
            }

            if (PaymentInfo == null)
            {
                yield return new ValidationResult("PaymentInfo can't be null");
            }
        }
    }
}