using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Web;

namespace easyJet.Foundation.PushNotifications.Utils
{
    public static class DateUtil
    {
        /// <summary>
        /// Try to parse iso date to DateTime.
        /// </summary>
        /// <param name="isoDate">ISO date.</param>
        /// <param name="result">Parsed datetime.</param>
        /// <returns><see langword="true""/> if isoDate was converted successfully; otherwise, <see langword="false"/>.</returns>
        public static bool TryParseIsoDateToDateTime(string isoDate, out DateTime result)
        {
            return DateTime.TryParseExact(isoDate, "yyyyMMdd'T'HHmmss'Z'", CultureInfo.InvariantCulture, DateTimeStyles.None, out result);
        }
    }
}