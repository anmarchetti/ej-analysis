using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Booking
{
    /// <summary>
    /// Disruption Info
    /// </summary>
    [DataContract]
    public class DisruptionInfo
    {
        /// <summary>
        /// Gets a list of disruption itinerary information
        /// </summary>
        [DataMember]
        public List<DisruptionItineraryInfo> Itinerary { get; set; } = new List<DisruptionItineraryInfo>();
    }

    /// <summary>
    /// Disruption Itinerary Info
    /// </summary>
    [DataContract]
    public class DisruptionItineraryInfo
    {
        /// <summary>
        /// Gets or sets the passenger index
        /// </summary>
        [DataMember]
        public int PaxIndex { get; set; }

        /// <summary>
        /// Gets or sets the level of disruption
        /// </summary>
        [DataMember]
        public string DisruptionLevel { get; set; }

        /// <summary>
        /// Gets or sets the unique key for the flight
        /// </summary>
        [DataMember]
        public string FlightKey { get; set; }

        /// <summary>
        /// Gets or sets the carrier code for the flight
        /// </summary>
        [DataMember]
        public string CarrierCode { get; set; }

        /// <summary>
        /// Gets or sets the flight number
        /// </summary>
        [DataMember]
        public string FlightNumber { get; set; }

        /// <summary>
        /// Gets or sets the departure airport code
        /// </summary>
        [DataMember]
        public DisruptionItineraryTerminal DepartureTerminal { get; set; }

        /// <summary>
        /// Gets or sets the departure airport name
        /// </summary>
        [DataMember]
        public DisruptionItineraryTerminal ArrivalTerminal { get; set; }
    }

    /// <summary>
    /// Disruption Itinerary Info Terminal
    /// </summary>
    [DataContract]
    public class DisruptionItineraryTerminal
    {
        /// <summary>
        /// Gets or sets the terminal code
        /// </summary>
        [DataMember]
        public string Code { get; set; }

        /// <summary>
        /// Gets or sets the terminal name
        /// </summary>
        [DataMember]
        public string Name { get; set; }
    }
}