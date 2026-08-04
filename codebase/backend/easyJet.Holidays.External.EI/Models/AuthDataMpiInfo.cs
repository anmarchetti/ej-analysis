using Newtonsoft.Json;
using System.Runtime.Serialization;
using System.Text;

namespace easyJet.Holidays.External.EI.Models
{

    /// <summary>
    /// This is used in cases where customer is authenticated externally (by third-party) using a MPI solution. The cryptograms from the MPI is sent to easyJet for processing.
    /// </summary>
    [DataContract]
    public class AuthDataMpiInfo
    {
        /// <summary>
        /// Include this parameter if the transaction goes through a challenge authentication flow. This is the transStatus from the last CRes (Challenge Response).
        /// </summary>
        /// <value>Include this parameter if the transaction goes through a challenge authentication flow. This is the transStatus from the last CRes (Challenge Response).</value>
        [DataMember(Name = "cresTransStatus", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "cresTransStatus")]
        public string CresTransStatus { get; set; }

        /// <summary>
        /// Authentication value obtained from MPI - applies to both 3DS1/2
        /// </summary>
        /// <value>Authentication value obtained from MPI - applies to both 3DS1/2</value>
        [DataMember(Name = "av", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "av")]
        public string Av { get; set; }

        /// <summary>
        /// The enrollment response from the directory server. This is the transStatus from the ARes(Authentication Request).
        /// </summary>
        /// <value>The enrollment response from the directory server. This is the transStatus from the ARes(Authentication Request).</value>
        [DataMember(Name = "aresTransStatus", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "aresTransStatus")]
        public string AresTransStatus { get; set; }

        /// <summary>
        /// Electronic Commerce Indicator
        /// </summary>
        /// <value>Electronic Commerce Indicator</value>
        [DataMember(Name = "eci", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "eci")]
        public string Eci { get; set; }

        /// <summary>
        /// Directory server transaction Id that uniquely identify the transaction.
        /// </summary>
        /// <value>Directory server transaction Id that uniquely identify the transaction.</value>
        [DataMember(Name = "dsTransId", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "dsTransId")]
        public string DsTransId { get; set; }

        /// <summary>
        /// The version of the 3DS protocol (e.g. 1 or 2)
        /// </summary>
        /// <value>The version of the 3DS protocol (e.g. 1 or 2)</value>
        [DataMember(Name = "version", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "version")]
        public string Version { get; set; }

        /// <summary>
        /// The algorithm used during the 3DS1 authentication.
        /// </summary>
        /// <value>The algorithm used during the 3DS1 authentication.</value>
        [DataMember(Name = "algorithm", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "algorithm")]
        public string Algorithm { get; set; }


        /// <summary>
        /// Get the string presentation of the object
        /// </summary>
        /// <returns>String presentation of the object</returns>
        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append("class AuthDataMpiInfo {\n");
            sb.Append("  CresTransStatus: ").Append(CresTransStatus).Append("\n");
            sb.Append("  Av: ").Append(Av).Append("\n");
            sb.Append("  AresTransStatus: ").Append(AresTransStatus).Append("\n");
            sb.Append("  Eci: ").Append(Eci).Append("\n");
            sb.Append("  DsTransId: ").Append(DsTransId).Append("\n");
            sb.Append("  Version: ").Append(Version).Append("\n");
            sb.Append("  Algorithm: ").Append(Algorithm).Append("\n");
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
