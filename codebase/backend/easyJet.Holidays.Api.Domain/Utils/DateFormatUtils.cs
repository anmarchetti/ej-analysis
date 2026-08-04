using System.Globalization;

namespace easyJet.Holidays.Api.Domain.Utils
{
    public class DateFormatUtils
    {
        public const string DateOnlyFormat = "yyyy-MM-dd";
        public const string ISO8601Format = "yyyy-MM-ddTHH:mm:ss";
        public const string DateWithTimeFormat = "yyyy-MM-dd HHmm";
        public const string UtcFormat = "yyyy-MM-ddTHH:mm:sszzz";
        public const string DateOnlyFormatFrontend = "dd-MM-yyyy";
        public const string CookieFormat = "ddd, dd MMM yyyy HH':'mm':'ss 'GMT'";

        /// <summary>
        /// Format date to: yyy-MM-dd
        /// </summary>
        /// <param name="dt"></param>
        /// <returns></returns>
        public static string DateOnly(DateTime? dt)
        {
            return dt?.ToString(DateOnlyFormat);
        }

        /// <summary>
        /// Format date to: yyy-MM-dd
        /// </summary>
        /// <param name="dt"></param>
        /// <returns></returns>
        public static string DateOnly(DateTimeOffset? dt)
        {
            return dt?.DateTime.ToString(DateOnlyFormat);
        }

        /// <summary>
        /// Format date bu specific template
        /// </summary>
        /// <param name="dt">Date to stringify</param>
        /// <param name="template">Template to apply</param>
        /// <returns></returns>
        public static string DateOnly(DateTimeOffset? dt, string template)
        {
            return dt?.DateTime.ToString(template);
        }

        /// <summary>
        /// Format date to: yyyy-MM-ddTHH:mm:ss
        /// </summary>
        /// <param name="dt"></param>
        /// <returns></returns>
        public static string Iso8601(DateTime? dt)
        {
            return dt?.ToString(ISO8601Format);
        }

        /// <summary>
        /// Format date to: yyyy-MM-ddTHH:mm:ss
        /// </summary>
        /// <param name="dt"></param>
        /// <returns></returns>
        public static string Iso8601(DateTimeOffset? dt)
        {
            return dt?.ToString(ISO8601Format);
        }

        /// <summary>
        /// Format date to: yyyy-MM-ddTHH:mm:sszzz
        /// </summary>
        /// <param name="dt"></param>
        /// <returns></returns>
        public static string Utc(DateTime? dt)
        {
            return dt?.ToString(UtcFormat);
        }

        /// <summary>
        /// Parsing date to DateTimeOffset
        /// </summary>
        /// <param name="date"></param>
        /// <returns></returns>
        public static DateTimeOffset Parse(string date)
        {
            if (DateTimeOffset.TryParse(date, CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.AssumeUniversal, out var res))
            {
                return res;
            }

            return DateTimeOffset.MinValue;
        }

        /// <summary>
        /// Format date to: ddd, dd MMM yyyy HH':'mm':'ss 'GMT'
        /// </summary>
        /// <param name="dt"></param>
        /// <returns></returns>
        public static string CookieGMT(DateTime? dt)
        {
            return dt?.ToString(CookieFormat);
        }
    }
}