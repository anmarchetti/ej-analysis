using System.Xml.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Booking
{
    public class B2BData
    {
        [XmlElement(ElementName = "Passengers")]
        public Passengers Passengers { get; set; }

        public bool IsDisrupted()
        {
            return Passengers?.Passenger?.Any(passenger => passenger.Itinerary?.Segment?.Any(segment => !string.IsNullOrEmpty(segment.Disruption?.Level)) ?? false) ?? false;
        }

        public Flight MatchFlight(string routeId)
        {
            return Passengers?.Passenger?.FirstOrDefault()?.Itinerary?.Segment?.FirstOrDefault(segment => segment.Flight.FlightNumber == routeId)?.Flight;
        }
    }

    public class Passengers
    {
        [XmlElement(ElementName = "Passenger")]
        public List<Passenger> Passenger { get; set; }
    }

    public class Passenger
    {
        [XmlElement(ElementName = "Itinerary")]
        public Itinerary Itinerary { get; set; }
    }

    public class Itinerary
    {
        [XmlElement(ElementName = "Segment")]
        public List<Segment> Segment { get; set; }
    }

    public class Segment
    {
        [XmlElement(ElementName = "Disruption")]
        public Disruption Disruption { get; set; }

        [XmlElement(ElementName = "Flight")]
        public Flight Flight { get; set; }
    }

    public class Flight
    {
        [XmlAttribute(AttributeName = "FlightKey")]
        public string FlightKey { get; set; }

        [XmlAttribute(AttributeName = "CarrierCode")]
        public string CarrierCode { get; set; }

        [XmlAttribute(AttributeName = "FlightNumber")]
        public string FlightNumber { get; set; }

        [XmlElement(ElementName = "Departure")]
        public Departure Departure { get; set; }

        [XmlElement(ElementName = "Arrival")]
        public Arrival Arrival { get; set; }
    }

    public class Arrival
    {
        [XmlElement(ElementName = "Terminal")]
        public Terminal Terminal { get; set; }
    }

    public class Departure
    {
        [XmlElement(ElementName = "Terminal")]
        public Terminal Terminal { get; set; }
    }
    public class Terminal
    {
        [XmlAttribute(AttributeName = "Code")]
        public string Code { get; set; }

        [XmlAttribute(AttributeName = "Name")]
        public string Name { get; set; }
    }

    public class Disruption
    {
        [XmlAttribute(AttributeName = "Level")]
        public string Level { get; set; }

        [XmlAttribute(AttributeName = "UpdatedAt")]
        public string UpdatedAt { get; set; }
    }
}
