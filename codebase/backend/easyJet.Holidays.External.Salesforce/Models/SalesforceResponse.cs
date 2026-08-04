using System.Net;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Salesforce.Models;

[DataContract]
public record SalesforceResponse
{
    [DataMember(Name = "httpStatusCode")]
    public HttpStatusCode StatusCode { get; init; }

    [DataMember(Name = "referenceId")]
    public string ReferenceId { get; init; }

    [DataMember(Name = "httpHeaders")]
    public HttpHeaders? HttpHeaders { get; init; }

    /// <summary>
    /// Has different structure depending on which request it corresponds to, could be an object or collection of objects
    /// At runtime it will be either JObject if it's an object or JArray if it's a collection
    /// </summary>
    [DataMember(Name = "body")]
    public dynamic Body { get; init; }
}

[DataContract]
public record HttpHeaders
{
    [DataMember(Name = "Location")]
    public Uri Location { get; init; }
}
