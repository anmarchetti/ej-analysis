namespace easyJet.Holidays.Api.Domain.Data.Hotels.Facilities
{
    /// <summary>
    /// Facility available for filtering model 
    /// </summary>
    public class FilteredFacility
    {
        /// <summary>
        /// Facility id
        /// </summary>
        public string ItemID { get; set; }

        /// <summary>
        /// Name of the Facility
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Code of the Facility
        /// </summary>
        public string Code { get; set; }

        /// <summary>
        /// Group to which the facility belongs
        /// </summary>
        public string GroupCode { get; set; }
    }
}
