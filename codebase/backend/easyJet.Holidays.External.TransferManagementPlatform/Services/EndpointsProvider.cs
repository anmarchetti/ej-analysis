using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Models;
using easyJet.Holidays.External.Domain.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.TransferManagementPlatform.Services
{
    /// <summary>
    /// Available endpoints
    /// </summary>
    public enum TransferManagementEndpoint
    {
        /// <summary>
        /// Booking transfer details endpoint
        /// </summary>
        BookingTransferDetails
    }

    /// <summary>
    /// Endpoints provider: takes values from appsettings
    /// </summary>
    public class EndpointsProvider : BaseEndpointsProvider
    {
        /// <summary>
        /// Constructor. Initializes endpoints based on settings
        /// </summary>
        /// <param name="transferManagementSettings"></param>
        /// <param name="envBehaviorSettings"></param>
        /// <param name="cookiesService"></param>
        /// <param name="logger"></param>
        public EndpointsProvider(
            IOptions<TransferManagementPlatformSettings> transferManagementSettings,
            IOptions<EnvironmentBehaviourSettings> envBehaviorSettings,
            ICookiesService cookiesService,
            ILogger<EndpointsProvider> logger
            ) : base(envBehaviorSettings, cookiesService, logger)
        {
            ArgumentNullException.ThrowIfNull(transferManagementSettings);
            var transferManagementSettings1 = transferManagementSettings.Value;

            // Setup endpoints
            UriContainer[(int)TransferManagementEndpoint.BookingTransferDetails] = new EndpointUri(transferManagementSettings1.Host, transferManagementSettings1.Api.BookingTransferDetails);
        }

        /// <summary>
        /// Get transfer management API endpoint. Uses mocked domain from cookies if it's allowed.
        /// </summary>
        /// <param name="type">Endpoint type</param>
        /// <param name="urlSegments"></param>
        /// <returns>Endpoint Uri</returns>
        public Uri GetEndpoint(TransferManagementEndpoint type, Dictionary<string, string>? urlSegments = null)
        {
            return GetEndpoint((int)type, null, urlSegments);
        }

        /// <inheritdoc/>
        protected override string GetMockedDomain(IRequestCookieCollection cookies)
        {
            return CookiesService.TransferManagementMockCookie(cookies);
        }
    }
}
