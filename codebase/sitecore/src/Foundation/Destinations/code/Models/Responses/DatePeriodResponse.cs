using easyJet.Foundation.Destinations.Models.Domain;

namespace easyJet.Foundation.Destinations.Models.Responses
{
    public class DatePeriodResponse
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="DatePeriodResponse"/> class.
        /// </summary>
        /// <param name="timePeriod">Time period object.</param>
        public DatePeriodResponse(TimePeriod timePeriod)
        {
            if (timePeriod == null)
            {
                return;
            }

            DateOfRun = new PeriodResponse(timePeriod.DateOfRunStartDate, timePeriod.DateOfRunEndDate);
            SearchDateRange = new PeriodResponse(timePeriod.SearchDateRangeStartDate, timePeriod.SearchDateRangeEndDate);
        }

        /// <summary>
        /// Gets date of run.
        /// </summary>
        public PeriodResponse DateOfRun { get; }

        /// <summary>
        /// Gets search date range.
        /// </summary>
        public PeriodResponse SearchDateRange { get; }
    }
}