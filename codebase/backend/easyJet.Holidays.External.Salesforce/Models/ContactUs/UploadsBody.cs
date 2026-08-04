using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Salesforce.Models.ContactUs;

[DataContract]
public record UploadsBody
{
    [DataMember(Name = "allOrNone")]
    public bool AllOrNone { get; init; }

    [DataMember(Name = "records")]
    public List<UploadFile> Files { get; init; }
}

[DataContract]
public record UploadFile
{
    [DataMember(Name = "Title")]
    public string Title { get; init; }

    [DataMember(Name = "PathOnClient")]
    public string PathOnClient { get; init; }

    [DataMember(Name = "VersionData")]
    public string Base64EncodedFile { get; init; }

    [DataMember(Name = "attributes")]
    public Attributes Attributes { get; init; }
}