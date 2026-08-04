using System;
using System.Linq;
using Sitecore;
using Sitecore.Data.Fields;

namespace easyJet.Foundation.SitecoreExtensions.Extensions
{
    public static class FieldExtensions
    {
        public static bool ContainsJsonFile(this FileField file)
        {
            return file.ContainsFile(new string[2] { "text/json", "application/json" });
        }

        public static bool ContainsCsvFile(this FileField file)
        {
            return file.ContainsFile(new string[2] { "text/csv", "application/csv" });
        }

        public static bool ContainsFile(this FileField file, string[] types)
        {
            var mimeType = file?.MediaItem?.Fields?.FirstOrDefault(x => x.DisplayName.Equals("Mime Type", StringComparison.InvariantCultureIgnoreCase)).Value;

            if (mimeType == null)
            {
                return false;
            }

            foreach (var type in types)
            {
                if (mimeType.Equals(type, StringComparison.InvariantCultureIgnoreCase))
                {
                    return true;
                }
            }

            return false;
        }

        /// <summary>
        /// Parse iso date time field to server date time.
        /// </summary>
        /// <param name="dateField">Date time field.</param>
        /// <returns>Parsed date time.</returns>
        public static DateTime IsoTimeToServerDateTime(this DateField dateField)
        {
            return DateUtil.ToServerTime(dateField.DateTime);
        }

        /// <summary>
        /// Get iso date from datetime string.
        /// </summary>
        /// <param name="dateField">Date time field.</param>
        /// <returns>Iso date time as string.</returns>
        public static string GetIsoDate(this DateField dateField)
        {
            var date = dateField?.DateTime;
            return date.HasValue && date.Value != DateTime.MinValue ? DateUtil.ToServerTime(date.Value).ToString("o") : string.Empty;
        }

        /// <summary>
        /// Parse iso date time string to server date time.
        /// </summary>
        /// <param name="isoDateTime">Iso date time string.</param>
        /// <returns>Parsed date time.</returns>
        public static DateTime IsoTimeToServerDateTime(this string isoDateTime)
        {
            return DateUtil.ToServerTime(DateUtil.IsoDateToDateTime(isoDateTime));
        }
    }
}