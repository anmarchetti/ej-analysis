using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.HostedServices
{
    /// <summary>
    /// Background job to refresh reference data
    /// </summary>
    public class ReferenceDataRefreshHostedService : IHostedService, IDisposable
    {
        private readonly ILogger<ReferenceDataRefreshHostedService> _logger;
        private readonly CacheSettings _cacheSettings;
        private readonly IServiceProvider _provider;
        private readonly LanguageSettings _languageSettings;
        private readonly Random _randomNumberGenerator = new();
        private Timer _timer;

        /// <summary>
        /// Creates instance of <see cref="ReferenceDataRefreshHostedService"/>
        /// </summary>
        /// <param name="cacheSettings">Cache settings</param>
        /// <param name="serviceProvider">Services provider</param>
        /// <param name="logger">Logger</param>
        /// <param name="languageSettings">Language settings</param>
        public ReferenceDataRefreshHostedService(
            IOptions<CacheSettings> cacheSettings,
            IServiceProvider serviceProvider,
            ILogger<ReferenceDataRefreshHostedService> logger,
            IOptions<LanguageSettings> languageSettings)
        {
            _cacheSettings = cacheSettings.Value ?? throw new ArgumentNullException(nameof(cacheSettings));
            _languageSettings = languageSettings.Value ?? throw new ArgumentNullException(nameof(languageSettings));
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
            if (_cacheSettings.BackgroundRefreshDisabled)
            {
                _logger.LogWarning("Reference data Background Service is disabled by configuration");
            }
            else
            {
                _logger.LogInformation("Reference data Background Service is starting.");
                var periodSeconds = _cacheSettings.BackgroundJobSeconds.CMSReferenceData;

                var tenPercentOfPeriodSeconds = periodSeconds > 0 ? periodSeconds / 10 : 0;
                periodSeconds += _randomNumberGenerator.Next(-tenPercentOfPeriodSeconds, tenPercentOfPeriodSeconds);

                var period = TimeSpan.FromSeconds(periodSeconds);
                _timer = new Timer(DoWork, null, TimeSpan.FromSeconds(0), period);
            }

            return Task.CompletedTask;
        }

        private void DoWork(object state)
        {
            using (IServiceScope scope = _provider.CreateScope())
            {
                var referenceDataService = scope.ServiceProvider.GetRequiredService<IReferenceDataService>();
                _logger.LogInformation("Updating reference data.");
                referenceDataService.RefreshCacheData(_languageSettings.AllLanguages);
                _logger.LogInformation("Updated reference data.");
            }
        }

        /// <summary>
        /// Service stop callback
        /// </summary>
        /// <param name="cancellationToken">Token</param>
        /// <returns></returns>
        public Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Reference data Background Service is stopping.");
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
