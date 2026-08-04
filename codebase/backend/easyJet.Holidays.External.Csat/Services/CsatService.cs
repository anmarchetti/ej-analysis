using easyJet.Holidays.Api.Domain.Interfaces.Marketing;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Csat.Models;
using easyJet.Holidays.External.Domain.Api;
using Microsoft.Extensions.Options;
using System.Globalization;

namespace easyJet.Holidays.External.Csat.Services;

/// <summary>
/// Service for handling Customer Satisfaction (CSAT) operations, including checking email marketing consent
/// based on a customer’s email address.
/// </summary>
public class CsatService : ICsatService
{
    private readonly IApiService _apiService;
    private readonly CsatSettings _csatSettings;

    /// <summary>
    /// Initializes a new instance of the <see cref="CsatService"/> class.
    /// </summary>
    /// <param name="apiService">The API service used for making requests.</param>
    /// <param name="csatSettings">settings for the CSAT service</param>
    public CsatService(IApiService apiService, IOptions<CsatSettings> csatSettings)
    {
        _apiService = apiService;
        _csatSettings = csatSettings?.Value ?? throw new ArgumentNullException(nameof(csatSettings));
    }

    /// <summary>
    /// Checks the marketing email consent status for a specified email address.
    /// </summary>
    /// <param name="email">The email address of the customer.</param>
    /// <returns>A task that represents the asynchronous operation, containing a boolean value:
    /// <c>true</c> if marketing emails are allowed, <c>false</c> otherwise.</returns>
    public async Task<bool> CheckMarketingEmailConsent(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new ArgumentNullException(nameof(email), "Email cannot be null or empty.");
        }

        var request = new EmailConsentRequest
        {
            Email = email.ToLower(CultureInfo.InvariantCulture),
            Endpoint = _csatSettings.CsatUrl
        };

        request.SetQueryString();

        var responseContentAsync = await _apiService.GetResponseContentAsync<EmailConsentRequest, EmailConsentResponse>(request);
        return responseContentAsync?.Payload.Body ?? false;
    }

    /// <summary>
    /// Sends a request to unsubscribe a customer based on their email address.
    /// </summary>
    /// <param name="email">The email address of the customer to unsubscribe.</param>
    /// <returns>A task that represents the asynchronous operation. Returns <c>true</c> if the operation succeeded, <c>false</c> otherwise.</returns>
    public async Task<bool> UnsubscribeEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new ArgumentNullException(nameof(email), "Email cannot be null or empty.");
        }

        var request = new EmailUnsubscribeRequest
        {
            Email = email.ToLower(CultureInfo.InvariantCulture),
            Endpoint = new Uri($"{_csatSettings.CsatUrl}/unsubscribe")
        };
        request.SetQueryString();

        var responseContentAsync = await _apiService.GetResponseContentAsync<EmailUnsubscribeRequest, EmailUnsubscribeResponse>(request);
        return responseContentAsync != null;
    }
}