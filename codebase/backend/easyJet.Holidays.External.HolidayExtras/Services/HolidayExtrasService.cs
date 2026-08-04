using easyJet.Holidays.Api.Domain.Data.AirportParking;
using easyJet.Holidays.Api.Domain.Interfaces.HolidaysExtras;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.HolidayExtras.Models;
using Microsoft.Extensions.Logging;

namespace easyJet.Holidays.External.HolidayExtras.Services
{
    /// <inheritdoc />
    public class HolidayExtrasService : IHolidayExtrasService
    {
        private readonly IApiService _apiService;
        private readonly HolidayExtrasSettings _settings;
        private readonly ILogger<HolidayExtrasService> _logger;

        /// <summary>
        /// Constructor.
        /// </summary>
        /// <param name="apiService">Service to communicate with the API.</param>
        /// <param name="settings">Settings necessary to connect to the API.</param>
        /// <param name="logger">Logger.</param>
        public HolidayExtrasService(IApiService apiService, HolidayExtrasSettings settings,
            ILogger<HolidayExtrasService> logger)
        {
            _apiService = apiService;
            _settings = settings;
            _logger = logger;
        }

        /// <inheritdoc />
        public async Task<HolidayExtrasProducts> GetHolidayExtrasProduct(string productCode)
        {
            Uri endpoint = new(_settings.BaseUrl, Path.Combine(_settings.ProductEndpoint, productCode, "lite.js"));
            HolidayExtrasProducts item = await GetHolidayExtrasProduct(new HolidayExtrasRequestWithKeyAndToken
            {
                Endpoint = endpoint, 
                Token = _settings.Token, 
                Key = _settings.Key
            });

            return item;
        }

        /// <inheritdoc />
        public Uri GetImagesBaseUrl()
        {
            return _settings.ImagesBaseUrl;
        }

        private async Task<HolidayExtrasProducts> GetHolidayExtrasProduct(HolidayExtrasRequestWithKeyAndToken request)
        {
            request.SetQueryString();
            _logger.LogTrace("HolidayExtras request: {Endpoint}", request.Endpoint);

            HolidayExtrasProductsResponse? responseContentAsync =
                await _apiService
                    .GetResponseContentAsync<HolidayExtrasRequestWithKeyAndToken, HolidayExtrasProductsResponse>(
                        request);

            return responseContentAsync?.Payload?.Body.HolidayExtrasProducts!;
        }
    }
}