using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api.Client;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using System.Net.Http.Headers;

namespace easyJet.Holidays.External.ApplePay.Api;

/// <summary>
/// ApplePay API client
/// </summary>
public class ApplePayApiClient : BaseApiClient
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    
    /// <summary>
    /// Apple Pay API client constructor
    /// </summary>
    /// <param name="client"></param>
    /// <param name="envSettings"></param>
    /// <param name="httpContextAccessor"></param>
    public ApplePayApiClient(HttpClient client, IOptions<EnvironmentBehaviourSettings> envSettings, IHttpContextAccessor httpContextAccessor) : base(client, envSettings)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    /// <summary>
    /// Media Type
    /// </summary>
    public override string MediaType  => "application/json";

    /// <summary>
    /// Method to prepare the Apple Pay request before sending it
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    public override Task PrepareRequestMessage(HttpRequestMessage request)
    {
        ArgumentNullException.ThrowIfNull(request);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        request.Headers.Add("X-Api-CorrelationId", _httpContextAccessor.HttpContext?.TraceIdentifier);
        request.Headers.ExpectContinue = false;

        return base.PrepareRequestMessage(request);
    }
}