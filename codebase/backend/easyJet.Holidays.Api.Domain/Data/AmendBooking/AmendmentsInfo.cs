using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking
{
    [Serializable]
    [DataContract]
    public class AmendmentsInfo
    {
        [DataMember]
        public bool Booking { get; set; }

        [DataMember]
        public bool Route { get; set; }

        [DataMember]
        public bool RoomAndBoard { get; set; }

        [DataMember]
        public Pax Pax { get; set; } = new Pax();

        [DataMember]
        public bool Memo { get; set; }

        [DataMember]
        public bool SpecialRequest { get; set; }

        [DataMember]
        public AmendItem Transfer { get; set; } = new AmendItem();

        /// <summary>
        /// Is hotel change enabled
        /// </summary>
        [DataMember(Name = "isHotelChangeEnabled")]
        public bool Accom { get; set; }

        [DataMember]
        public bool Seats { get; set; }

        [DataMember]
        public bool ChangeDates { get; set; }

        [DataMember]
        public List<AmendBookingStatus> AmendBookingStatus { get; set; } = new List<AmendBookingStatus>();

        [DataMember]
        public string PromoCode { get; set; }

        [DataMember]
        public bool CanBookingCancelled { get; set; } = true;
    }

    [Serializable]
    [DataContract]
    public class AmendItem
    {
        [DataMember]
        public bool AmendAllow { get; set; }

        [DataMember]
        public bool DowngradeAllow { get; set; }
    }

    [Serializable]
    [DataContract]
    public class Pax
    {
        [DataMember]
        public int NameChangedTimes { get; set; }

        [DataMember]
        public bool AmendAllow { get; set; }

        [DataMember]
        public bool AmendNameOnly { get; set; }
    }
}