using easyJet.Holidays.External.Domain.Models.Api;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Cms.Models.Luggage;

/// <summary>
/// request to sitecore get luggage endpoint
/// </summary>
[DataContract]
public class GetLuggageRequest : JsonApiRequest<object>
{
    /// <summary>
    /// Method to use for the request
    /// </summary>
    public override HttpMethod Method => HttpMethod.Get;

    /// <summary>
    /// Represents the current requested language
    /// </summary>
    [DataMember(Name = "language")]
    public string Language { get; set; }
}
