namespace easyJet.Holidays.Api.Domain.Extensions
{
    /// <summary>
    /// <see cref="DateTime"/> extensions.
    /// </summary>
    public static class DateTimeExtensions
    {
        private static readonly DateTime Jan1St1970 = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        /// <summary>
        /// Convert DateTime to JavaScript Epoc format: number of millisecond since 1 January 1970 00:00:00 UTC.
        /// </summary>
        /// <param name="date"></param>
        /// <returns></returns>
        public static long ToEpocMls(this DateTime date)
        {
            return Convert.ToInt64(date.Subtract(Jan1St1970).TotalMilliseconds);
        }

        /// <summary>
        /// Returns a Date to Iso8601 string (yyyy-MM-dd)
        /// </summary>
        /// <param name="date"></param>
        /// <returns></returns>
        public static string ToIso8601Date(this DateTime date)
        {
            return date.ToString("yyyy-MM-dd");
        }

        /// <summary>
        /// Returns a new DateTime instance set to 23:59:59 of the given DateTime
        /// </summary>
        /// <param name="instance">the DateTime instance providing the date component for the operation.</param>
        /// <returns>a new DateTime instance, with the time set to end of the day</returns>
        public static DateTime GetEndOfDay(this DateTime instance)
        {
            return new(instance.Year, instance.Month, instance.Day, 23, 59, 59, instance.Kind);
        }
    }

    /// <summary>
    /// DateTime shortcuts for Utc DateTimeKind
    /// </summary>
    public static class DateTimeUtc
    {
        /// <summary>
        /// Returns DateTime with specified year, month and day
        /// </summary>
        /// <param name="year"></param>
        /// <param name="month"></param>
        /// <param name="day"></param>
        /// <returns></returns>
        public static DateTime New(int year, int month, int day) => new(year, month, day, 0, 0, 0, DateTimeKind.Utc);
    }
}
