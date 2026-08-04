using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holiday.IntegrationTests.Shared.Models.CallCentre
{
    [Serializable]
    [DataContract]
    public class CreditBookingRequest
    {
        [DataMember]
        [Required]
        public string BookingRef { get; set; }

        [DataMember]
        [Required]
        public string Date { get; set; }

        [DataMember]
        [Required]
        public string LastName { get; set; }
    }
}
