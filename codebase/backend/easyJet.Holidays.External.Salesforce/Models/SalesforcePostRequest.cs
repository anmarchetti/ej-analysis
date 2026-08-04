using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Salesforce.Models;

[DataContract]
public record SalesforcePostRequest<T> : SalesforceRequestBase where T : class
{
    public SalesforcePostRequest()
    {
        Method = "POST";
    }

    [DataMember(Name = "body")]
    public T Body { get; init; }
}
