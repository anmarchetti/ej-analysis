using System.Runtime.Serialization;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking.Hotel
{
    /// <summary>
    /// Response with list of alternative hotels.
    /// </summary>
    [Serializable]
    [DataContract]
    public class GetAmendHotelListResponse
    {
        /// <summary>
        /// ctor
        /// </summary>
        public GetAmendHotelListResponse()
        {
            AmendHotelOffers = [];
            Filters = [];
            Status = new Status();
        }

        /// <summary>
        /// Booking reference.
        /// </summary>
        [DataMember(Name = "bookingRef")]
        public string BookingRef { get; init; }

        /// <summary>
        /// List of offers.
        /// </summary>
        [DataMember(Name = "amendHotelOffers")]
        public IEnumerable<AmendHotelOffer> AmendHotelOffers { get; set; }

        /// <summary>
        /// List of available filter options
        /// </summary>
        [DataMember(Name = "filters")]
        public IList<Filter> Filters { get; set; }
        
        /// <summary>
        /// Search status
        /// </summary>
        [DataMember(Name = "status")]
        public Status Status { get; set; }

        /// <summary>
        /// Available sorting directions.
        /// </summary>
        [DataMember(Name = "sortingBy")]
        public IEnumerable<string> SortingBy { get; } = Enum.GetValues<SortParameter>().Select(x => x.ToString());
    }
}
