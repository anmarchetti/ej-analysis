using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Booking.Extras;

[Serializable]
[DataContract]
public class FlightExtra
{
    [DataMember]
    public string FlightExtraCode { get; set; }

    [DataMember]
    public string Name { get; set; }

    [DataMember]
    public string Description { get; set; }

    [DataMember]
    public string Icon { get; set; }

    [DataMember]
    public int AvailableQuantity { get; set; }

    [DataMember]
    public decimal AdultPrice { get; set; }

    [DataMember]
    public decimal ChildPrice { get; set; }

    [DataMember]
    public int LimitPerPax { get; set; }
}