using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Salesforce.Models.AssistedTravel;

[DataContract]
internal record AssistedTravelCaseBody
{
    [DataMember(Name = "RecordType")]
    public AssistedTravelRecordType RecordType { get; init; } = new();

    [DataMember(Name = "Origin")]
    public string Origin { get; init; } = "Web";

    [DataMember(Name = "Booking_Ref__r")]
    public AssistedTravelBookingLookup BookingReference { get; init; } = new();

    [DataMember(Name = "Type")]
    public string Type { get; init; } = "Assisted Travel";

    [DataMember(Name = "Stage__c")]
    public string Stage { get; init; } = "Pre-Travel";

    [DataMember(Name = "Reporter__c")] 
    public string Reporter { get; init; } = "Customer - Lead Passenger";

    [DataMember(Name = "Primary_Case_Category__c")]
    public string PrimaryCaseCategory { get; init; } = "Special Assistance";

    [DataMember(Name = "Sub_category_1__c")]
    public string SubCategory1 { get; init; } = "Assistance Request";

    [DataMember(Name = "Subject")]
    public string Subject { get; init; } = "Assisted Travel - Web Form";

    [DataMember(Name = "Description")]
    public string Description { get; init; } = "Assisted travel request";
}

[DataContract]
internal record AssistedTravelRecordType
{
    [DataMember(Name = "Name")]
    public string Name { get; init; } = "Customer Service";
}

[DataContract]
internal record AssistedTravelBookingLookup
{
    [DataMember(Name = "Name")]
    public string Name { get; init; } = string.Empty;
}

[DataContract]
internal record AssistedTravelQuestionnaireBatchBody
{
    [DataMember(Name = "records")]
    public IReadOnlyList<AssistedTravelQuestionnaireRecord> Records { get; init; } = [];
}

[DataContract]
internal record AssistedTravelQuestionnaireRecord
{
    [DataMember(Name = "attributes")]
    public AssistedTravelQuestionnaireAttributes Attributes { get; init; } = new();

    [DataMember(Name = "Passenger_Name__c")]
    public string PassengerName { get; init; } = string.Empty;

    [DataMember(Name = "Question__c")]
    public string Question { get; init; } = string.Empty;

    [DataMember(Name = "Question_Code__c")]
    public string QuestionCode { get; init; } = string.Empty;

    [DataMember(Name = "Answer__c")]
    public string Answer { get; init; } = string.Empty;

    [DataMember(Name = "Seq__c")]
    public int Sequence { get; init; }

    [DataMember(Name = "Case__c")]
    public string CaseId { get; init; } = string.Empty;

    [DataMember(Name = "Related_Booking__r")]
    public AssistedTravelBookingLookup? RelatedBooking { get; init; }
}

[DataContract]
internal record AssistedTravelQuestionnaireAttributes
{
    [DataMember(Name = "type")]
    public string Type { get; init; } = "Incident_Questionnaire__c";
}

