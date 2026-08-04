using easyJet.Holidays.Api.Domain.CustomJsonConverters;
using Newtonsoft.Json;

namespace easyJet.Holidays.Api.Domain.Data.ContactUs;

/// <summary>
/// Case types mapping from sitecore
/// </summary>
[Serializable]
public class CaseTypes
{
    [JsonProperty(nameof(Children))]
    public List<QuestionCaseTypeMapping> Children { get; set; }
}

[Serializable]
public class QuestionCaseTypeMapping
{
    [JsonProperty("Title")]
    public string Question { get; set; }

    [JsonProperty(nameof(SendTo))]
    [JsonConverter(typeof(ContactUsSendToConverter))]
    public ContactUsSendTo SendTo { get; set; }

    [JsonProperty(nameof(SalesforceCategory))]
    public string SalesforceCategory { get; set; }

    [JsonProperty(nameof(EmailSubject))]
    public string EmailSubject { get; set; }
    
    /// <summary>
    /// State associated with the case type
    /// </summary>
    [JsonProperty(nameof(State))]
    public string State { get; set; }
}
