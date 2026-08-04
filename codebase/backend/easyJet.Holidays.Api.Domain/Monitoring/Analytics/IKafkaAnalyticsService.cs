namespace easyJet.Holidays.Api.Domain.Monitoring.Analytics;

/// <summary>
/// Interface for sending analytics events to Kafka
/// </summary>
public interface IKafkaAnalyticsService
{
    /// <summary>
    /// Sends an event to Kafka for ElasticSearch
    /// </summary>
    /// <typeparam name="T">Type of the event</typeparam>
    /// <param name="analyticsEvent">The event to send</param>
    /// <returns>Task that completes when the event is sent</returns>
    Task SendEventAsync<T>(T analyticsEvent) where T : class;
}