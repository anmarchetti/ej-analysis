using Amazon.Lambda.Core;
using Microsoft.Extensions.Logging;
using LogLevel = Microsoft.Extensions.Logging.LogLevel;

namespace easyJet.Holidays.External.AWS.Logging
{
    //TODO: rename to LambdaLogger
    public class LambaLogger<T> : ILogger<T>
    {
        private readonly ILambdaLogger _innerLogger;

        public LambaLogger(ILambdaLogger innerLogger)
        {
            _innerLogger = innerLogger;
        }

        public IDisposable BeginScope<TState>(TState state)
        {
            throw new NotImplementedException();
        }

        public bool IsEnabled(LogLevel logLevel)
        {
            return true;
        }

        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception exception, Func<TState, Exception, string> formatter)
        {
            var levelPrefix = logLevel == LogLevel.Error ? "ERROR " : string.Empty;
            var error = exception != null ? $" {exception.Message} \n {exception.StackTrace}" : string.Empty;
            var msg = formatter(state, exception) + error;
            _innerLogger.LogLine($"{levelPrefix}{msg}");
        }
    }
}
