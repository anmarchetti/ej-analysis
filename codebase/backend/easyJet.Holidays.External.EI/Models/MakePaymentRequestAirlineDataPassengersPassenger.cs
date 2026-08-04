using Newtonsoft.Json;
using System.Runtime.Serialization;
using System.Text;

namespace easyJet.Holidays.External.EI.Models
{

    /// <summary>
    /// 
    /// </summary>
    [DataContract]
    public class MakePaymentRequestAirlineDataPassengersPassenger
    {
        /// <summary>
        /// Passenger Id (uniquely identify a passenger in this request)
        /// </summary>
        /// <value>Passenger Id (uniquely identify a passenger in this request)</value>
        [DataMember(Name = "id", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "id")]
        public string Id { get; set; }

        /// <summary>
        /// The first name of the passenger.
        /// </summary>
        /// <value>The first name of the passenger.</value>
        [DataMember(Name = "firstName", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "firstName")]
        public string FirstName { get; set; }

        /// <summary>
        /// The last name of the passenger.
        /// </summary>
        /// <value>The last name of the passenger.</value>
        [DataMember(Name = "lastName", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "lastName")]
        public string LastName { get; set; }

        /// <summary>
        /// Gender of the passenger
        /// </summary>
        /// <value>Gender of the passenger</value>
        [DataMember(Name = "gender", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "gender")]
        public string Gender { get; set; }

        /// <summary>
        /// Indicates whether the passenger is the lead passenger.
        /// </summary>
        /// <value>Indicates whether the passenger is the lead passenger.</value>
        [DataMember(Name = "isLead", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "isLead")]
        public bool? IsLead { get; set; }

        /// <summary>
        /// Age of the passenger
        /// </summary>
        /// <value>Gender of the passenger</value>
        [DataMember(Name = "age", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "age")]
        public int Age { get; set; }

        /// <summary>
        /// Get the string presentation of the object
        /// </summary>
        /// <returns>String presentation of the object</returns>
        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append("class MakePaymentRequestAirlineDataPassengersPassenger {\n");
            sb.Append("  Id: ").Append(Id).Append("\n");
            sb.Append("  FirstName: ").Append(FirstName).Append("\n");
            sb.Append("  LastName: ").Append(LastName).Append("\n");
            sb.Append("  Gender: ").Append(Gender).Append("\n");
            sb.Append("  Age: ").Append(Age).Append("\n");
            sb.Append("  IsLead: ").Append(IsLead).Append("\n");
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
