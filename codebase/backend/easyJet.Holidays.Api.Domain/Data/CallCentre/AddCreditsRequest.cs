using easyJet.Holidays.Api.Domain.Data.Attributes;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.CallCentre
{
    [Serializable]
    [DataContract]
    public class AddCreditsRequest
    {
        [DataMember]
        [Required]
        public string EmailAddress { get; set; }

        [DataMember]
        [Required]
        public decimal Amount { get; set; }

        [DataMember]
        [CurrencyCode]
        [Required]
        public string Currency { get; set; }

        [DataMember]
        [Required]
        public string AgentId { get; set; }

        [DataMember]
        [Required]
        public string BookingReference { get; set; }

        [DataMember]
        [Required]
        public string Reason { get; set; }
    }
}