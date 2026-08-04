using System;

namespace easyJet.Foundation.Destinations.Reports.Models
{
    public class FacilityUploadRecord
    {
        public string HotelCode { get; set; }

        public string HotelName { get; set; }

        public string FacilityCode { get; set; }

        public string FacilityName { get; set; }

        public string FacilityFilterGroup { get; set; }

        public DateTime DateTime { get; set; }

        public string Message { get; set; }
    }
}