using Newtonsoft.Json;
using System.Runtime.Serialization;
using System.Text;

namespace easyJet.Holidays.External.EI.Models
{

    /// <summary>
    /// details of an error
    /// </summary>
    [DataContract]
    public class Error
    {
        /// <summary>
        /// this is the code of the information this can be the error code or warning code
        /// </summary>
        /// <value>this is the code of the information this can be the error code or warning code</value>
        [DataMember(Name = "code", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "code")]
        public string Code { get; set; }

        /// <summary>
        /// the message related to the information, this could be an error message or an information message
        /// </summary>
        /// <value>the message related to the information, this could be an error message or an information message</value>
        [DataMember(Name = "message", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "message")]
        public string Message { get; set; }

        /// <summary>
        /// Gets or Sets AffectedData
        /// </summary>
        [DataMember(Name = "affectedData", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "affectedData")]
        public List<Data> AffectedData { get; set; }


        /// <summary>
        /// Get the string presentation of the object
        /// </summary>
        /// <returns>String presentation of the object</returns>
        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append("class Error {\n");
            sb.Append("  Code: ").Append(Code).Append("\n");
            sb.Append("  Message: ").Append(Message).Append("\n");
            sb.Append("  AffectedData: ").Append(AffectedData).Append("\n");
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
