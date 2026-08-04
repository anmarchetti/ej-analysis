using Newtonsoft.Json;
using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;

namespace easyJet.Holidays.Api.Domain.Monitoring.Analytics;

/// <summary>
/// Fields object for ElasticSearch compatibility
/// </summary>
[ExcludeFromCodeCoverage]
public class Fields
{
    /// <summary>
    /// Application name
    /// </summary>
    [JsonProperty("app")]
    public string App { get; set; } = "easyjet-holidays";

    /// <summary>
    /// Log type
    /// </summary>
    [JsonProperty("logtype")]
    public string LogType { get; set; } = "analytics";
}

/// <summary>
/// Generic analytics event that can hold any type of data
/// </summary>
[ExcludeFromCodeCoverage]
public class AnalyticsEvent
{
    /// <summary>
    /// Fields for ElasticSearch compatibility
    /// </summary>
    [JsonProperty("fields", Order = 1)]
    public Fields Fields { get; set; } = new();

    /// <summary>
    /// Event fingerprint for deduplication
    /// </summary>
    [JsonProperty("fingerprint", Order = 2)]
    public string Fingerprint => GenerateSha256Hash(JsonConvert.SerializeObject(EventData) + CorrelationId);

    /// <summary>
    /// Timestamp when the event occurred
    /// </summary>
    [JsonProperty("event_timestamp", Order = 3)]
    public string Timestamp { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss", DateTimeFormatInfo.InvariantInfo);

    /// <summary>
    /// Type of event
    /// </summary>
    [JsonProperty("event_type", Order = 4)]
    public string EventType { get; set; }

    /// <summary>
    /// Correlation ID for tracking the request across services
    /// </summary>
    [JsonProperty("event_correlation_id", Order = 5)]
    public string CorrelationId { get; set; }

    /// <summary>
    /// Event data - contains all the custom properties for this event
    /// </summary>
    [JsonProperty("event_data", Order = 6)]
    public Dictionary<string, object> EventData { get;} = new();

    /// <summary>
    /// Generates a SHA-256 hash for the given input string
    /// </summary>
    /// <param name="input">The input string to hash</param>
    /// <returns>The hexadecimal representation of the hash</returns>
    private static string GenerateSha256Hash(string input)
    {
        var bytes = Encoding.UTF8.GetBytes(input);
        var hash = SHA256.HashData(bytes);
    
        // Convert the hash to a hexadecimal string using StringBuilder for better performance
        var sb = new StringBuilder(hash.Length * 2);
        foreach (byte b in hash)
        {
            // Use lowercase x for lowercase hexadecimal and format to ensure 2 digits
            sb.Append(b.ToString("x2", CultureInfo.InvariantCulture));
        }
    
        return sb.ToString();
    }
}

/// <summary>
/// Builder for creating analytics events
/// </summary>
[ExcludeFromCodeCoverage]
public class AnalyticsEventBuilder
{
    private readonly AnalyticsEvent _event = new();

    /// <summary>
    /// Creates a new analytics event builder
    /// </summary>
    public AnalyticsEventBuilder() { }

    /// <summary>
    /// Creates a new analytics event builder with the specified event type and correlation ID
    /// </summary>
    public AnalyticsEventBuilder(string eventType, string correlationId)
    {
        _event.EventType = eventType;
        _event.CorrelationId = correlationId;
    }

    /// <summary>
    /// Sets the event type
    /// </summary>
    public AnalyticsEventBuilder WithEventType(string eventType)
    {
        _event.EventType = eventType;
        return this;
    }

    /// <summary>
    /// Sets the correlation ID
    /// </summary>
    public AnalyticsEventBuilder WithCorrelationId(string correlationId)
    {
        _event.CorrelationId = correlationId;
        return this;
    }

    /// <summary>
    /// Sets the timestamp
    /// </summary>
    public AnalyticsEventBuilder WithTimestamp(DateTime timestamp)
    {
        _event.Timestamp = timestamp.ToString("yyyy-MM-dd HH:mm:ss", DateTimeFormatInfo.InvariantInfo);
        return this;
    }

    /// <summary>
    /// Adds a property to the event data
    /// </summary>
    public AnalyticsEventBuilder WithProperty(string key, object value)
    {
        if (value != null)
        {
            _event.EventData[key] = value;
        }
        return this;
    }

    /// <summary>
    /// Adds multiple properties to the event data
    /// </summary>
    public AnalyticsEventBuilder WithProperties(Dictionary<string, object> properties)
    {
        if (properties != null)
        {
            foreach (var property in properties)
            {
                if (property.Value != null)
                {
                    _event.EventData[property.Key] = property.Value;
                }
            }
        }
        return this;
    }

    /// <summary>
    /// Builds the analytics event
    /// </summary>
    public AnalyticsEvent Build()
    {
        return _event;
    }
}