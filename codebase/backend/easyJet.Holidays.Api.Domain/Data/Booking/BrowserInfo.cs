using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Booking
{
    public class BrowserInfo
    {
        /// <summary>
        /// This element contains the 'Accept' header of the request from a web channel. Example: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*_/_*;q=0.8. (required for 3DS)
        /// </summary>
        /// <value>This element contains the 'Accept' header of the request from a web channel. Example: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*_/_*;q=0.8. (required for 3DS)</value>
        [DataMember(EmitDefaultValue = false, Name = "acceptHeader")]
        public string AcceptHeader { get; set; }

        /// <summary>
        /// This element contains the 'user agent' information of the request from a web channel. Example: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36. (required for 3DS)
        /// </summary>
        /// <value>This element contains the 'user agent' information of the request from a web channel. Example: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36. (required for 3DS)</value>
        [DataMember(EmitDefaultValue = false, Name = "userAgent")]
        public string UserAgent { get; set; }

        /// <summary>Colour depth of the browser. (required for 3DS)</summary>
        /// <value>Colour depth of the browser. (required for 3DS)</value>
        [DataMember(EmitDefaultValue = false, Name = "colourDepth")]
        public int? ColourDepth { get; set; }

        /// <summary>
        /// Card holder browser to execute Java (e.g. navigator.javaEnabled) (required for 3DS).
        /// </summary>
        /// <value>Card holder browser to execute Java (e.g. navigator.javaEnabled) (required for 3DS).</value>
        [DataMember(EmitDefaultValue = false, Name = "javaEnabled")]
        public bool? JavaEnabled { get; set; }

        /// <summary>
        /// Card holder browser to execute JavaScript (required for 3DS).
        /// </summary>
        /// <value>Card holder browser to execute JavaScript (required for 3DS).</value>
        [DataMember(EmitDefaultValue = false, Name = "javaScriptEnabled")]
        public bool? JavaScriptEnabled { get; set; }

        /// <summary>Browser language. (required for 3DS)</summary>
        /// <value>Browser language. (required for 3DS)</value>
        [DataMember(EmitDefaultValue = false, Name = "language")]
        public string Language { get; set; }

        /// <summary>Card holder window height (required for 3DS).</summary>
        /// <value>Card holder window height (required for 3DS).</value>
        [DataMember(EmitDefaultValue = false, Name = "screenHeight")]
        public int? ScreenHeight { get; set; }

        /// <summary>Card holder window width (required for 3DS).</summary>
        /// <value>Card holder window width (required for 3DS).</value>
        [DataMember(EmitDefaultValue = false, Name = "screenWidth")]
        public int? ScreenWidth { get; set; }

        /// <summary>
        /// Timezone offset between UTC and card holder local time.
        /// </summary>
        /// <value>Timezone offset between UTC and card holder local time.</value>
        [DataMember(EmitDefaultValue = false, Name = "timeZoneOffset")]
        public int? TimeZoneOffset { get; set; }
    }
}
