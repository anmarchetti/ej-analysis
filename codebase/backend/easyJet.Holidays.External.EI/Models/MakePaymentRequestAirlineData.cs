using Newtonsoft.Json;
using System.Runtime.Serialization;
using System.Text;

namespace easyJet.Holidays.External.EI.Models
{

    /// <summary>
    /// This element contains reference reservation information that is used by PSP for fraud prevention/monitoring. The data in this element is sent directly to PSP and not stored in the Payments Server.
    /// </summary>
    [DataContract]
    public class MakePaymentRequestAirlineData
    {
        /// <summary>
        /// Booking reference number (PNR) (e.g. E111111)
        /// </summary>
        /// <value>Booking reference number (PNR) (e.g. E111111)</value>
        [DataMember(Name = "bookingReferenceNumber", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "bookingReferenceNumber")]
        public string BookingReferenceNumber { get; set; }

        /// <summary>
        /// Gets or Sets FlightDetails
        /// </summary>
        [DataMember(Name = "flightDetails", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "flightDetails")]
        public MakePaymentRequestAirlineDataFlightDetails FlightDetails { get; set; }

        /// <summary>
        /// Gets or Sets Passengers
        /// </summary>
        [DataMember(Name = "passengers", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "passengers")]
        public MakePaymentRequestAirlineDataPassengers Passengers { get; set; }

        /// <summary>
        /// Ticket number should be a unique reference to identify a booking and normally its not same as your booking reference (This will be used by Third party payment service provider for tracking and validation purpose and they request us not send the booking reference. This can be anything which allows users to identify the booking.)
        /// </summary>
        /// <value>Ticket number should be a unique reference to identify a booking and normally its not same as your booking reference (This will be used by Third party payment service provider for tracking and validation purpose and they request us not send the booking reference. This can be anything which allows users to identify the booking.)</value>
        [DataMember(Name = "ticketNumber", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "ticketNumber")]
        public string TicketNumber { get; set; }


        /// <summary>
        /// Get the string presentation of the object
        /// </summary>
        /// <returns>String presentation of the object</returns>
        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append("class MakePaymentRequestAirlineData {\n");
            sb.Append("  BookingReferenceNumber: ").Append(BookingReferenceNumber).Append("\n");
            sb.Append("  FlightDetails: ").Append(FlightDetails).Append("\n");
            sb.Append("  Passengers: ").Append(Passengers).Append("\n");
            sb.Append("  TicketNumber: ").Append(TicketNumber).Append("\n");
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
