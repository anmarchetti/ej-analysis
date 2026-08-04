using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Payment
{
    [Serializable]
    [DataContract]
    public class CompleteIdentifyPaymentRequest
    {
        /// <summary>
        /// 3DS server transaction ID
        /// </summary>
        [DataMember(Name = "threeDSMethodData")]
        public string ThreeDSMethodData { get; set; }
    }
}
