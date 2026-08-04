using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Salesforce.Models.ContactUs;

[DataContract]
public record Attributes
{
    [DataMember(Name = "type")]
    public string Type { get; init; }
}
