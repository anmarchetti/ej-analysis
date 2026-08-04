using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Serialization;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Text;

namespace easyJet.Holidays.Api.Domain.Services.HostedServices
{
    /// <summary>
    /// Background job to log memory status
    /// </summary>
    public class CacheMemoryStatusHostedService : IHostedService, IDisposable
    {
        private readonly ILogger<CacheMemoryStatusHostedService> _logger;
        private readonly CacheSettings _cacheSettings;
        private readonly IServiceProvider _provider;
        private Timer _timer;

        /// <summary>
        /// Creates instance of <see cref="CacheMemoryStatusHostedService"/>
        /// </summary>
        /// <param name="cacheSettings">Cache settings</param>
        /// <param name="serviceProvider">Services provider</param>
        /// <param name="logger">Logger</param>
        public CacheMemoryStatusHostedService(IOptions<CacheSettings> cacheSettings, IServiceProvider serviceProvider, ILogger<CacheMemoryStatusHostedService> logger)
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
            _logger.LogInformation("Cache memory status service is starting");
            var periodSeconds = _cacheSettings.BackgroundJobSeconds.CacheMemoryStatus;

            if (periodSeconds <= 0)
            {
                _logger.LogError("Job period should be greater than zero: {PeriodSeconds}", periodSeconds);
                return Task.CompletedTask;
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
                    var cacheService = scope.ServiceProvider.GetRequiredService<ICacheService>();
                    var serializationService = scope.ServiceProvider.GetRequiredService<ISerializationService>();

                    var status = cacheService.Status(false);
                    var statusString = Encoding.UTF8.GetString(serializationService.Serialize(status));

                    _logger.LogInformation("Cache memory status: {StatusString}", statusString);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Cannot get memory status");
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
            _logger.LogInformation("Cache memory status service is stopping");
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
