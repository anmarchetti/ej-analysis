using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking;

[Serializable]
[DataContract]
public class AmendFlightOfferResponse
{
    /// <summary>
    /// Alternative flight offers.
    /// </summary>
    [DataMember(Name = "offers")]
    public List<AlternativeFlightOffer> Offers { get; set; }
}