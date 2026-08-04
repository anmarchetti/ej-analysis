namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class FacilityUpload
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="FacilityUpload"/> class.
        /// This ctor needs for deserialization.
        /// </summary>
        public FacilityUpload()
        {
        }

        public FacilityUpload(string hotelCode, string facilityCode, string facilityName, string facilityGroup, string hotelName, string facilityFilterGroup)
        {
            HotelCode = hotelCode;
            FacilityCode = facilityCode;
            FacilityName = facilityName;
            FacilityGroup = facilityGroup;
            HotelName = hotelName;
            FacilityFilterGroup = facilityFilterGroup;
        }

        public string HotelCode { get; set; }

        public string FacilityCode { get; set; }

        public string FacilityName { get; set; }

        public string FacilityGroup { get; set; }

        public string HotelName { get; set; }

        public string FacilityFilterGroup { get; set; }
}
}