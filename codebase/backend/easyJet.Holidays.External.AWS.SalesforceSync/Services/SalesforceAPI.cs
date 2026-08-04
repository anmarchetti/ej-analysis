using System.Net.Http.Headers;
using System.Text;
using easyJet.Holidays.External.AWS.SalesforceSync.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.External.AWS.SalesforceSync.Services
{
    /// <summary>
    /// Implements <see cref="ISalesforceApi"/> to send booking flow requests to Salesforce and handle responses.
    /// </summary>
    [ExcludeFromCodeCoverage]
    public class SalesforceApi : ISalesforceApi
    {
        private readonly SalesforceConfiguration _config;
        private readonly ILogger<SalesforceApi> _logger;
        private readonly string[] _ignoredErrorCodes;

        /// <summary>
        /// Initializes a new instance of the <see cref="SalesforceApi"/> class.
        /// </summary>
        /// <param name="salesforceConfiguration">Salesforce connection settings.</param>
        /// <param name="logger">Logger for diagnostic messages.</param>
        public SalesforceApi(IOptions<SalesforceConfiguration> salesforceConfiguration, ILogger<SalesforceApi> logger)
        {
            _config = salesforceConfiguration?.Value ?? throw new ArgumentNullException(nameof(salesforceConfiguration));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _ignoredErrorCodes = (_config.ErrorCodesToIgnore ?? string.Empty)
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(code => code.Trim())
                .ToArray();
        }

        /// <inheritdoc/>
        public async Task<SalesforceResponse?> SendAsync(string accessToken, SalesforceRequest salesforceRequest)
        {
            ArgumentNullException.ThrowIfNull(salesforceRequest);

            if (salesforceRequest.Inputs == null || !salesforceRequest.Inputs.Any())
                throw new ArgumentException("SalesforceRequest must contain at least one input.", nameof(salesforceRequest));

            var reservationId = salesforceRequest.Inputs.FirstOrDefault()?.Booking?.ReservationId;
            var versionId = salesforceRequest.Inputs.FirstOrDefault()?.Booking?.VersionId;

            var payload = JsonConvert.SerializeObject(salesforceRequest);
            _logger.LogDebug("Prepared request: {Json}", payload);

            if (!_config.SendDataEnabled)
            {
                _logger.LogInformation("Sending data is disabled. Skipping booking with ReservationId={ReservationId} and Version={VersionId}. Prepared request: {Json}", reservationId, versionId, payload);
                return null;
            }
            
            using var client = new HttpClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

#pragma warning disable CA2000
            var content = new StringContent(payload, Encoding.UTF8, "application/json");
#pragma warning restore CA2000
            HttpResponseMessage response = await client.PostAsync(_config.BaseUrl, content);

            var responseBody = await response.Content.ReadAsStringAsync();
            _logger.LogDebug("Response from Salesforce: {Response}", responseBody);
            if (!response.IsSuccessStatusCode)
            {
                throw new HttpRequestException(
                    $"HTTP POST to Salesforce returned status {response.StatusCode} for BookingId={reservationId}, Version={versionId}. Response: {responseBody}");
            }

            var results = JsonConvert.DeserializeObject<SalesforceResponse[]>(responseBody);
            var salesforceResponse = results?.FirstOrDefault();
            if (salesforceResponse == null)
                return null;

            var success = salesforceResponse.OutputValues?.SuccessResult?.FirstOrDefault();
            if (success != null)
            {
                _logger.LogInformation(
                    "Successfully processed booking with ReservationId={ReservationId} and Version={VersionId}",
                    success.ReservationId, versionId);
                return salesforceResponse;
            }

            var error = salesforceResponse.OutputValues?.ErrorResult?.FirstOrDefault();
            if (error != null && _ignoredErrorCodes.Contains(error.ErrorCode))
            {
                _logger.LogWarning(
                    "Ignored booking due to Salesforce error {ErrorCode}: {ErrorDescription} for BookingId={ReservationId}, Version={VersionId}",
                    error.ErrorCode, error.ErrorDescription, reservationId, versionId);
                return salesforceResponse;
            }

            if (error != null)
            {
                throw new InvalidOperationException(
                    $"Salesforce error {error.ErrorCode}: {error.ErrorDescription} for BookingId={reservationId}, Version={versionId}");
            }

            return salesforceResponse;
        }
    }
}
