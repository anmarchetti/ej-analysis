using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Booking.Extras;

[Serializable]
[DataContract]
public class FlightExtraSearchRequest
{
    [DataMember(Name = "guests")]
    [Required]
    public List<Person> Guests { get; set; }

    [DataMember(Name = "offer")]
    [Required]
    public Offer Offer { get; set; }

    [DataMember(Name = "isPostBooking")]
    public bool IsPostBooking { get; set; }
}