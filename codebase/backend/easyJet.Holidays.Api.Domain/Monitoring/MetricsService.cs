using System.Diagnostics.CodeAnalysis;
using System.Diagnostics.Metrics;

namespace easyJet.Holidays.Api.Domain.Monitoring
{
    /// <summary>
    /// Implements the <see cref="IMetricsService"/> interface for managing and registering metrics.
    /// </summary>
    [ExcludeFromCodeCoverage]
    public class MetricsService : IMetricsService
    {
        private readonly Meter _meter;
        private readonly Dictionary<string, Counter<long>> _counters;
        private readonly Dictionary<string, ObservableGauge<int>> _gauges;
        private readonly Dictionary<string, Histogram<double>> _histograms;


        /// <summary>
        /// Initializes a new instance of the <see cref="MetricsService"/> class.
        /// </summary>
        /// <param name="meterFactory">The factory used to create the <see cref="Meter"/> for metrics registration.</param>
        public MetricsService(IMeterFactory meterFactory)
        {
            _meter = meterFactory.Create(MetricConstants.OpenTelemetryMetrics);
            _counters = new Dictionary<string, Counter<long>>();
            _gauges = new Dictionary<string, ObservableGauge<int>>();
            _histograms = new Dictionary<string, Histogram<double>>();
        }

        /// <summary>
        /// Registers a counter metric with the specified name and description.
        /// </summary>
        /// <param name="name">The name of the counter metric.</param>
        /// <param name="description">A description of the counter metric.</param>
        public void RegisterCounter(string name, string description)
        {
            if (!_counters.ContainsKey(name))
            {
                _counters[name] = _meter.CreateCounter<long>(name, description: description);
            }
        }

        /// <summary>
        /// Registers a gauge metric with a dynamic value provider and description.
        /// </summary>
        /// <param name="name">The name of the gauge metric.</param>
        /// <param name="valueProvider">A function that provides the current value of the gauge metric.</param>
        /// <param name="description">A description of the gauge metric.</param>
        public void RegisterGauge(string name, Func<int> valueProvider, string description)
        {
            if (!_gauges.ContainsKey(name))
            {
                _gauges[name] = _meter.CreateObservableGauge(name, valueProvider, description: description);
            }
        }

        /// <summary>
        /// Increments a counter metric by the specified value and optional labels.
        /// </summary>
        /// <param name="name">The name of the counter metric to increment.</param>
        /// <param name="value">The value to increment the counter by.</param>
        /// <param name="labels">Optional labels to associate with the counter increment.</param>
        public void IncrementCounter(string name, long value, params KeyValuePair<string, object>[] labels)
        {
            if (_counters.TryGetValue(name, out var counter))
            {
                counter.Add(value, labels);
            }
        }

        /// <summary>
        /// Registers a histogram metric with the specified name and description.
        /// </summary>
        /// <param name="name">The name of the histogram metric.</param>
        /// <param name="description">A description of the histogram metric.</param>
        public void RegisterHistogram(string name, string description)
        {
            if (!_histograms.ContainsKey(name))
            {
                _histograms[name] = _meter.CreateHistogram<double>(name, description: description);
            }
        }

        /// <summary>
        /// Records a value in the specified histogram metric with optional labels.
        /// </summary>
        /// <param name="name">The name of the histogram metric to record.</param>
        /// <param name="value">The value to record.</param>
        /// <param name="labels">Optional labels to associate with the histogram record.</param>
        public void ObserveHistogram(string name, double value, params KeyValuePair<string, object>[] labels)
        {
            if (_histograms.TryGetValue(name, out var histogram))
            {
                histogram.Record(value, labels);
            }
        }
    }
}
