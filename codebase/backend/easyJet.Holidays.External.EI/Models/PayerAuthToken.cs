using Newtonsoft.Json;
using System.Runtime.Serialization;
using System.Text;

namespace easyJet.Holidays.External.EI.Models
{

    /// <summary>
    /// This element contains the information that is passed to the Channel to initiate Step 2 of a 3D secure payment
    /// </summary>
    [DataContract]
    public class PayerAuthToken
    {
        /// <summary>
        /// The URL that channel has to redirect in order for the customer to complete 3D Secure authorisation.
        /// </summary>
        /// <value>The URL that channel has to redirect in order for the customer to complete 3D Secure authorisation.</value>
        [DataMember(Name = "issuerUrl", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "issuerUrl")]
        public Uri IssuerUrl { get; set; }

        /// <summary>
        /// Encryption value that has to be sent to the Issuer
        /// </summary>
        /// <value>Encryption value that has to be sent to the Issuer</value>
        [DataMember(Name = "md", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "md")]
        public string Md { get; set; }

        /// <summary>
        /// Encryption value that has to be sent to the Issuer.
        /// </summary>
        /// <value>Encryption value that has to be sent to the Issuer.</value>
        [DataMember(Name = "paReq", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "paReq")]
        public string PaReq { get; set; }

        /// <summary>
        /// Encryption value that has to be sent from the Issuer.
        /// </summary>
        /// <value>Encryption value that has to be sent from the Issuer.</value>
        [DataMember(Name = "paRes", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "paRes")]
        public string PaRes { get; set; }

        /// <summary>
        /// The endpoint that will receive the 3DS1 challenge completion notification (applies to GDS partners that would like to use easyJet as MPI only)
        /// </summary>
        /// <value>The endpoint that will receive the 3DS1 challenge completion notification (applies to GDS partners that would like to use easyJet as MPI only)</value>
        [DataMember(Name = "termUrl", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "termUrl")]
        public string TermUrl { get; set; }

        /// <summary>
        /// Gets or Sets ThreeDS2Data
        /// </summary>
        [DataMember(Name = "threeDS2Data", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "threeDS2Data")]
        public PayerAuthTokenThreeDS2Data ThreeDS2Data { get; set; }


        /// <summary>
        /// Get the string presentation of the object
        /// </summary>
        /// <returns>String presentation of the object</returns>
        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append("class PayerAuthToken {\n");
            sb.Append("  IssuerUrl: ").Append(IssuerUrl).Append("\n");
            sb.Append("  Md: ").Append(Md).Append("\n");
            sb.Append("  PaReq: ").Append(PaReq).Append("\n");
            sb.Append("  PaRes: ").Append(PaRes).Append("\n");
            sb.Append("  TermUrl: ").Append(TermUrl).Append("\n");
            sb.Append("  ThreeDS2Data: ").Append(ThreeDS2Data).Append("\n");
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
