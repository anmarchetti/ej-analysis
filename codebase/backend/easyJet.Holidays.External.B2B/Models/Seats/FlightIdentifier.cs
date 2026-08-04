using System.Xml.Serialization;

namespace easyJet.Holidays.External.B2B.Models.Seats
{
    /// <summary>
    /// Flight ID data. Either Schedule or Flight Key should be set, they contain the same information in different ways
    /// </summary>
    [XmlRoot(ElementName = "FlightIdentifier")]
    public class FlightIdentifier
    {
        /// <summary>
        /// Format example: 20200310BCNLTN2264, date + departure + arrival + number
        /// </summary>
        [XmlElement(ElementName = "FlightKey")]
        public string FlightKey { get; set; }

        [XmlElement(ElementName = "Schedule")]
        public Schedule Schedule { get; set; }
    }

    [XmlRoot(ElementName = "Schedule")]
    public class Schedule
    {
        /// <summary>
        /// Departure airport code
        /// </summary>
        [XmlAttribute(AttributeName = "Departure")]
        public string Departure { get; set; }

        /// <summary>
        /// Arrival airport code
        /// </summary>
        [XmlAttribute(AttributeName = "Arrival")]
        public string Arrival { get; set; }

        /// <summary>
        /// Departure date
        /// </summary>
        [XmlAttribute(AttributeName = "Date")]
        public string Date { get; set; }

        /// <summary>
        /// Flight number
        /// </summary>
        [XmlAttribute(AttributeName = "Number")]
        public int Number { get; set; }
    }
}