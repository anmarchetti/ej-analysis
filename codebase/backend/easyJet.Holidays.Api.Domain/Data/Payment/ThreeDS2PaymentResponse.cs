using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Payment
{
    [Serializable]
    [DataContract]
    public class ThreeDS2PaymentResponse
    {
        /// <summary>
        /// A payment session identifier returned by the card issuer.
        /// </summary>
        [DataMember(Name = "threeDSServerTransID")]
        public string ThreeDSServerTransID { get; set; }

        /// <summary>
        /// Transaction status
        /// </summary>
        [DataMember(Name = "transStatus")]
        public string TransStatus { get; set; }

        /// <summary>
        /// Flag to identify what type of event it is
        /// </summary>
        [DataMember(Name = "threeDSEventType")]
        public string ThreeDSEventType { get; set; }
    }
}
