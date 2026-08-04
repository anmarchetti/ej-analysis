namespace easyJet.Holidays.Api.Common.Exceptions
{
    /// <summary>
    /// External event exception
    /// </summary>
    public class LogEventException : Exception
    {
        public LogEventException(string message, string stackTrace)
             : base(message)
        {
            StackTrace = stackTrace;
        }

        public override string StackTrace { get; }

        public override string ToString()
        {
            return $"{nameof(LogEventException)}: {Message}{Environment.NewLine}{StackTrace}";
        }
    }
}
