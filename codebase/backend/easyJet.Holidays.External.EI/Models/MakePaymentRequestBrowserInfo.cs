using Newtonsoft.Json;
using System.Runtime.Serialization;
using System.Text;

namespace easyJet.Holidays.External.EI.Models
{

    /// <summary>
    /// This element is required for Web only. This element contains information that is used by the PSP to trigger 3D Secure challenge to the channel
    /// </summary>
    [DataContract]
    public class MakePaymentRequestBrowserInfo
    {
        /// <summary>
        /// This element contains the 'Accept' header of the request from a web channel. Example: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*_/_*;q=0.8. (required for 3DS)
        /// </summary>
        /// <value>This element contains the 'Accept' header of the request from a web channel. Example: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*_/_*;q=0.8. (required for 3DS)</value>
        [DataMember(Name = "acceptHeader", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "acceptHeader")]
        public string AcceptHeader { get; set; }

        /// <summary>
        /// This element contains the 'user agent' information of the request from a web channel. Example: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36. (required for 3DS)
        /// </summary>
        /// <value>This element contains the 'user agent' information of the request from a web channel. Example: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36. (required for 3DS)</value>
        [DataMember(Name = "userAgent", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "userAgent")]
        public string UserAgent { get; set; }

        /// <summary>
        /// Colour depth of the browser. (required for 3DS)
        /// </summary>
        /// <value>Colour depth of the browser. (required for 3DS)</value>
        [DataMember(Name = "colourDepth", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "colourDepth")]
        public int? ColourDepth { get; set; }

        /// <summary>
        /// Card holder browser to execute Java (e.g. navigator.javaEnabled) (required for 3DS).
        /// </summary>
        /// <value>Card holder browser to execute Java (e.g. navigator.javaEnabled) (required for 3DS).</value>
        [DataMember(Name = "javaEnabled", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "javaEnabled")]
        public bool? JavaEnabled { get; set; }

        /// <summary>
        /// Card holder browser to execute JavaScript (required for 3DS).
        /// </summary>
        /// <value>Card holder browser to execute JavaScript (required for 3DS).</value>
        [DataMember(Name = "javaScriptEnabled", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "javaScriptEnabled")]
        public bool? JavaScriptEnabled { get; set; }

        /// <summary>
        /// Browser language. (required for 3DS)
        /// </summary>
        /// <value>Browser language. (required for 3DS)</value>
        [DataMember(Name = "language", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "language")]
        public string Language { get; set; }

        /// <summary>
        /// Card holder window height (required for 3DS).
        /// </summary>
        /// <value>Card holder window height (required for 3DS).</value>
        [DataMember(Name = "screenHeight", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "screenHeight")]
        public int? ScreenHeight { get; set; }

        /// <summary>
        /// Card holder window width (required for 3DS).
        /// </summary>
        /// <value>Card holder window width (required for 3DS).</value>
        [DataMember(Name = "screenWidth", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "screenWidth")]
        public int? ScreenWidth { get; set; }

        /// <summary>
        /// Timezone offset between UTC and card holder local time.
        /// </summary>
        /// <value>Timezone offset between UTC and card holder local time.</value>
        [DataMember(Name = "timeZoneOffset", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "timeZoneOffset")]
        public int? TimeZoneOffset { get; set; }


        /// <summary>
        /// Get the string presentation of the object
        /// </summary>
        /// <returns>String presentation of the object</returns>
        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append("class MakePaymentRequestBrowserInfo {\n");
            sb.Append("  AcceptHeader: ").Append(AcceptHeader).Append("\n");
            sb.Append("  UserAgent: ").Append(UserAgent).Append("\n");
            sb.Append("  ColourDepth: ").Append(ColourDepth).Append("\n");
            sb.Append("  JavaEnabled: ").Append(JavaEnabled).Append("\n");
            sb.Append("  JavaScriptEnabled: ").Append(JavaScriptEnabled).Append("\n");
            sb.Append("  Language: ").Append(Language).Append("\n");
            sb.Append("  ScreenHeight: ").Append(ScreenHeight).Append("\n");
            sb.Append("  ScreenWidth: ").Append(ScreenWidth).Append("\n");
            sb.Append("  TimeZoneOffset: ").Append(TimeZoneOffset).Append("\n");
            sb.Append("}\n");
            return sb.ToString();
        }

        /// <summary>
        /// Get the JSON string presentation of the object
        /// </summary>
        /// <returns>JSON string presentation of the object</returns>
        public string ToJson()
        {
            return JsonConvert.SerializeObject(this, Formatting.Indented);
        }

    }
}
