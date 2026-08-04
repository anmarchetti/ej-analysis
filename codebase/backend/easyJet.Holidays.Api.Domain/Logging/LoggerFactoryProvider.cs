using Microsoft.Extensions.Logging;

namespace easyJet.Holidays.Api.Domain.Logging;

/// <summary>
/// Application Logger factory. Should be used where DI doesn't work: e.g. static methods.
/// </summary>
public static class LoggerFactoryProvider
{
    /// <summary>
    /// LoggerFactory provider instance
    /// </summary>
    public static ILoggerFactory LoggerFactory { get; set; }

    /// <summary>
    /// Creates logger for specified type. If Logger factory is not registered creates new one
    /// </summary>
    /// <typeparam name="T">Class type</typeparam>
    /// <returns>Logger instance</returns>
    public static ILogger<T> CreateLogger<T>()
    {
        try
        {
            return (LoggerFactory ??= new LoggerFactory()).CreateLogger<T>();
        }
        catch (ObjectDisposedException)
        {
            var freshFactory = new LoggerFactory();

            LoggerFactory = freshFactory;

            return freshFactory.CreateLogger<T>();
        }
    }

}