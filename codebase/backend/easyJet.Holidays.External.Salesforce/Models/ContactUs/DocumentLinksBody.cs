using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Salesforce.Models.ContactUs;

[DataContract]
public record DocumentLinksBody
{
    [DataMember(Name = "allOrNone")]
    public bool AllOrNone { get; init; }

    [DataMember(Name = "records")]
    public List<DocumentLink> Links { get; init; }
}

[DataContract]
public record DocumentLink
{
    [DataMember(Name = "ContentDocumentId")]
    public string ContentDocumentId { get; init; }

    [DataMember(Name = "LinkedEntityId")]
    public string LinkedEntityId { get; init; }

    [DataMember(Name = "Visibility")]
    public string Visibility { get; init; }

    [DataMember(Name = "attributes")]
    public Attributes Attributes { get; init; }
}
