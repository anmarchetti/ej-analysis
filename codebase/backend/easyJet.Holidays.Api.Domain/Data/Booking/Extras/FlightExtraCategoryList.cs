using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Booking.Extras;

[Serializable]
[DataContract]
public class FlightExtraCategoryList
{
    [DataMember(Name = "routeId")]
    public string RouteId { get; set; }

    [DataMember(Name = "flightNumber")]
    public string FlightNumber { get; set; }

    [DataMember(Name = "flightExtraCategories")]
    public List<FlightExtraCategory> FlightExtraCategories { get; set; } = new();
}