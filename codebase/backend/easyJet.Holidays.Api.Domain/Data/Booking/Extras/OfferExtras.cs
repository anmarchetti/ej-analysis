using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Booking
{
    [Serializable]
    [DataContract]
    public class OfferExtras
    {
        [DataMember]
        public IEnumerable<TransferItem> Transfers { get; set; }

        [DataMember]
        public LateRoomCheckoutItem LateRoomCheckout { get; set; }
    }
}
