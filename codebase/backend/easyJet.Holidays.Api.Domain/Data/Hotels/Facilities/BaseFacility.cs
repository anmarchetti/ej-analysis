namespace easyJet.Holidays.Api.Domain.Data.Hotels.Facilities
{
    /// <summary>
    /// Hotel facility model
    /// </summary>
    public class BaseFacility
    {
        /// <summary>
        /// Name of the Facility
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Code of the Facility
        /// </summary>
        public string FacilityCode { get; set; }

        /// <summary>
        /// Group to which the facility belongs
        /// </summary>
        public string FacilityGroupCode { get; set; }

        /// <summary>
        /// Numeric value of the facility
        /// </summary>
        public string Number { get; set; }

        /// <summary>
        /// FacilityGroup info of the facility
        /// </summary>
        public FacilityFilterGroup FacilityFilterGroup { get; set; }

        /// <summary>
        /// Disclaimer Message of the facility
        /// </summary>
        public string DisclaimerMessage { get; set; }

        /// <summary>
        /// Icon of facility
        /// </summary>
        public string Icon { get; set; }
    }
}
