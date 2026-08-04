using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Booking
{
    [Serializable]
    [DataContract]
    public class LateRoomCheckoutItem : BookingItem
    {
        [DataMember]
        public string IconUrl { get; set; }

        [DataMember]
        public string Content { get; set; }

        public LateRoomCheckoutItem() { }

        public LateRoomCheckoutItem(BookingItem item) : base(item) { }
    }
}
