using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Eskel
{
    [Serializable]
    [DataContract]
    public class BookingMargin
    {
        [DataMember(Name = "reservationId")]
        public uint ReservationId { get; set; }

        [DataMember(Name = "pax")]
        public byte Pax { get; set; }

        [DataMember(Name = "margin")]
        public double Margin { get; set; }

        [DataMember(Name = "marginPp")]
        public double MarginPp { get; set; }

        public override string ToString()
        {
            return
                $"[{nameof(ReservationId)}: {ReservationId} | {nameof(Pax)}: {Pax} |  {nameof(Margin)}: {Margin} | {nameof(MarginPp)}: {MarginPp}]";
        }
    }
}