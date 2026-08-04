using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Vouchers
{
    [Serializable]
    [DataContract]
    public class CreditItem
    {
        [DataMember(Name = "id")]
        public string Id { get; set; }

        [DataMember(Name = "amount")]
        public decimal Amount { get; set; }

        [DataMember(Name = "balance")]
        public decimal Balance { get; set; }

        [DataMember(Name = "expires")]
        public DateTime? Expires { get; set; }

        [DataMember(Name = "startDate")]
        public DateTime? StartDate { get; set; }

        [DataMember(Name = "createdAt")]
        public DateTime? CreatedAt { get; set; }

        [DataMember(Name = "metadata")]
        public IEnumerable<KeyValuePair> Metadata { get; set; }
    }
}
