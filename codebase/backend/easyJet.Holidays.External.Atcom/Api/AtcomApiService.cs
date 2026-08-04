using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Models.Booking;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Exceptions;
using easyJet.Holidays.External.Domain.Extensions;
using easyJet.Holidays.External.Domain.Models.Api;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Atcom.Api;

public class AtcomApiService : ApiService
{
    private readonly AtcomSettings _atcomSettings;
    protected readonly ITradeAgentAuthenticationService _tradeAgentAuthService;

    public AtcomApiService(
        AtcomApiClient apiClient,
        IOptions<AtcomSettings> atcomSettings,
        ITradeAgentAuthenticationService tradeAgentAuthService
        ) : base(apiClient)
    {
        _atcomSettings = atcomSettings.Value ?? throw new ArgumentNullException(nameof(atcomSettings));
        _tradeAgentAuthService = tradeAgentAuthService;
    }

    public override string Name() => "Atcom API service.";

    public override async Task<TResponse> GetResponseContentAsync<TRequest, TResponse>(TRequest request)
    {
        // Set default validation strategy back
        ValidateResponse = ValidateApiResponse;
        ValidateResponse += ValidateAtcomResponseFailOnWarnings;

        return await GetResponseContentAsyncInternal<TRequest, TResponse>(request);
    }

    public override async Task<TResponse> GetResponseContentAsyncIgnoreErrors<TRequest, TResponse>(TRequest request)
    {
        // Override default validation strategy 
        ValidateResponse = ValidateAtcomResponseIgnoreErrors;

        return await GetResponseContentAsyncInternal<TRequest, TResponse>(request);
    }

    public override async Task<TResponse> GetResponseContentAsyncCustomErrorHandling<TRequest, TResponse>(TRequest request)
    {
        // Override default validation strategy to our custom 
        ValidateResponse = request.ValidateResponse;

        return await GetResponseContentAsyncInternal<TRequest, TResponse>(request);
    }

    /// <inheritdoc />
    public override int DefaultTimeoutMilliSeconds()
    {
        return _atcomSettings.TimeoutMilliSeconds;
    }

    private async Task<TResponse> GetResponseContentAsyncInternal<TRequest, TResponse>(TRequest request)
        where TRequest : ApiRequest
        where TResponse : ApiResponse, new()
    {
        try
        {
            AddTradeAgentParams(request);
            var response = await base.GetResponseContentAsync<TRequest, TResponse>(request);

            return response;
        }
        catch (DeserializationException dex)
        {
            try
            {
                ErrorResponse errorResponse = (ErrorResponse)Activator.CreateInstance(typeof(ErrorResponse));
                errorResponse.DeserializePayload(dex.ResponseData);

                ValidateResponse(errorResponse);

                // Just in case ErrorResponse has no ERROR codes!
                throw new ErrorResponseException(errorResponse, dex.Message, null, dex);
            }
            catch (ErrorResponseException exr)
            {
                throw exr;
            }
            catch (Exception ex)
            {
                throw new ErrorResponseException(null, dex.Message, null, ex, dex.ResponseData);
            }
        }
    }

    /// <summary>
    /// Validate Atcom response
    /// Ignore all or specific errors (based on configuration) in the response from Atcom, otherwise throwing exception
    /// </summary>
    /// <typeparam name="TResponse"></typeparam>
    /// <param name="response"></param>
    /// <exception cref="ErrorResponseException"></exception>
    private void ValidateAtcomResponseIgnoreErrors<TResponse>(TResponse response) where TResponse : ApiResponse
    {
        // Ignore all errors in the response from Atcom
        if (_atcomSettings.IgnoreAllErrors)
        {
            return;
        }

        // Ignore specific errors in the response from Atcom, otherwise throwing exception
        if (response.HasErrors())
        {
            foreach (var error in response.ApiErrors)
            {
                if (!_atcomSettings.ErrorCodesToIgnore.Any(x => string.Equals(x, error.Code, StringComparison.InvariantCultureIgnoreCase)))
                {
                    throw new ErrorResponseException(response, "Response has errors", response.ApiErrors, null);
                }
            }
        }

        ValidateAtcomResponseFailOnWarnings(response);
    }

    /// <summary>
    /// Validate Atcom response
    /// Throw an exception when the response contains certain warnings
    /// </summary>
    /// <typeparam name="TResponse"></typeparam>
    /// <param name="response"></param>
    /// <exception cref="ErrorResponseException"></exception>
    private void ValidateAtcomResponseFailOnWarnings<TResponse>(TResponse response) where TResponse : ApiResponse
    {
        if (response.HasWarnings() &&
            !_atcomSettings.WarningCodesTreatedAsErrors.IsNullOrEmpty() &&
            response.ApiWarnings.Any(w => _atcomSettings.WarningCodesTreatedAsErrors.Any(e =>
            (e.Code == w.Code && e.Message == w.Message) || (e.Code == w.Code && string.IsNullOrEmpty(e.Message)))))
        {
            throw new ErrorResponseException(response, "Response has warnings", response.ApiWarnings, null);
        }
    }

    private void AddTradeAgentParams(ApiRequest request)
    {
        var agentCreds = _tradeAgentAuthService?.GetCurrentAgent();
        if (agentCreds != null)
        {
            request.AddQueryString(string.Format(_atcomSettings.EndpointTemplate.TradeAgentParam, agentCreds.Number));
        }
    }
}