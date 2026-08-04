using easyJet.Holidays.Api.Domain.Data.AssistedTravel;
using easyJet.Holidays.Api.Domain.Data.ContactUs;

namespace easyJet.Holidays.Api.Domain.Interfaces.Salesforce;

/// <summary>
/// Salesforce integration contract.
/// </summary>
public interface ISalesforceService
{
    /// <summary>
    /// Sends Contact Us form data to Salesforce.
    /// </summary>
    Task<ContactUsResult> SendContacUsFormRequest(ContactFormRequest contactFormRequest, string caseCategory, string language);

    /// <summary>
    /// Retrieves Assisted Travel data for a booking.
    /// </summary>
    Task<AssistedTravelResult> GetAssistedTravelRequests(string bookingReference);

    /// <summary>
    /// Submits Assisted Travel questionnaire data for a booking.
    /// </summary>
    Task<AssistedTravelSubmissionResult> SubmitAssistedTravelRequests(string bookingReference, AssistedTravelSubmissionRequest request);
}
