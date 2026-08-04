using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Exceptions.Payment;
using easyJet.Holidays.Api.Domain.Interfaces.Payment;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Exceptions;
using easyJet.Holidays.External.ApplePay.Models;
using Microsoft.Extensions.Options;
using Newtonsoft.Json.Linq;

namespace easyJet.Holidays.External.ApplePay.Services;

/// <summary>
/// Service for Apple Pay merchant validation proxy
/// </summary>
public class ApplePayMerchantValidationProxyService : IApplePayMerchantValidatorProxyService
{
    private readonly ApplePaySettings _applePaySettings;
    private readonly IApiService _apiService;

    /// <summary>
    /// Constructor for Apple Pay merchant validation proxy service
    /// </summary>
    /// <param name="paymentMethodsSettings">PaymentMethodsSettings</param>
    /// <param name="apiService">API Service</param>
    public ApplePayMerchantValidationProxyService(IOptions<PaymentMethodsSettings> paymentMethodsSettings, IApiService apiService)
    {
        _applePaySettings = paymentMethodsSettings != null ? paymentMethodsSettings.Value.ApplePay : throw new ArgumentNullException(nameof(paymentMethodsSettings));
        _apiService = apiService ?? throw new ArgumentNullException(nameof(apiService));
    }
    
    /// <summary>
    /// Get Apple Pay session object from proxy
    /// </summary>
    /// <param name="validationUrl"></param>
    /// <param name="requestDomain"></param>
    /// <returns> Apple Pay object session with JObject format </returns>
    /// <exception cref="Exception"></exception>
    public async Task<JObject> GetSessionObject(Uri validationUrl, string requestDomain)
    {
        try
        {
            ApplePayGetSessionRequest request = new()
            {
                Endpoint = new Uri(_applePaySettings.ApplePayMerchantValidatorProxyHost + _applePaySettings.MerchantValidationPath),
                Payload =
                {
                    Body = new ApplePayGetSessionRequestBody()
                    {
                        DisplayName = _applePaySettings.DisplayName,
                        RequestDomain = requestDomain,
                        ValidationUrl = validationUrl,
                        Origin = "EasyjetHolidays"
                    }
                }
            };
            ApplePayGetSessionResponse response = await _apiService.GetResponseContentAsync<ApplePayGetSessionRequest, ApplePayGetSessionResponse>(request);
            return response.Payload.Body;
        }
        catch (ErrorResponseException ex)
        {
            throw new ApplePayProxyException("Error during Apple Pay Merchant Validation Proxy Service: " + ex.Response?.PayloadString, ex);
        }
        catch (Exception ex)
        {
            throw new ApplePayProxyException("Error during Apple Pay Merchant Validation Proxy Service", ex);
        }
    }
}