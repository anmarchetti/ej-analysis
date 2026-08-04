using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Booking;

/// <summary>
/// Settings for Flight Extra Information
/// </summary>
[Serializable]
[DataContract]
public class FlightExtraInformationSettings
{
    /// <summary>
    /// Campaign Codes when we need to send FlightExtra Info to Atcom
    /// </summary>
    [DataMember(Name = "PromotionCodes")]
    public string PromotionCodes { get; set; }
}
