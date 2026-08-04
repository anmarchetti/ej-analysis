using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Salesforce.Models;

[DataContract]
public abstract record SalesforceRequestBase
{
    [DataMember(Name = "method")]
    protected string Method { get; init; }

    [DataMember(Name = "url")]
    public Uri Url { get; init; }

    [DataMember(Name = "referenceId")]
    public string ReferenceId { get; init; }
}
