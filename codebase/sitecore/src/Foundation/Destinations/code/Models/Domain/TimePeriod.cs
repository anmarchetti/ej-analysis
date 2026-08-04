using System;
using Sitecore;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class TimePeriod
    {
        private Item currentItem;

        public TimePeriod()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="TimePeriod"/> class.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        public TimePeriod(Item item)
        {
            currentItem = item;

            DateOfRunStartDate = ConvertToDate(Constants.Fields.PeriodByDestination.DateOfRunStartDate);
            DateOfRunEndDate = ConvertToDate(Constants.Fields.PeriodByDestination.DateOfRunEndDate);
            SearchDateRangeStartDate = ConvertToDate(Constants.Fields.PeriodByDestination.SearchDateRangeStartDate);
            SearchDateRangeEndDate = ConvertToDate(Constants.Fields.PeriodByDestination.SearchDateRangeEndDate);
        }

        /// <summary>
        /// Gets date of run start date.
        /// </summary>
        public DateTime DateOfRunStartDate { get; }

        /// <summary>
        /// Gets date of run end date.
        /// </summary>
        public DateTime DateOfRunEndDate { get; }

        /// <summary>
        /// Gets or Sets search date range start date.
        /// </summary>
        public DateTime SearchDateRangeStartDate { get; set; }

        /// <summary>
        /// Gets or Sets search date range end date.
        /// </summary>
        public DateTime SearchDateRangeEndDate { get; set; }

        /// <summary>
        /// Convert to date.
        /// </summary>
        /// <param name="fieldName">Field name.</param>
        /// <returns>Date time object.</returns>
        private DateTime ConvertToDate(string fieldName)
        {
            return DateUtil.ToServerTime(((DateField)currentItem?.Fields[fieldName])?.DateTime ?? DateTime.MinValue);
        }
    }
}