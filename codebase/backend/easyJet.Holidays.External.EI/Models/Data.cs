using Newtonsoft.Json;
using System.Runtime.Serialization;
using System.Text;

namespace easyJet.Holidays.External.EI.Models
{

    /// <summary>
    /// 
    /// </summary>
    [DataContract]
    public class Data
    {
        /// <summary>
        /// The name of the data field that is affected - eg flightKey
        /// </summary>
        /// <value>The name of the data field that is affected - eg flightKey</value>
        [DataMember(Name = "dataName", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "dataName")]
        public string DataName { get; set; }

        /// <summary>
        /// information about the data field that is affected
        /// </summary>
        /// <value>information about the data field that is affected</value>
        [DataMember(Name = "information", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "information")]
        public string Information { get; set; }


        /// <summary>
        /// Get the string presentation of the object
        /// </summary>
        /// <returns>String presentation of the object</returns>
        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append("class Data {\n");
            sb.Append("  DataName: ").Append(DataName).Append("\n");
            sb.Append("  Information: ").Append(Information).Append("\n");
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
