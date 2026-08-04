using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Mappers.Booking;
using easyJet.Holidays.External.Atcom.Models.Booking;
using easyJet.Holidays.External.Atcom.Models.Internal;
using easyJet.Holidays.External.Atcom.Services;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Exceptions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.External.AWS.DatahubSync.Services;

/// <summary>
/// The AtcomService class provides functionalities to interact with the
/// Atcom API for managing booking data. This service implements the IAtcomService
/// interface and is designed to handle API communications, logging, and endpoint
/// management.
/// </summary>
[ExcludeFromCodeCoverage]
public class AtcomService : IAtcomService
{
    /// <summary>
    /// Provides an instance of <see cref="EndpointsProvider"/> used to retrieve
    /// endpoint URIs for different Atcom services based on environment configuration
    /// and request-specific data such as cookies.
    /// </summary>
    private readonly EndpointsProvider _endpointProvider;

    /// <summary>
    /// Represents the API service used for interacting with external API endpoints.
    /// This is designed to handle API requests and responses, including content retrieval and custom error handling.
    /// The service is utilized to facilitate communication with external systems by sending requests, receiving responses,
    /// and mapping the data between internal and external models.
    /// </summary>
    private readonly IApiService _apiService;

    /// <summary>
    /// Represents the settings for ATCOM integration used within the AtcomService.
    /// This configuration encapsulates various components such as API settings,
    /// endpoint templates, market-specific configurations, client information,
    /// error handling behavior, and additional parameters for ATCOM operations.
    /// </summary>
    private readonly AtcomSettings _atcomSettings;

    /// <summary>
    /// Provides access to the current HTTP context. This is used to retrieve details such as cookies, headers,
    /// and other context-sensitive information during the execution of requests within the AtcomService implementation.
    /// </summary>
    private readonly IHttpContextAccessor _httpContextAccessor;

    /// <summary>
    /// Logger instance for capturing and logging diagnostic information,
    /// errors, and operational details for the <see cref="AtcomService"/> class.
    /// </summary>
    private readonly ILogger<AtcomService> _logger;

    /// <summary>
    /// Provides methods to interact with the Atcom system,
    /// such as retrieving booking details by booking reference.
    /// </summary>
    public AtcomService(
        IApiService apiService,
        EndpointsProvider endpointProvider,
        IOptions<AtcomSettings> atcomSettings,
        IHttpContextAccessor httpContextAccessor,
        ILogger<AtcomService> logger)
    {
        _apiService = apiService;
        _endpointProvider = endpointProvider;
        _atcomSettings = atcomSettings?.Value ?? throw new ArgumentNullException(nameof(atcomSettings));
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    /// <summary>
    /// Retrieves booking details from the Atcom API based on the provided booking reference and version.
    /// </summary>
    /// <param name="bookingId">The booking reference used to identify the booking in the Atcom API.</param>
    /// <param name="version">The API version to use when querying the Atcom API.</param>
    /// <returns>An instance of <see cref="DisplayBookingResponse"/> containing the booking details returned by the Atcom API.</returns>
    /// <exception cref="ErrorResponseException">Thrown when there are errors reported by the Atcom API during the request.</exception>
    /// <exception cref="ApiRequestException">Thrown when the API request to the Atcom API fails due to connectivity or unexpected errors.</exception>
    public async Task<DisplayBookingResponse> GetBookingByBookingRef(string bookingId, string? version = null)
    {
        try
        {
            var cltInfo = BuildCltInfo();
            var request = RequestBookingMapper.MapDisplay(cltInfo, bookingId, version);
            request.Endpoint = _endpointProvider.GetEndpoint(AtcomEndpoint.Booking, _httpContextAccessor.HttpContext?.Request?.Cookies);
            var response = await _apiService.GetResponseContentAsyncIgnoreErrors<DisplayBookingRequest, DisplayBookingResponse>(
                request);

            return response;
        }
        catch (ErrorResponseException ex)
        {
            _logger.LogError(ex, 
                "Failed to get booking details from Atcom API for booking {BookingId} (version: {Version}). " +
                "Exception: {ExMessage}. API Errors: {Errors}", 
                bookingId, 
                version, 
                ex.Message, 
                ex.ApiErrors != null ? string.Join(", ", ex.ApiErrors.Select(x => x.Message)) : "None");

            throw new InvalidOperationException(
                $"Failed to retrieve booking details for booking {bookingId} (version: {version}) from Atcom API. " +
                $"API returned {ex.ApiErrors?.Length ?? 0} error(s).", ex);
        }
        catch (ApiRequestException ex)
        {
            _logger.LogError(ex, 
                "Request to Atcom API failed while retrieving booking details for booking {BookingId} (version: {Version}). " +
                "Error: {ExMessage}", 
                bookingId, 
                version, 
                ex.Message);

            throw new InvalidOperationException(
                $"API request failed while retrieving booking details for booking {bookingId} (version: {version}). " +
                $"Please check connectivity and API configuration.", ex);
        }

    }

    /// Builds and returns a CltInfo object populated with values from the Atcom settings.
    /// <return>
    /// A CltInfo object containing locale, term code, username, and channel information
    /// populated from the configured AtcomSettings.
    /// </return>
    private CltInfo BuildCltInfo()
    {
        var cltInfoSettings = _atcomSettings.CltInfo;
        var cltInfo = new CltInfo
        {
            Locale = cltInfoSettings.Locale,
            TermCode = cltInfoSettings.TermCode,
            User_Name = cltInfoSettings.AgentGroups[AtcomRequestGenerator.DefaultAgentGroup].UserNames["UK"],
            Chan = cltInfoSettings.Channel
        };

        return cltInfo;
    }
}