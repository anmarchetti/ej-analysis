using easyJet.Holidays.Api.Domain.Data.AssistedTravel;
using easyJet.Holidays.Api.Domain.Data.ContactUs;
using easyJet.Holidays.Api.Domain.Interfaces.Salesforce;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Models.Api.Payload;
using easyJet.Holidays.External.Salesforce.Mappers;
using easyJet.Holidays.External.Salesforce.Models;
using easyJet.Holidays.External.Salesforce.Models.AssistedTravel;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Salesforce.Services
{
    /// <summary>
    /// Salesforce integration service for Contact Us and Assisted Travel operations.
    /// </summary>
    public class SalesforceService : ISalesforceService
    {
        private readonly IApiService _apiService;
        private readonly ILogger<SalesforceService> _logger;
        private readonly SalesforceApiSettings _salesforceApiSettings;

        /// <summary>
        /// Creates a new <see cref="SalesforceService"/> instance.
        /// </summary>
        /// <param name="apiService">API service used to call Salesforce.</param>
        /// <param name="salesforceApiSettings">Salesforce API configuration.</param>
        /// <param name="logger">Logger instance.</param>
        public SalesforceService(IApiService apiService, IOptions<SalesforceApiSettings> salesforceApiSettings,
            ILogger<SalesforceService> logger)
        {
            ArgumentNullException.ThrowIfNull(apiService);
            ArgumentNullException.ThrowIfNull(salesforceApiSettings);

            _apiService = apiService;
            _logger = logger;
            _salesforceApiSettings = salesforceApiSettings.Value;
        }

        /// <summary>
        /// Sends a Contact Us form request to Salesforce.
        /// </summary>
        /// <param name="contactFormRequest">The contact form request.</param>
        /// <param name="caseCategory">The Salesforce case category.</param>
        /// <param name="language">The API language.</param>
        /// <returns>The Salesforce case creation result.</returns>
        public async Task<ContactUsResult> SendContacUsFormRequest(ContactFormRequest contactFormRequest,
            string caseCategory, string language)
        {
            var languageCode = _salesforceApiSettings.LanguageMap[language];
            var salesforceRequest =
                await ContactUsFormMapper.ToSalesforceContactUsFormRequest(contactFormRequest, caseCategory,
                    languageCode);

            var request = new SalesforceCompositeRequest
            {
                Endpoint = new Uri(_salesforceApiSettings.DataEndpoint),
                Payload = new JsonApiPayload<SalesforceCompositeRequestBody> { Body = salesforceRequest }
            };

            var apiResponse =
                await _apiService.GetResponseContentAsync<SalesforceCompositeRequest, SalesforceCompositeResponse>(
                    request);
            var result = ContactUsFormMapper.ToContactUsResult(apiResponse);

            if (result.IsSuccessful)
            {
                return result;
            }

            _logger.LogError("Salesforce Contact Us response contains errors: {Payload}", apiResponse.PayloadString);
            throw new InvalidOperationException("Salesforce response contains errors: " + apiResponse.PayloadString);
        }

        /// <summary>
        /// Retrieves Assisted Travel requests for a booking from Salesforce.
        /// </summary>
        /// <param name="bookingReference">The booking reference to query.</param>
        /// <returns>Passenger-level Assisted Travel data for the booking.</returns>
        public async Task<AssistedTravelResult> GetAssistedTravelRequests(string bookingReference)
        {
            ArgumentException.ThrowIfNullOrWhiteSpace(bookingReference);

            var request = new SalesforceQueryRequest
            {
                Endpoint = AssistedTravelMapper.ToSalesforceAssistedTravelRequest(
                    _salesforceApiSettings.DataEndpoint, bookingReference)
            };

            var apiResponse =
                await _apiService.GetResponseContentAsync<SalesforceQueryRequest, SalesforceAssistedTravelResponse>(
                    request);
            var result = AssistedTravelMapper.ToAssistedTravelResult(apiResponse);

            return result;
        }

        /// <summary>
        /// Submits Assisted Travel questionnaire answers to Salesforce.
        /// </summary>
        /// <param name="bookingReference">The booking reference.</param>
        /// <param name="request">Assisted Travel submission payload.</param>
        /// <returns>Submission outcome and case id.</returns>
        public async Task<AssistedTravelSubmissionResult> SubmitAssistedTravelRequests(string bookingReference,
            AssistedTravelSubmissionRequest request)
        {
            ArgumentException.ThrowIfNullOrWhiteSpace(bookingReference);
            ArgumentNullException.ThrowIfNull(request);

            var existingAssistedTravel = await GetAssistedTravelRequests(bookingReference);
            var existingCaseId = existingAssistedTravel.CaseId;

            var salesforceRequestBody =
                AssistedTravelMapper.ToSalesforceAssistedTravelSubmissionRequest(bookingReference, existingCaseId,
                    request);

            var requestModel = new SalesforceCompositeRequest
            {
                Endpoint = new Uri(_salesforceApiSettings.DataEndpoint),
                Payload = new JsonApiPayload<SalesforceCompositeRequestBody> { Body = salesforceRequestBody }
            };

            var apiResponse =
                await _apiService.GetResponseContentAsync<SalesforceCompositeRequest, SalesforceCompositeResponse>(
                    requestModel);
            var result = AssistedTravelMapper.ToAssistedTravelSubmissionResult(apiResponse, existingCaseId);

            if (result.IsSuccessful)
            {
                return result;
            }

            _logger.LogError("Salesforce Assisted Travel submission response contains errors: {Payload}",
                apiResponse.PayloadString);
            throw new InvalidOperationException("Salesforce Assisted Travel submission failed: " +
                                                apiResponse.PayloadString);
        }
    }
}