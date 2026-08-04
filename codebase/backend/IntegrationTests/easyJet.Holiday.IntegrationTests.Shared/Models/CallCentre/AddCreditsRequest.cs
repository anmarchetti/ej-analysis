using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holiday.IntegrationTests.Shared.Models.CallCentre
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
        public string Currency { get; set; }

        [DataMember]
        public string AgentId { get; set; }

        [DataMember]
        [Required]
        public string BookingReference { get; set; }

        [DataMember]
        [Required]
        public string Reason { get; set; }
    }
}
