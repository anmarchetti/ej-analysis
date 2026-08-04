using System.Runtime.Serialization;

namespace easyJet.Holidays.External.AWS.FPSSync.Models;

public class FlightPriceMessagePayload
{
    public string Version { get; set; }
    public string Id { get; set; }
    public string DetailType { get; set; }
    public string Source { get; set; }
    public string Account { get; set; }
    public DateTime Time { get; set; }
    public string Region { get; set; }
    public List<string> Resources { get; set; }
    public Detail Detail { get; set; }
}

public class Detail
{
    public Metadata Metadata { get; set; }
    public Data Data { get; set; }
}

public class Metadata
{
    public string Service { get; set; }

    public string Provider { get; set; }

    public string Event_Type { get; set; }

    public string Message_Version { get; set; }

    public string Correlation_Id { get; set; }
}

public class Data
{
    public string FlightKey { get; set; }
    public string CarrierCode { get; set; }
    public string FlightNumber { get; set; }
    public bool Available { get; set; }
    public Departure Departure { get; set; }
    public Arrival Arrival { get; set; }
    public int AvailableSeats { get; set; }
    public List<Fare> Fares { get; set; }
}

[Serializable]
[DataContract]
public class Arrival
{
    [DataMember]
    public string AirportCode { get; set; }
    [DataMember]
    public DateTime Time { get; set; }
}

[Serializable]
[DataContract]
public class Departure
{
    [DataMember]
    public string AirportCode { get; set; }
    [DataMember]
    public DateTime Time { get; set; }
}

[Serializable]
[DataContract]
public class Fare
{
    [DataMember]
    public string Channel { get; set; }
    [DataMember]
    public int Adults { get; set; }
    [DataMember]
    public int Children { get; set; }
    [DataMember]
    public int Infants { get; set; }
    [DataMember]
    public List<FareTypes> FareTypes { get; set; }
}

[Serializable]
[DataContract]
public class FareTypes
{
    [DataMember]
    public string FareType { get; set; }
    [DataMember]
    public string FareClass { get; set; }
    [DataMember]
    public int AvailableSeats { get; set; }
    [DataMember]
    public List<Price> Prices { get; set; }
}

[Serializable]
[DataContract]
public class Price
{
    [DataMember]
    public string Currency { get; set; }
    [DataMember]
    public double OutboundPrice { get; set; }
    [DataMember]
    public double ReturnPrice { get; set; }
    [DataMember]
    public double BookingFee { get; set; }
}

