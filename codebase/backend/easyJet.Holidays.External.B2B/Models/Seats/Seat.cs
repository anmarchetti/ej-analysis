using System.Xml.Serialization;

namespace easyJet.Holidays.External.B2B.Models.Seats
{
    public class Seat
    {
        ///<summary>
        /// Displays the unique identifier for the seat charge code.
        /// </summary>
        [XmlAttribute]
        public int ChargeCodeId { get; set; }

        ///<summary>
        /// Indicates if the instance is an aisle seat or not. 'true' means aisle seat and 'false' means not an aisle seat.
        /// </summary>
        [XmlAttribute]
        public bool IsAisleSeat { get; set; }

        ///<summary>
        /// Indicates if the seat is available or not. 'true' means seat is available and 'false' means not available.
        /// </summary>
        [XmlAttribute]
        public bool IsAvailable { get; set; }

        ///<summary>
        ///  Indicates if the instance is middle seat or not. 'true' means middle seat and 'false' means not a middle seat.
        /// </summary>
        [XmlAttribute]
        public bool IsMiddleSeat { get; set; }

        ///<summary>
        /// Indicates if the instance is a window seat or not. 'true' means window seat and 'false' means not a window seat.
        /// </summary>
        [XmlAttribute]
        public bool IsWindowSeat { get; set; }

        ///<summary>
        /// Indicates if the instance is a emergency exit seat or not. 'true' means emergency exit seat and 'false' means not an emergency exit seat.
        /// </summary>
        [XmlAttribute]
        public bool IsExitRow { get; set; }

        ///<summary>
        /// Indicates if the seat is available for child or not. 'true' means available and 'false' means not available.
        /// </summary>
        [XmlAttribute]
        public bool IsAvailableForChild { get; set; }

        ///<summary>
        /// Indicates if the seat is available for infant or not. 'true' means available and 'false' means not available.
        /// </summary>
        [XmlAttribute]
        public bool IsAvailableForInfant { get; set; }

        ///<summary>
        /// Displays the seat number.
        /// </summary>
        [XmlAttribute]
        public string Number { get; set; }

        ///<summary>
        /// Displays the seat price.
        /// </summary>
        [XmlAttribute]
        public decimal Price { get; set; }

        ///<summary>
        /// Displays the seat price including credit card fee.
        /// </summary>
        [XmlAttribute]
        public decimal PriceWithCreditCardFee { get; set; }

        ///<summary>
        /// Displays the discount provided on the seat price.
        /// </summary>
        [XmlAttribute]
        public decimal DiscountAmount { get; set; }

        ///<summary>
        /// Displays the price band for the seat.
        /// </summary>
        [XmlAttribute]
        public string PriceBand { get; set; }

        ///<summary>
        /// Displays the unique identifier for the seat price band.
        /// </summary>
        [XmlAttribute]
        public int PriceBandId { get; set; }

        ///<summary>
        /// Indicates if the seat is a regular seat i.e. accessible to everyone or is a restricted one.
        /// </summary>
        [XmlAttribute]
        public string SeatAccess { get; set; }

        ///<summary>
        /// Gets or sets a value indicating whether this instance is bulkhead seat
        /// </summary>
        [XmlAttribute]
        public string IsBulkheadSeat { get; set; }

        //<summary>
        /// Gets or sets a value indicating whether this instance is occupied by infant.
        /// </summary>
        [XmlAttribute]
        public string IsOccupiedByInfant { get; set; }
    }
}
