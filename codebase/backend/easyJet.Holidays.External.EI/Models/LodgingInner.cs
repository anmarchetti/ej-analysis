using Newtonsoft.Json;
using System.Runtime.Serialization;
using System.Text;

namespace easyJet.Holidays.External.EI.Models
{

    /// <summary>
    /// 
    /// </summary>
    [DataContract]
    public class LodgingInner
    {
        /// <summary>
        /// Unique reference to a hotel
        /// </summary>
        /// <value>Unique reference to a hotel</value>
        [DataMember(Name = "id", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "id")]
        public string Id { get; set; }

        /// <summary>
        /// Hotel name
        /// </summary>
        /// <value>Hotel name</value>
        [DataMember(Name = "name", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "name")]
        public string Name { get; set; }

        /// <summary>
        /// Hotel rating
        /// </summary>
        /// <value>Hotel rating</value>
        [DataMember(Name = "rating", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "rating")]
        public string Rating { get; set; }

        /// <summary>
        /// Check-in date. Format: Date i.e. YYYY-MM-DD
        /// </summary>
        /// <value>Check-in date. Format: Date i.e. YYYY-MM-DD</value>
        [DataMember(Name = "checkInDate", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "checkInDate")]
        public string CheckInDate { get; set; }

        /// <summary>
        /// Check-out date. Format: Date i.e. YYYY-MM-DD
        /// </summary>
        /// <value>Check-out date. Format: Date i.e. YYYY-MM-DD</value>
        [DataMember(Name = "checkOutDate", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "checkOutDate")]
        public string CheckOutDate { get; set; }

        /// <summary>
        /// Price for hotel excluding tax
        /// </summary>
        /// <value>Price for hotel excluding tax</value>
        [DataMember(Name = "basePrice", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "basePrice")]
        public decimal? BasePrice { get; set; }

        /// <summary>
        /// Gets or Sets Address
        /// </summary>
        [DataMember(Name = "address", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "address")]
        public Address Address { get; set; }

        /// <summary>
        /// Gets or Sets Rooms
        /// </summary>
        [DataMember(Name = "rooms", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "rooms")]
        public List<Room> Rooms { get; set; }


        /// <summary>
        /// Get the string presentation of the object
        /// </summary>
        /// <returns>String presentation of the object</returns>
        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append("class LodgingInner {\n");
            sb.Append("  Id: ").Append(Id).Append("\n");
            sb.Append("  Name: ").Append(Name).Append("\n");
            sb.Append("  Rating: ").Append(Rating).Append("\n");
            sb.Append("  CheckInDate: ").Append(CheckInDate).Append("\n");
            sb.Append("  CheckOutDate: ").Append(CheckOutDate).Append("\n");
            sb.Append("  BasePrice: ").Append(BasePrice).Append("\n");
            sb.Append("  Address: ").Append(Address).Append("\n");
            sb.Append("  Rooms: ").Append(Rooms).Append("\n");
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
