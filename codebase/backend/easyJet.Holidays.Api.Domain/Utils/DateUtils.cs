using easyJet.Holidays.Api.Domain.Data.Common;

namespace easyJet.Holidays.Api.Domain.Utils
{
    public static class DateUtils
    {
        /// <summary>
        /// Get collection of months number from collection of dates.
        /// </summary>
        /// <param name="dates">Collection of dates.</param>
        /// <returns>Collection of months.</returns>
        public static HashSet<int> GetMonths(IEnumerable<DateTimeRange> dates)
        {
            var months = new HashSet<int>();
            if (dates == null)
            {
                return months;
            }

            foreach (var date in dates)
            {
                DateTime current = date.From;
                while (current <= date.To)
                {
                    months.Add(current.Month);
                    current = current.AddMonths(1);
                }
            }

            return months;
        }

        /// <summary>
        /// Get collection of months from date range.
        /// </summary>
        /// <param name="from">Start date.</param>
        /// <param name="to">End date.</param>
        /// <returns></returns>
        public static HashSet<int> GetMonths(DateTime? from, DateTime? to)
        {
            var months = new HashSet<int>();
            if (!from.HasValue && !to.HasValue)
            {
                return months;
            }

            DateTime current = from.GetValueOrDefault();
            while (current <= to)
            {
                months.Add(current.Month);
                current = current.AddMonths(1);
            }

            return months;
        }
    }
}