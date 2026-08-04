namespace easyJet.Holidays.Api.Domain.Utils
{
    /// <summary>
    /// Provides sanitize methods to work with logger
    /// </summary>
    public static class LogSanitizer
    {
        /// <summary>
        /// Used to sanitize any user-controlled data from log message
        /// </summary>
        /// <param name="message"></param>
        /// <returns></returns>
        public static string SanitizeNewLines(string message)
        {
            return message?.Replace('\n', '_').Replace('\r', '_');
        }

        /// <summary>
        /// Used to sanitize any user-controlled data from log message
        /// </summary>
        /// <param name="message"></param>
        /// <returns></returns>
        public static object SanitizeNewLines(object message)
        {
            if (message is not string text)
                return message;

            return SanitizeNewLines(text);
        }
    }
}
