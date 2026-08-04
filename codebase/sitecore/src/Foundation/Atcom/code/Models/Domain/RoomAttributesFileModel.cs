using CsvHelper.Configuration.Attributes;

namespace easyJet.Foundation.Atcom.Models.Domain
{
    public class RoomAttributesFileModel
    {
        /// <summary>
        /// Gets or sets facility code.
        /// </summary>
        [Index(0)]
        public string FacilityCode { get; set; }

        /// <summary>
        /// Gets or sets facility name.
        /// </summary>
        [Index(1)]
        public string FacilityName { get; set; }
    }
}