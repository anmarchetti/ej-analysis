using easyJet.Holidays.Api.Domain.Data.Attributes;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.CallCentre
{
    [Serializable]
    [DataContract]
    public class SpendCreditRequest
    {
        [DataMember]
        [Required]
        public string BookingRef { get; set; }

        [DataMember]
        [Required]
        public DateTime Date { get; set; }

        [DataMember]
        [Required]
        public string LastName { get; set; }

        [DataMember]
        [Required]
        public decimal Amount { get; set; }

        [DataMember]
        [CurrencyCode]
        [Required]
        public string Currency { get; set; }
    }
}
