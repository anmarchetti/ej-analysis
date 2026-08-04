using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Payment
{
    [Serializable]
    [DataContract]
    [KnownType(typeof(ThreeDS1AuthResponse))]
    public class CompleteThreeDS1PaymentRequest
    {
        /// <summary>
        /// A payment session identifier returned by the card issuer.
        /// </summary>
        [DataMember(Name = "MD")]
        public string Md { get; set; }

        /// <summary>
        /// A payment authorisation response returned by the card issuer.
        /// </summary>
        [DataMember(Name = "PaRes")]
        public string PaRes { get; set; }
    }
}
