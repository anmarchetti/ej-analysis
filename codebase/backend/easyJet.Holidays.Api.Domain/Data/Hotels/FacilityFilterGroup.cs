namespace easyJet.Holidays.Api.Domain.Data.Hotels
{
    /// <summary>
    /// Model for facility group
    /// </summary>
    [Serializable]
    public class FacilityFilterGroup
    {
        /// <summary>
        /// Facility type code
        /// </summary>
        public string Code { get; set; }

        /// <summary>
        /// Facility type Title
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Gets or sets tracking id
        /// </summary>
        public string TrackingId { get; set; }

        /// <summary>
        /// Facility type parent group name
        /// </summary>
        public string ParentName { get; set; }

        /// <summary>
        /// Facility type parent group code
        /// </summary>
        public string ParentCode { get; set; }

        /// <summary>
        /// Tooltip text
        /// </summary>
        public string Tooltip { get; set; }
    }
}
