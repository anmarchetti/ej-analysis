using System.Xml.Serialization;

namespace easyJet.Holidays.External.B2B.Models.Seats
{
    public class Block
    {
        ///<summary>
        /// Represents seats map seat.
        /// </summary>
        [XmlArray("seats"), XmlArrayItem(typeof(Seat), ElementName = "seat")]
        public List<Seat> Seats { get; set; }
    }
}
