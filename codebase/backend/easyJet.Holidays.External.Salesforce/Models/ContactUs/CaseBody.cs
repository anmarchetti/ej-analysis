using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Salesforce.Models.ContactUs;

[DataContract]
public record CaseBody
{
    [DataMember(Name = "Subject")]
    public string Subject { get; init; }

    [DataMember(Name = "Alternate_Booking_Reference__c")]
    public string BookingRef { get; init; }

    [DataMember(Name = "Description")]
    public string Description { get; init; }

    [DataMember(Name = "Primary_Case_Category__c")]
    public string PrimaryCaseCategory { get; init; }

    [DataMember(Name = "Origin")]
    public string Origin { get; init; }

    [DataMember(Name = "Stage__c")]
    public string Stage { get; init; }

    [DataMember(Name = "Web_First_Name__c")]
    public string FirstName { get; init; }

    [DataMember(Name = "Web_Last_Name__c")]
    public string LastName { get; init; }

    [DataMember(Name = "SuppliedEmail")]
    public string Email { get; init; }

    [DataMember(Name = "SuppliedPhone")]
    public string MobilePhone { get; init; }

    [DataMember(Name = "Language__c")]
    public string Language { get; init; }

    /// <summary>
    /// Gets or inits the Salesforce RecordTypeId for the case.
    /// </summary>
    [DataMember(Name = "RecordTypeId")]
    public string? RecordTypeId { get; init; }
}
