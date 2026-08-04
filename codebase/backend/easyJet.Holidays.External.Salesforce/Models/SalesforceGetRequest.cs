using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Salesforce.Models;

[DataContract]
public record SalesforceGetRequest : SalesforceRequestBase
{
    public SalesforceGetRequest()
    {
        Method = "GET";
    }
}
