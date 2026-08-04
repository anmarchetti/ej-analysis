using easyJet.Holidays.External.Domain.Models.Api;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Salesforce.Models;

public class SalesforceCompositeRequest : JsonApiRequest<SalesforceCompositeRequestBody>
{
    public override HttpMethod Method => HttpMethod.Post;
}

[DataContract]
public record SalesforceCompositeRequestBody
{
    [DataMember(Name = "allOrNone")]
    public bool AllOrNone { get; init; }

    [DataMember(Name = "collateSubrequests")]
    public bool CollateSubrequests { get; init; }

    [DataMember(Name = "compositeRequest")]
    public List<SalesforceRequestBase> Requests { get; init; }
}