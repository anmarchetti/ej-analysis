namespace easyJet.Holidays.Api.Domain.Monitoring
{
    /// <summary>
    /// Defines the contract for a service that handles metrics registration and manipulation.
    /// </summary>
    public interface IMetricsService
    {
        /// <summary>
        /// Registers a counter metric with the specified name and description.
        /// </summary>
        /// <param name="name">The name of the counter metric.</param>
        /// <param name="description">A description of the counter metric.</param>
        void RegisterCounter(string name, string description);

        /// <summary>
        /// Registers a gauge metric that dynamically returns its value via the specified value provider.
        /// </summary>
        /// <param name="name">The name of the gauge metric.</param>
        /// <param name="valueProvider">A function that provides the current value of the gauge metric.</param>
        /// <param name="description">A description of the gauge metric.</param>
        void RegisterGauge(string name, Func<int> valueProvider, string description);

        /// <summary>
        /// Increments a counter metric by the specified value and optional labels.
        /// </summary>
        /// <param name="name">The name of the counter metric to increment.</param>
        /// <param name="value">The value to increment the counter by.</param>
        /// <param name="labels">Optional labels to associate with the counter increment.</param>
        void IncrementCounter(string name, long value, params KeyValuePair<string, object>[] labels);

        /// <summary>
        /// Registers a histogram metric with the specified name and description.
        /// </summary>
        /// <param name="name">The name of the histogram metric.</param>
        /// <param name="description">A description of the histogram metric.</param>
        void RegisterHistogram(string name, string description);

        /// <summary>
        /// Records a value in the specified histogram metric with optional labels.
        /// </summary>
        /// <param name="name">The name of the histogram metric to record.</param>
        /// <param name="value">The value to record.</param>
        /// <param name="labels">Optional labels to associate with the histogram record.</param>
        void ObserveHistogram(string name, double value, params KeyValuePair<string, object>[] labels);
    }
}