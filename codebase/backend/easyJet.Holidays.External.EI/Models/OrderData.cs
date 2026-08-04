using Newtonsoft.Json;
using System.Runtime.Serialization;
using System.Text;

namespace easyJet.Holidays.External.EI.Models
{

    /// <summary>
    /// 
    /// </summary>
    [DataContract]
    public class OrderData
    {
        /// <summary>
        /// Agent who is making the transaction
        /// </summary>
        /// <value>Agent who is making the transaction</value>
        [DataMember(Name = "agentName", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "agentName")]
        public string AgentName { get; set; }

        /// <summary>
        /// Type of agent
        /// </summary>
        /// <value>Type of agent</value>
        [DataMember(Name = "agentType", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "agentType")]
        public string AgentType { get; set; }

        /// <summary>
        /// Order creation date/time. Format: YYYY-MM-DDTHH:MM:SS
        /// </summary>
        /// <value>Order creation date/time. Format: YYYY-MM-DDTHH:MM:SS</value>
        [DataMember(Name = "createDateTime", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "createDateTime")]
        public string CreateDateTime { get; set; }

        /// <summary>
        /// Total amount that is due.
        /// </summary>
        /// <value>Total amount that is due.</value>
        [DataMember(Name = "amountDue", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "amountDue")]
        public decimal? AmountDue { get; set; }

        /// <summary>
        /// Amount that has been paid so far.
        /// </summary>
        /// <value>Amount that has been paid so far.</value>
        [DataMember(Name = "receivedAmount", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "receivedAmount")]
        public decimal? ReceivedAmount { get; set; }


        /// <summary>
        /// Get the string presentation of the object
        /// </summary>
        /// <returns>String presentation of the object</returns>
        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append("class OrderData {\n");
            sb.Append("  AgentName: ").Append(AgentName).Append("\n");
            sb.Append("  AgentType: ").Append(AgentType).Append("\n");
            sb.Append("  CreateDateTime: ").Append(CreateDateTime).Append("\n");
            sb.Append("  AmountDue: ").Append(AmountDue).Append("\n");
            sb.Append("  ReceivedAmount: ").Append(ReceivedAmount).Append("\n");
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
