using easyJet.Holidays.Api.Domain.Interfaces.Availability;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.HostedServices
{
    /// <summary>
    /// Background job to refresh flights schedule
    /// </summary>
    public class FlightsScheduleRefreshHostedService : IHostedService, IDisposable
    {
        private readonly ILogger<FlightsScheduleRefreshHostedService> _logger;
        private readonly CacheSettings _cacheSettings;
        private readonly IServiceProvider _provider;
        private Timer _timer;

        /// <summary>
        /// Creates instance of <see cref="FlightsScheduleRefreshHostedService"/>
        /// </summary>
        /// <param name="cacheSettings">Cache settings</param>
        /// <param name="serviceProvider">Services provider</param>
        /// <param name="logger">Logger</param>
        public FlightsScheduleRefreshHostedService(IOptions<CacheSettings> cacheSettings, IServiceProvider serviceProvider, ILogger<FlightsScheduleRefreshHostedService> logger)
        {
            _cacheSettings = cacheSettings.Value ?? throw new ArgumentNullException(nameof(cacheSettings));
            _provider = serviceProvider;
            _logger = logger;
        }

        /// <summary>
        /// Service entry point
        /// </summary>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns></returns>
        public Task StartAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Flights Schedule sync Background Service is starting");
            var periodSeconds = _cacheSettings.BackgroundJobSeconds.TypeAheadReferenceData;

            if (periodSeconds <= 0)
            {
                _logger.LogError("Flights Schedule sync Job period should be greater than zero: {PeriodSeconds}", periodSeconds);
            }

            var period = TimeSpan.FromSeconds(periodSeconds);
            _timer = new Timer(DoWork, null, TimeSpan.FromSeconds(0), period);

            return Task.CompletedTask;
        }

        private void DoWork(object state)
        {
            using (IServiceScope scope = _provider.CreateScope())
            {
                try
                {
                    var routeAvailabilityService = scope.ServiceProvider.GetRequiredService<IRouteAvailabilityService>();
                    _logger.LogInformation("Updating Flights Schedule");
                    routeAvailabilityService.RefreshCacheData();
                    _logger.LogInformation("Updated Flights Schedule");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Cannot update Flights Schedule");
                }
            }
        }

        /// <summary>
        /// Service stop callback
        /// </summary>
        /// <param name="cancellationToken">Token</param>
        /// <returns></returns>
        public Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Flights Schedule sync Background Service is stopping");
            _timer?.Change(Timeout.Infinite, 0);
            return Task.CompletedTask;
        }

        /// <summary>
        /// Disposes service timer
        /// </summary>
        public void Dispose()
        {
            _timer?.Dispose();
        }
    }
}
