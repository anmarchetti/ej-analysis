using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Booking.Extras;

[Serializable]
[DataContract]
public class FlightExtraCategory
{
    [DataMember(Name = "categoryCode")]
    public string CategoryCode { get; set; }

    [DataMember(Name = "categoryName")]
    public string CategoryName { get; set; }

    [DataMember(Name = "categoryType")]
    public string CategoryType { get; set; }

    [DataMember(Name = "flightExtras")]
    public List<FlightExtra> FlightExtras { get; set; } = new();
}