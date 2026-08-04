using Newtonsoft.Json;
using System.Runtime.Serialization;
using System.Text;

namespace easyJet.Holidays.External.EI.Models
{

    /// <summary>
    /// 
    /// </summary>
    [DataContract]
    public class MakePaymentRequestAirlineDataFlightDetailsSector
    {
        /// <summary>
        /// The 3 character arrival airport code. The Payment Service will not validate this value against reservation system. Example: BCN
        /// </summary>
        /// <value>The 3 character arrival airport code. The Payment Service will not validate this value against reservation system. Example: BCN</value>
        [DataMember(Name = "arrivalAirportCode", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "arrivalAirportCode")]
        public string ArrivalAirportCode { get; set; }

        /// <summary>
        /// The date and time of the leg in YYYY-MM-DDTHH:MM:SS format. Example: 2017-03-09T06:55:00
        /// </summary>
        /// <value>The date and time of the leg in YYYY-MM-DDTHH:MM:SS format. Example: 2017-03-09T06:55:00</value>
        [DataMember(Name = "dateOfTravel", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "dateOfTravel")]
        public string DateOfTravel { get; set; }

        /// <summary>
        /// The 3 character arrival airport code. The Payment Service will not validate this value against reservation system. Example: LGW
        /// </summary>
        /// <value>The 3 character arrival airport code. The Payment Service will not validate this value against reservation system. Example: LGW</value>
        [DataMember(Name = "departureAirportCode", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "departureAirportCode")]
        public string DepartureAirportCode { get; set; }

        /// <summary>
        /// The 4 digit flight number. The Payment Service will not validate this value against reservation system. Example: 8571
        /// </summary>
        /// <value>The 4 digit flight number. The Payment Service will not validate this value against reservation system. Example: 8571</value>
        [DataMember(Name = "flightNumber", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "flightNumber")]
        public string FlightNumber { get; set; }

        /// <summary>
        /// Airline carrier code
        /// </summary>
        /// <value>Airline carrier code</value>
        [DataMember(Name = "carrierCode", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "carrierCode")]
        public string CarrierCode { get; set; }

        /// <summary>
        /// Booking class; usually single letter (Y)
        /// </summary>
        /// <value>Booking class; usually single letter (Y)</value>
        [DataMember(Name = "bookingClass", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "bookingClass")]
        public string BookingClass { get; set; }


        /// <summary>
        /// Get the string presentation of the object
        /// </summary>
        /// <returns>String presentation of the object</returns>
        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append("class MakePaymentRequestAirlineDataFlightDetailsSector {\n");
            sb.Append("  ArrivalAirportCode: ").Append(ArrivalAirportCode).Append("\n");
            sb.Append("  DateOfTravel: ").Append(DateOfTravel).Append("\n");
            sb.Append("  DepartureAirportCode: ").Append(DepartureAirportCode).Append("\n");
            sb.Append("  FlightNumber: ").Append(FlightNumber).Append("\n");
            sb.Append("  CarrierCode: ").Append(CarrierCode).Append("\n");
            sb.Append("  BookingClass: ").Append(BookingClass).Append("\n");
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
