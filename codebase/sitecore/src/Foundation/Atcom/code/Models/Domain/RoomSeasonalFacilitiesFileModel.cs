namespace easyJet.Foundation.Atcom.Models.Domain
{
    public class RoomSeasonalFacilitiesFileModel
    {
        /// <summary>
        /// Gets or sets facility code.
        /// </summary>
        public string FacilityCode { get; set; }

        /// <summary>
        /// Gets or sets start date of seasonal facility.
        /// </summary>
        public string StartDate { get; set; }

        /// <summary>
        /// Gets or sets end date of seasonal facility.
        /// </summary>
        public string EndDate { get; set; }

        public override string ToString()
        {
            return $"{FacilityCode}\t{StartDate}\t{EndDate}";
        }
    }
}