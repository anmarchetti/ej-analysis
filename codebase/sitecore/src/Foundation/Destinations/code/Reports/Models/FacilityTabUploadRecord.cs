using System;

namespace easyJet.Foundation.Destinations.Reports.Models
{
    public class FacilityTabUploadRecord
    {
        /// <summary>
        /// Gets or sets hotel code.
        /// </summary>
        public string HotelCode { get; set; }

        /// <summary>
        /// Gets or sets hotel name.
        /// </summary>
        public string HotelName { get; set; }

        /// <summary>
        /// Gets or sets date time.
        /// </summary>
        public DateTime DateTime { get; set; }

        /// <summary>
        /// Gets or sets message.
        /// </summary>
        public string Message { get; set; }
    }
}
