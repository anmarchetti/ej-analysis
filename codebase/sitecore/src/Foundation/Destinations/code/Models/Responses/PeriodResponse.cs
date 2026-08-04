using System;

namespace easyJet.Foundation.Destinations.Models.Responses
{
    public class PeriodResponse
    {
        public PeriodResponse(DateTime startDate, DateTime endDate)
        {
            StartDate = ToIsoDateString(startDate);
            EndDate = ToIsoDateString(endDate);
        }

        public string StartDate { get; }

        public string EndDate { get; }

        private string ToIsoDateString(DateTime date)
        {
            return date.ToString("o");
        }
    }
}