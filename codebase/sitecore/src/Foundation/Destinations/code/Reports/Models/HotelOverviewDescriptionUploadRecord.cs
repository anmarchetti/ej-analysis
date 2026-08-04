using System;

namespace easyJet.Foundation.Destinations.Reports.Models
{
    public class HotelOverviewDescriptionUploadRecord
    {
        /// <summary>
        /// Gets or sets giata code.
        /// </summary>
        public string GiataCode { get; set; }

        /// <summary>
        /// Gets or sets hotel overview description.
        /// </summary>
        public string HotelOverviewDescription { get; set; }

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