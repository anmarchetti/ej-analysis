using Newtonsoft.Json;
using System.Runtime.Serialization;
using System.Text;

namespace easyJet.Holidays.External.EI.Models
{

    /// <summary>
    /// The 3DS2 data that is useful for 3DS2 workflow.
    /// </summary>
    [DataContract]
    public class PayerAuthTokenThreeDS2Data
    {
        /// <summary>
        /// The provider that should be used for 3DS2 workflow.
        /// </summary>
        /// <value>The provider that should be used for 3DS2 workflow.</value>
        [DataMember(Name = "authority", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "authority")]
        public string Authority { get; set; }

        /// <summary>
        /// The device that data applies to (e.g. browser, app)
        /// </summary>
        /// <value>The device that data applies to (e.g. browser, app)</value>
        [DataMember(Name = "mode", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "mode")]
        public string Mode { get; set; }

        /// <summary>
        /// Software that should be used for workflow.
        /// </summary>
        /// <value>Software that should be used for workflow.</value>
        [DataMember(Name = "use", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "use")]
        public string Use { get; set; }

        /// <summary>
        /// Gets or Sets Data
        /// </summary>
        [DataMember(Name = "data", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "data")]
        public List<PayerAuthTokenThreeDS2DataData> Data { get; set; }


        /// <summary>
        /// Get the string presentation of the object
        /// </summary>
        /// <returns>String presentation of the object</returns>
        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append("class PayerAuthTokenThreeDS2Data {\n");
            sb.Append("  Authority: ").Append(Authority).Append("\n");
            sb.Append("  Mode: ").Append(Mode).Append("\n");
            sb.Append("  Use: ").Append(Use).Append("\n");
            sb.Append("  Data: ").Append(Data).Append("\n");
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
