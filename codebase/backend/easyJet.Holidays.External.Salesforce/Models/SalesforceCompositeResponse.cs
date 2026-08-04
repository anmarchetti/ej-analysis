using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Salesforce.Models;

public class SalesforceCompositeResponse : JsonApiResponse<SalesforceCompositeResponseBody>
{
    public override ApiError[] ApiErrors => null;
}

[DataContract]
public record SalesforceCompositeResponseBody
{
    [DataMember(Name = "compositeResponse")]
    public List<SalesforceResponse> Responses { get; init; }
}

