using easyJet.Holidays.Api.Domain.Interfaces.Availability;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api
{
    public class StartupPreloader
    {
        private readonly IReferenceDataService _referenceDataService;
        private readonly IRouteAvailabilityService _routeAvailabilityService;
        private readonly ILogger<StartupPreloader> _logger;
        private readonly CmsSettings _cmsSettings;

        public StartupPreloader(IReferenceDataService referenceDataService, IRouteAvailabilityService routeAvailabilityService, IOptions<CmsSettings> cmsSettings, ILogger<StartupPreloader> logger)
        {
            _cmsSettings = cmsSettings.Value;
            _referenceDataService = referenceDataService;
            _routeAvailabilityService = routeAvailabilityService;
            _logger = logger;
        }

        /// <summary>
        /// Load reference data to make sure it's cached
        /// </summary>
        /// <returns></returns>
        public async Task PreloadReferenceData(IEnumerable<string> languages)
        {
            try
            {

                if (_cmsSettings.PreloadInitialDelaySeconds > 0)
                {
                    _logger.LogInformation("Preload data. Waiting for {Delay} seconds", _cmsSettings.PreloadInitialDelaySeconds);
                    // Initial data preload can depend on other services which require some time to warm up
                    await Task.Delay((int)TimeSpan.FromMilliseconds(_cmsSettings.PreloadInitialDelaySeconds).TotalMilliseconds);
                }

                await _referenceDataService.RefreshCacheData(languages);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Cannot preload reference data");
            }
        }

        /// <summary>
        /// Load flights schedule to make sure it's cached
        /// </summary>
        /// <returns></returns>
        public async Task PreloadFlightsSchedule()
        {
            try
            {
                await _routeAvailabilityService.RefreshCacheData();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Cannot preload Flights schedule");
            }
        }
    }
}
