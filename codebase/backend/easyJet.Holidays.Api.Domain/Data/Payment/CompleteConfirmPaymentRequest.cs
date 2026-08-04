using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Payment
{
    [Serializable]
    [DataContract]
    public class CompleteConfirmPaymentRequest
    {
        /// <summary>
        /// 3DS server transaction data
        /// </summary>
        [DataMember(Name = "cres")]
        public string Cres { get; set; }

        /// <summary>
        /// Error details
        /// </summary>
        [DataMember(Name = "error")]
        public string Error { get; set; }
    }
}
