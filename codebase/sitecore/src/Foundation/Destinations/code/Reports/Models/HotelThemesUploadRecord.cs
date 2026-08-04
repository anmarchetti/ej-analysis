using System;

namespace easyJet.Foundation.Destinations.Reports.Models
{
    public class HotelThemesUploadRecord
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
        /// Gets or sets hotel theme.
        /// </summary>
        public string HotelTheme { get; set; }

        /// <summary>
        /// Gets or sets hotel theme code.
        /// </summary>
        public string HotelThemeCode { get; set; }

        /// <summary>
        /// Gets or sets hotel type.
        /// </summary>
        public string HotelType { get; set; }

        /// <summary>
        /// Gets or sets hotel type code.
        /// </summary>
        public string HotelTypeCode { get; set; }

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