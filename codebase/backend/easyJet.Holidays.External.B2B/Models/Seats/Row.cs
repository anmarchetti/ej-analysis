using System.Xml.Serialization;

namespace easyJet.Holidays.External.B2B.Models.Seats
{
    public class Row
    {
        ///<summary>
        /// Represents the row number.
        /// </summary>
        [XmlAttribute]
        public int RowNumber { get; set; }

        ///<summary>
        /// Indicates is row over wing.
        /// </summary>
        [XmlAttribute]
        public bool IsOverWing { get; set; }

        ///<summary>
        /// Indicates is row is exit row.
        /// </summary>
        [XmlAttribute]
        public bool IsExitRow { get; set; }

        ///<summary>
        /// Displays the price band for the row.
        /// </summary>
        [XmlAttribute]
        public string PriceBandName { get; set; }

        ///<summary>
        /// Represents row seat blocks.
        /// </summary>
        [XmlArray("blocks"), XmlArrayItem(typeof(Block), ElementName = "block")]
        public List<Block> Blocks { get; set; }
    }
}
