using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Payment
{
    [Serializable]
    [DataContract]
    public class ThreeDS1AuthResponse : CompleteThreeDS1PaymentRequest
    {
        /// <summary>
        /// Flag to identify what type of event it is
        /// </summary>
        [DataMember(Name = "threeDSEventType")]
        public string ThreeDSEventType { get; set; }
    }
}
