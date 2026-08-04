using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.ErrataInfo;

/// <summary>
/// request parameters to get errata messages
/// </summary>
public class AccomErrataInfoRequest
{
    /// <summary>
    /// Accommodation or geography codes list
    /// </summary>
    [Required]
    [DataMember(Name = "codes")]
    public string[] Codes { get; set; }

    /// <summary>
    /// Start offer date
    /// </summary>
    [Required]
    [DataMember(Name = "offerDate")]
    public DateTime? OfferDate { get; set; }
}