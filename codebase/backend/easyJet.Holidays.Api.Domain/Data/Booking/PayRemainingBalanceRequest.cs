using easyJet.Holidays.Api.Domain.CustomJsonConverters;
using easyJet.Holidays.Api.Domain.Data.Payment;
using Newtonsoft.Json;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Booking
{
    /// <summary>
    /// Booking pay reminng balance request model
    /// </summary>
    public class PayRemainingBalanceRequest
    {
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
        /// Booking reference
        /// </summary>
        [DataMember(Name = "bookingReference")]
        public string BookingReference { get; set; }

        /// <summary>
        /// Booking passenger last name
        /// </summary>
        [DataMember(Name = "lastName")]
        public string LastName { get; set; }

        /// <summary>
        /// Booking date
        /// </summary>
        [DataMember(Name = "date")]
        public DateTime Date { get; set; }

        /// <summary>
        /// Device ID (InAuth), used as part of fraud assessment
        /// </summary>
        [DataMember(Name = "deviceId")]
        public string DeviceId { get; set; }
    }
}
