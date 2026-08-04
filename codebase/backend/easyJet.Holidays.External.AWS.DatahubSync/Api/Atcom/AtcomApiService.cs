using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Models.Booking;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Exceptions;
using easyJet.Holidays.External.Domain.Extensions;
using easyJet.Holidays.External.Domain.Models.Api;
using Microsoft.Extensions.Options;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.External.AWS.DatahubSync.Api.Atcom;

/// <summary>
/// Service for interacting with the Atcom API. This class extends the functionality
/// of the base <see cref="ApiService"/> to handle Atcom-specific behavior, such as
/// response validation and default timeout configuration.
/// </summary>
[ExcludeFromCodeCoverage]
public class AtcomApiService : ApiService
{
    /// <summary>
    /// Holds configuration settings related to the Atcom API integration.
    /// These settings are encapsulated in the <see cref="AtcomSettings"/> class
    /// and are used throughout the <see cref="AtcomApiService"/> class to configure
    /// and manage interactions with the Atcom API.
    /// This includes settings like timeout duration, error handling behavior,
    /// and various API endpoints specific to the application's requirements.
    /// </summary>
    private readonly AtcomSettings _atcomSettings;

    /// Provides a specialized implementation of the <see cref="ApiService"/> for interacting with the Atcom API.
    /// This service leverages a SOAP-based <see cref="AtcomApiClient"/> for communication and is configured using <see cref="AtcomSettings"/>.
    public AtcomApiService(AtcomApiClient apiClient, IOptions<AtcomSettings> atcomSettings) : base(apiClient)
    {
        _atcomSettings = atcomSettings?.Value ?? throw new ArgumentNullException(nameof(atcomSettings));
    }

    /// <inheritdoc />
    public override string Name() => "Atcom API service.";

    /// <summary>
    /// Sends the specified request asynchronously and retrieves the response content while handling potential deserialization exceptions.
    /// </summary>
    /// <typeparam name="TRequest">The type of the request object.</typeparam>
    /// <typeparam name="TResponse">The type of the response object.</typeparam>
    /// <param name="request">The request object to be sent.</param>
    /// <returns>An asynchronous task that returns the deserialized response of type <typeparamref name="TResponse"/>.</returns>
    /// <exception cref="DeserializationException">Thrown when the response data cannot be deserialized correctly.</exception>
    /// <exception cref="ErrorResponseException">Thrown when an error response is encountered and validated or deserialization of an error message fails.</exception>
    public override async Task<TResponse> GetResponseContentAsync<TRequest, TResponse>(TRequest request)
    {
        try
        {
            var response = await base.GetResponseContentAsync<TRequest, TResponse>(request);

            return response;
        }
        catch (DeserializationException dex)
        {
            try
            {
                var errorResponse = (ErrorResponse)Activator.CreateInstance(typeof(ErrorResponse))!;
                errorResponse.DeserializePayload(dex.ResponseData);

                ValidateResponse(errorResponse);

                // just in case ErrorResponse has no ERROR codes
                throw new ErrorResponseException(errorResponse, dex.Message, null, dex);
            }
            catch (Exception ex)
            {
                // cant' parse error response
                if (!(ex is ErrorResponseException))
                {
                    throw new ErrorResponseException(null, dex.Message, null, ex, dex.ResponseData);
                }
                throw;
            }
        }
    }

    /// <summary>
    /// Asynchronously fetches the response content for a given request, bypassing any errors encountered during the process.
    /// The method overrides the default validation strategy with the Atcom-specific validation logic.
    /// </summary>
    /// <typeparam name="TRequest">The type of the request object.</typeparam>
    /// <typeparam name="TResponse">The type of the response object.</typeparam>
    /// <param name="request">The request object containing the necessary data for the operation.</param>
    /// <returns>A task representing the asynchronous operation. The task result contains the response object of type <typeparamref name="TResponse"/>.</returns>
    public override async Task<TResponse> GetResponseContentAsyncIgnoreErrors<TRequest, TResponse>(TRequest request)
    {
        //override default validation strategy 
        ValidateResponse = ValidateAtcomResponse;

        var response = await GetResponseContentAsync<TRequest, TResponse>(request);

        return response;
    }

    /// <inheritdoc />
    public override int DefaultTimeoutMilliSeconds()
    {
        return _atcomSettings.TimeoutMilliSeconds;
    }

    /// Validates the response received from the Atcom API, checking for errors and throwing exceptions if necessary.
    /// <typeparam name="TResponse">The type of the response being validated, which must inherit from <see cref="ApiResponse"/>.</typeparam>
    /// <param name="response">The response object that needs validation.</param>
    private void ValidateAtcomResponse<TResponse>(TResponse response) where TResponse : ApiResponse
    {
        //ignore all errors in the response from Atcom
        if (_atcomSettings.IgnoreAllErrors)
        {
            return;
        }

        //ignore specific errors in the response from Atcom, otherwise throwing exception
        if (response.HasErrors())
        {
            var errorsNotToIgnore = response.ApiErrors.Where(error => 
                !_atcomSettings.ErrorCodesToIgnore.Any(x => string.Equals(x, error.Code, StringComparison.OrdinalIgnoreCase)));
    
            if (errorsNotToIgnore.Any())
            {
                throw new ErrorResponseException(response, "Response has errors", response.ApiErrors, null);
            }
        }
    }
}