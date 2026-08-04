using System.Xml.Serialization;

namespace easyJet.Holidays.External.B2B.Models.Seats
{
    public class GetSeatsPlanV1Response : B2BApiResponseBase<GetSeatsPlanV1Root>
    {

    }

    public class GetSeatsPlanV1Root
    {
        public GetSeatsPlanV1RootBody GetSeatPlanResponseV1 { get; set; }
    }

    public class GetSeatsPlanV1RootBody
    {
        /// <summary>
        /// Represents aircraft type code.
        /// </summary>
        [XmlAttribute]
        public string AircraftTypeRef { get; set; }

        /// <summary>
        /// Represent seat plan rows
        /// </summary>
        [XmlArray("Rows"), XmlArrayItem(typeof(RowV1), ElementName = "Row")]
        public RowV1[] Rows { get; set; }
    }

    public class RowV1
    {
        /// <summary>
        /// Represents the row number.
        /// </summary>
        [XmlAttribute]
        public int Number { get; set; }

        /// <summary>
        /// Indicates is row over wing.
        /// </summary>
        [XmlAttribute]
        public string OverWing { get; set; }

        /// <summary>
        /// Indicates is row is exit row.
        /// </summary>
        [XmlAttribute]
        public string ExitRow { get; set; }

        /// <summary>
        /// Displays the price band for the row.
        /// </summary>
        [XmlAttribute]
        public string ChargeCode { get; set; }

        /// <summary>
        /// Represents row seat blocks.
        /// </summary>
        [XmlArray("Blocks"), XmlArrayItem(typeof(BlockV1), ElementName = "Block")]
        public BlockV1[] Blocks { get; set; }
    }

    public class BlockV1
    {
        /// <summary>
        /// Represents seats map seat.
        /// </summary>
        [XmlArray("Seats"), XmlArrayItem(typeof(SeatV1), ElementName = "Seat")]
        public SeatV1[] Seats { get; set; }
    }

    /// <summary>
    /// Seat Details
    /// </summary>
    public class SeatV1
    {
        [XmlAttribute]
        public string Number { get; set; }

        [XmlAttribute]
        public string Position { get; set; }

        [XmlAttribute]
        public string Restricted { get; set; }

        [XmlAttribute]
        public string Occupied { get; set; }

        [XmlAttribute]
        public string Bulkhead { get; set; }
    }
}
