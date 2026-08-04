using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Salesforce.Models.AssistedTravel;

/// <summary>
/// Typed Salesforce response for Assisted Travel case queries.
/// </summary>
internal class SalesforceAssistedTravelResponse : JsonApiResponse<SalesforceAssistedTravelResponseBody>
{
	/// <inheritdoc />
	public override ApiError[] ApiErrors => null!;
}

/// <summary>
/// Top-level payload returned by the Salesforce Assisted Travel query.
/// </summary>
[DataContract]
internal record SalesforceAssistedTravelResponseBody
{
	/// <summary>
	/// Number of case records returned.
	/// </summary>
	[DataMember(Name = "totalSize")]
	public int TotalSize { get; init; }

	/// <summary>
	/// Indicates whether Salesforce returned all matching records.
	/// </summary>
	[DataMember(Name = "done")]
	public bool Done { get; init; }

	/// <summary>
	/// Assisted Travel case records returned by Salesforce.
	/// </summary>
	[DataMember(Name = "records")]
	public IReadOnlyList<SalesforceAssistedTravelCaseRecord> Records { get; init; } = [];
}

/// <summary>
/// Salesforce case record that contains Assisted Travel questionnaire data.
/// </summary>
[DataContract]
internal record SalesforceAssistedTravelCaseRecord
{
	/// <summary>
	/// Salesforce case identifier.
	/// </summary>
	[DataMember(Name = "Id")]
	public string? Id { get; init; }

	/// <summary>
	/// Salesforce creation date/time of the case.
	/// </summary>
	[DataMember(Name = "CreatedDate")]
	public DateTimeOffset? CreatedDate { get; init; }

	/// <summary>
	/// Salesforce booking reference lookup.
	/// </summary>
	[DataMember(Name = "Booking_Ref__r")]
	public SalesforceBookingReference? BookingReference { get; init; }

	/// <summary>
	/// Nested questionnaire records associated with the case.
	/// </summary>
	[DataMember(Name = "Incident_Questionnaires__r")]
	public SalesforceIncidentQuestionnaireGroup? IncidentQuestionnaires { get; init; }
}

/// <summary>
/// Salesforce booking reference lookup data.
/// </summary>
[DataContract]
internal record SalesforceBookingReference
{
	/// <summary>
	/// Booking reference value.
	/// </summary>
	[DataMember(Name = "Name")]
	public string? Name { get; init; }
}

/// <summary>
/// Nested questionnaire collection returned by Salesforce.
/// </summary>
[DataContract]
internal record SalesforceIncidentQuestionnaireGroup
{
	/// <summary>
	/// Number of questionnaire records returned.
	/// </summary>
	[DataMember(Name = "totalSize")]
	public int TotalSize { get; init; }

	/// <summary>
	/// Indicates whether Salesforce returned all questionnaire records.
	/// </summary>
	[DataMember(Name = "done")]
	public bool Done { get; init; }

	/// <summary>
	/// Questionnaire records returned for the case.
	/// </summary>
	[DataMember(Name = "records")]
	public IReadOnlyList<SalesforceIncidentQuestionnaireRecord> Records { get; init; } = [];
}

/// <summary>
/// Salesforce questionnaire row mapped to a passenger and answer string.
/// </summary>
[DataContract]
internal record SalesforceIncidentQuestionnaireRecord
{
	/// <summary>
	/// Passenger name stored against the questionnaire entry.
	/// </summary>
	[DataMember(Name = "Passenger_Name__c")]
	public string? PassengerName { get; init; }

	/// <summary>
	/// Question text recorded for this questionnaire row.
	/// </summary>
	[DataMember(Name = "Question__c")]
	public string? Question { get; init; }

	/// <summary>
	/// Semicolon-delimited assistance answers recorded in Salesforce.
	/// </summary>
	[DataMember(Name = "Answer__c")]
	public string? Answer { get; init; }

	/// <summary>
	/// Sequence value to preserve question ordering.
	/// </summary>
	[DataMember(Name = "Seq__c")]
	public int? Sequence { get; init; }

	/// <summary>
	/// Salesforce creation date/time for this questionnaire row.
	/// </summary>
	[DataMember(Name = "CreatedDate")]
	public DateTimeOffset? CreatedDate { get; init; }
}

