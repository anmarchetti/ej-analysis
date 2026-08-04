using Confluent.Kafka;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.Api.Domain.Monitoring.Analytics;

/// <summary>
/// Configuration for Kafka analytics
/// </summary>
[ExcludeFromCodeCoverage]
public class KafkaAnalyticsSettings
{
    /// <summary>
    /// Kafka bootstrap servers
    /// </summary>
    public string KafkaServers { get; set; }

    /// <summary>
    /// Client ID for Kafka producer
    /// </summary>
    public string ClientId { get; set; } = "holidays-analytics-webapi";

    /// <summary>
    /// Security protocol for Kafka
    /// </summary>
    public SecurityProtocol SecurityProtocol { get; set; } = SecurityProtocol.Ssl;

    /// <summary>
    /// Acknowledgment settings for Kafka
    /// </summary>
    public Acks Acks { get; set; } = Acks.All;

    /// <summary>
    /// Topic for analytics events
    /// </summary>
    public string AnalyticsTopic { get; set; }
    
    /// <summary>
    /// Timeout for cancellation token analytics events
    /// </summary>
    public int Timeout { get; set; }

    /// <summary>
    /// Whether to enable Kafka integration
    /// </summary>
    public bool Enabled { get; set; }
}