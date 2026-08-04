using Newtonsoft.Json;
using System.Runtime.Serialization;
using System.Text;

namespace easyJet.Holidays.External.EI.Models
{

    /// <summary>
    /// This element contains a list of passengers in the reservation including any infants.
    /// </summary>
    [DataContract]
    public class MakePaymentRequestAirlineDataPassengers
    {
        /// <summary>
        /// The name of the passenger.
        /// </summary>
        /// <value>The name of the passenger.</value>
        [DataMember(Name = "passenger", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "passenger")]
        public List<MakePaymentRequestAirlineDataPassengersPassenger> Passenger { get; set; }


        /// <summary>
        /// Get the string presentation of the object
        /// </summary>
        /// <returns>String presentation of the object</returns>
        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append("class MakePaymentRequestAirlineDataPassengers {\n");
            sb.Append("  Passenger: ").Append(Passenger).Append("\n");
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
