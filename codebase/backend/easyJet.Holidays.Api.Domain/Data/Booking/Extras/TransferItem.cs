using easyJet.Holidays.Api.Domain.Data.Transfers;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Booking
{
    [Serializable]
    [DataContract]
    public class TransferItem : BookingItem
    {
        [DataMember]
        public TransferItemType Type { get; set; }

        [DataMember]
        public string IconUrl { get; set; }

        [DataMember]
        public string Content { get; set; }

        [DataMember]
        public TransferInfo TransferInfo { get; set; }

        public TransferItem() { }

        public TransferItem(BookingItem item) : base(item) { }
    }

    public enum TransferItemType
    {
        [EnumMember(Value = "UNKNOWN")]
        Unknown,

        [EnumMember(Value = "PRIVATE")]
        Private,

        [EnumMember(Value = "SHARED")]
        Shared,

        [EnumMember(Value = "NO_TRANSFER")]
        NoTransfer
    }
}
