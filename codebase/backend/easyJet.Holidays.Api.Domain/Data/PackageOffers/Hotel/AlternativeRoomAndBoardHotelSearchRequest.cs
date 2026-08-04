namespace easyJet.Holidays.Api.Domain.Data.PackageOffers.Hotel
{
    /// <summary>
    /// Request for alternativ room and board for hotel for cache
    /// </summary>
    public class AlternativeRoomAndBoardHotelSearchRequest : BaseSearchRequest 
    {
        /// <summary>
        /// Departure airport code
        /// </summary>
        public string OutboundDepartureAirport { get; set; }

        /// <summary>
        /// OutboundArrivalAirport
        /// </summary>
        public string OutboundArrivalAirport { get; set; }

        /// <summary>
        /// OutboundFltNo
        /// </summary>
        public string OutboundFltNo { get; set; }

        /// <summary>
        /// OutboundArrTime
        /// </summary>
        public string OutboundArrDateTime { get; set; }

        /// <summary>
        /// OutboundDepartureTimeStringFormat
        /// </summary>
        public string OutboundDepartureDateTime { get; set; }

        /// <summary>
        /// InboundDepartureTimeStringFormat
        /// </summary>
        public string InboundDepartureDateTime { get; set; }

        /// <summary>
        /// InboundFltNo
        /// </summary>
        public string InboundFltNo { get; set; }

        /// <summary>
        /// InboundDepartureAirport
        /// </summary>
        public string InboundDepartureAirport { get; set; }

        /// <summary>
        /// InboundArrivalAirport
        /// </summary>
        public string InboundArrivalAirport { get; set; }

        /// <summary>
        /// InboundArrTime
        /// </summary>
        public string InboundArrDateTime { get; set; }

        /// <summary>
        /// AcommodationCode
        /// </summary>        
        public string AcommodationCode { get; set; }

        /// <summary>
        /// TransferCode
        /// </summary>
        public string TransferCode { get; set; }
    }
}
