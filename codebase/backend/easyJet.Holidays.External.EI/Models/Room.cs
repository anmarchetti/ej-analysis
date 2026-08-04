using Newtonsoft.Json;
using System.Runtime.Serialization;
using System.Text;

namespace easyJet.Holidays.External.EI.Models
{

    /// <summary>
    /// 
    /// </summary>
    [DataContract]
    public class Room
    {
        /// <summary>
        /// Unique reference to a room
        /// </summary>
        /// <value>Unique reference to a room</value>
        [DataMember(Name = "id", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "id")]
        public string Id { get; set; }

        /// <summary>
        /// Specific room code.
        /// </summary>
        /// <value>Specific room code.</value>
        [DataMember(Name = "code", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "code")]
        public string Code { get; set; }

        /// <summary>
        /// Details of the room.
        /// </summary>
        /// <value>Details of the room.</value>
        [DataMember(Name = "description", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "description")]
        public string Description { get; set; }

        /// <summary>
        /// Type of stay
        /// </summary>
        /// <value>Type of stay</value>
        [DataMember(Name = "stay", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "stay")]
        public string Stay { get; set; }

        /// <summary>
        /// Details of the stay
        /// </summary>
        /// <value>Details of the stay</value>
        [DataMember(Name = "stayDetail", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "stayDetail")]
        public string StayDetail { get; set; }

        /// <summary>
        /// Price of room excluding tax.
        /// </summary>
        /// <value>Price of room excluding tax.</value>
        [DataMember(Name = "basePrice", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "basePrice")]
        public decimal? BasePrice { get; set; }

        /// <summary>
        /// Gets or Sets PaxPrices
        /// </summary>
        [DataMember(Name = "paxPrices", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "paxPrices")]
        public List<PaxPrice> PaxPrices { get; set; }


        /// <summary>
        /// Get the string presentation of the object
        /// </summary>
        /// <returns>String presentation of the object</returns>
        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append("class Room {\n");
            sb.Append("  Id: ").Append(Id).Append("\n");
            sb.Append("  Code: ").Append(Code).Append("\n");
            sb.Append("  Description: ").Append(Description).Append("\n");
            sb.Append("  Stay: ").Append(Stay).Append("\n");
            sb.Append("  StayDetail: ").Append(StayDetail).Append("\n");
            sb.Append("  BasePrice: ").Append(BasePrice).Append("\n");
            sb.Append("  PaxPrices: ").Append(PaxPrices).Append("\n");
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
