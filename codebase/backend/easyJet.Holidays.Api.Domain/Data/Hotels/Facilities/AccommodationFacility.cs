namespace easyJet.Holidays.Api.Domain.Data.Hotels.Facilities
{
    /// <summary>
    /// Hotel facility model
    /// </summary>
    public class AccommodationFacility : BaseFacility
    {
        /// <summary>
        /// Distance in meters to the facility
        /// </summary>
        public float? Distance { get; set; }

        /// <summary>
        /// Indicates that the facility is set as errata message.
        /// </summary>
        public bool IsErrataInfo { get; set; }
    }
}
