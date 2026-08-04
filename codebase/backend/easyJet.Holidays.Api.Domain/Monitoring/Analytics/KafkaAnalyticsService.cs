using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Confluent.Kafka;
using Microsoft.Extensions.Logging;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.Api.Domain.Monitoring.Analytics
{
    /// <summary>
    /// Service for sending analytics events to Kafka
    /// </summary>
    [ExcludeFromCodeCoverage]
    public class KafkaAnalyticsService : IKafkaAnalyticsService, IDisposable
    {
        private readonly KafkaAnalyticsSettings _settings;
        private readonly ILogger<KafkaAnalyticsService> _logger;
        private readonly Lazy<IProducer<Null, string>> _lazyProducer;
        private bool _disposed;

        /// <summary>
        /// Creates a new instance of the Kafka analytics service
        /// </summary>
        public KafkaAnalyticsService(IOptions<KafkaAnalyticsSettings> settings, ILogger<KafkaAnalyticsService> logger)
        {
            ArgumentNullException.ThrowIfNull(settings);
            ArgumentNullException.ThrowIfNull(logger);
            
            _settings = settings.Value;
            _logger = logger;
            _lazyProducer = new Lazy<IProducer<Null, string>>(CreateProducer);
        }

        /// <summary>
        /// Sends an event to Kafka for ElasticSearch
        /// </summary>
        /// <typeparam name="T">Type of the event</typeparam>
        /// <param name="analyticsEvent">The event to send</param>
        /// <returns>Task that completes when the event is sent</returns>
        public async Task SendEventAsync<T>(T analyticsEvent) where T : class
        {
            ObjectDisposedException.ThrowIf(_disposed, this);

            if (!_settings.Enabled)
            {
                _logger.LogTrace("Kafka integration is disabled, skipping event send");
                return;
            }

            try
            {
                using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(_settings.Timeout));

                string serializedEvent = JsonConvert.SerializeObject(analyticsEvent);

                await _lazyProducer.Value.ProduceAsync(_settings.AnalyticsTopic,
                    new Message<Null, string> { Value = serializedEvent },
                    timeoutCts.Token);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send event to Kafka");
            }
        }

        private IProducer<Null, string> CreateProducer()
        {
            ProducerConfig config = new()
            {
                BootstrapServers = _settings.KafkaServers,
                ClientId = _settings.ClientId,
                SecurityProtocol = _settings.SecurityProtocol,
                Acks = _settings.Acks
            };
            
            return new ProducerBuilder<Null, string>(config).Build();
        }

        /// <summary>
        /// Disposes the producer when the application shuts down
        /// </summary>
        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        /// <summary>
        /// Disposes managed and unmanaged resources
        /// </summary>
        /// <param name="disposing">True if disposing, false if finalizing</param>
        protected virtual void Dispose(bool disposing)
        {
            if (_disposed)
            {
                return;
            }
            
            // Dispose managed resources
            if (_lazyProducer.IsValueCreated)
            {
                _lazyProducer.Value.Dispose();
            }

            // Free unmanaged resources (none in this case)
            _disposed = true;
        }
    }
}