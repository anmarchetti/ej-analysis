using easyJet.Holidays.External.Atcom.Models.InfoBooking;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Atcom.Models.Search
{
    public class SearchAvailablePackagesRequest : AtcomApiRequest<object>
    {
        [IgnoreDataMember]
        private string[] _departureAirports;

        protected override string RequestNamespace => string.Empty; // No request body, doesn't matter
        public override HttpMethod Method => HttpMethod.Get;

        [DataMember(Name = "sdate")]
        public string StartDate { get; set; }

        [DataMember(Name = "edate")]
        public string EndDate { get; set; }

        [DataMember(Name = "stay")]
        public string Duration { get; set; }

        [DataMember(Name = "dep")]
        public string[] Departure { get; set; }

        /// <summary>
        /// Required to determine market code
        /// </summary>
        [IgnoreDataMember]
        public string[] DepartureAirports
        {
            get => _departureAirports ?? Departure;
            set => _departureAirports = value;
        }

        [DataMember(Name = "arr")]
        public string Arrival { get; set; }

        [DataMember(Name = "pax_ad")]
        public int Adults { get; set; }

        [DataMember(Name = "pax_ch")]
        public int Children { get; set; }

        [DataMember(Name = "pax_in")]
        public int Infants { get; set; }

        [DataMember(Name = "ch_age")]
        public string[] ChildAges { get; set; }

        [DataMember(Name = "rooms")]
        public int Rooms { get; set; }

        [DataMember(Name = "geog")]
        public string Geography { get; set; }

        [DataMember(Name = "poly")]
        public string Poly { get; set; }

        [DataMember(Name = "accom")]
        public string AccommodationId { get; set; }

        [DataMember(Name = "tra_o")]
        public string OutboundRouteId { get; set; }

        [DataMember(Name = "tra_i")]
        public string InboundRouteId { get; set; }

        [DataMember(Name = "pkg")]
        public string PackageId { get; set; }

        [DataMember(Name = "bb")]
        public string BoardTypes { get; set; }

        [DataMember(Name = "accom")]
        public string AccomCodes { get; set; }

        [DataMember(Name = "accom_no")]
        public int? AccomCodesNumber { get; set; } // It's imortant to be nullable here otherwise it will have default value 0

        [DataMember(Name = "p_tp")]
        public string PriceType { get; set; }

        [DataMember(Name = "max_prc")]
        public double? MaxPrice { get; set; }

        [DataMember(Name = "min_prc")]
        public double? MinPrice { get; set; }

        [DataMember(Name = "dc")]
        public bool? FreeForKidsOnly { get; set; }

        [DataMember(Name = "brws")]
        public string SearchType { get; set; }

        [DataMember(Name = "cache_ver")]
        public string PromoCacheBusting { get; set; } // Cache busting for promo requests

        /// <summary>
        /// To specify the type of transfer that needs to be included in the package
        /// Y = Cheapest, N - No transfer, S - Shared, P - Private
        /// </summary>
        [DataMember(Name = "inc_transfers")]
        public string IncludedTransfer { get; set; }

        [DataMember(Name = "slot_o")]
        public string OutboundTimeSlots { get; set; }

        [DataMember(Name = "slot_i")]
        public string InboundTimeSlots { get; set; }

        [DataMember(Name = "xid")]
        public string PromoPageId { get; set; }

        [DataMember(Name = "pid")]
        public string SmartSeerRequestSize { get; set; }

        [DataMember(Name = "tra_no_o")]
        public string OutboundFltNo { get; set; }

        [DataMember(Name = "tra_no_i")]
        public string InboundFltNo { get; set; }

        /// <summary>
        /// Outbound flight
        /// </summary>
        [DataMember(Name = "cur_tra_o")]
        public string OutboundFlt { get; set; }

        /// <summary>
        /// Inbound flight
        /// </summary>
        [DataMember(Name = "cur_tra_i")]
        public string InboundFlt { get; set; }
    }
}