using System;
using Sitecore;

namespace easyJet.Foundation.SitecoreExtensions.Extensions
{
    public static class DateTimeExtensions
    {
        /// <summary>
        /// Converts a DateTime to ISO formatted date/time string.
        /// </summary>
        /// <param name="dateTime">Date time.</param>
        /// <returns>ISO formatted date/time string.</returns>
        public static string DateTimeToIsoDate(this DateTime? dateTime)
        {
            return dateTime != null ? DateUtil.ToIsoDate(dateTime.Value) : string.Empty;
        }
    }
}