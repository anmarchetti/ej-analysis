using System.Runtime.Serialization;
using Voucherify.DataModel;

namespace easyJet.Holidays.Api.Domain.Data.Vouchers
{
    [Serializable]
    [DataContract]
    public class CreditHistoryItem
    {
        [DataMember(Name = "id")]
        public string Id { get; set; }

        [DataMember(Name = "type")]
        public string Type { get; set; }

        [DataMember(Name = "order")]
        public OrderItem Order { get; set; }

        [DataMember(Name = "failureCode")]
        public FailureCode? FailureCode { get; set; }

        [DataMember(Name = "voucherId")]
        public string VoucherID { get; set; }

        [DataMember(Name = "result")]
        public RedemptionResult Result { get; set; }

        [DataMember(Name = "metadata")]
        public IEnumerable<KeyValuePair> Metadata { get; set; }

        [DataMember(Name = "redemptions")]
        public IEnumerable<CreditHistoryItem> Redemptions { get; set; }

        [DataMember(Name = "expires")]
        public DateTime? Expires { get; set; }

        [DataMember(Name = "createdAt")]
        public DateTime? CreatedAt { get; set; }
        
        /// <summary>
        /// DateTime of the last operation related to this credit history item
        /// </summary>
        [IgnoreDataMember]
        public DateTime? LastOperationAt 
        {
            get
            {
                if (Redemptions != null && Redemptions.Any())
                {
                    return Redemptions.Max(r => r.Order?.Date ?? DateTime.MinValue);
                }
                return CreatedAt;
            }
        }

        /// <summary>
        /// Total amount of all redemptions in this credit history item
        /// </summary>
        [IgnoreDataMember]
        public decimal Amount
        {
            get
            {
                return (Order?.Amount ?? 0) + (Redemptions ?? []).Sum(x => x.Amount);
            }
        }
    }

    [Serializable]
    [DataContract]
    public class OrderItem
    {
        [DataMember(Name = "date")]
        public DateTime? Date { get; set; }

        [DataMember(Name = "id")]
        public string Id { get; set; }

        [DataMember(Name = "status")]
        public OrderStatus? Status { get; set; }

        [DataMember(Name = "amount")]
        public decimal Amount { get; set; }
    }
}
