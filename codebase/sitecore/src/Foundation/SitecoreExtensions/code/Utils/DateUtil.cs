using System;
using System.Globalization;

namespace easyJet.Foundation.SitecoreExtensions.Utils
{
    public static class DateUtil
    {
        /// <summary>
        /// Parse DateTime in dd/MM/yyyy format.
        /// </summary>
        /// <param name="date">Date string.</param>
        /// <param name="defaultDateTime">Default datetime.</param>
        /// <returns>Datetime.</returns>
        public static DateTime ParseDateTime(string date, DateTime defaultDateTime)
        {
            return DateTime.TryParseExact(date, "dd/MM/yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out var result) ? result : defaultDateTime;
        }

        /// <summary>
        /// Calculates difference between dates in string format.
        /// </summary>
        /// <param name="startDateString">Start date in string format.</param>
        /// <param name="endDateString">End date in string format.</param>
        /// <returns>Time Span.</returns>
        public static TimeSpan CalculateDifference(string startDateString, string endDateString)
        {
            var startDate = ParseDateTime(startDateString, DateTime.MinValue);
            var endDate = ParseDateTime(endDateString, DateTime.MaxValue);
            return endDate - startDate;
        }
    }
}