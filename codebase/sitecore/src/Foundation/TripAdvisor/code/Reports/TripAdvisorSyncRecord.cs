using CsvHelper.Configuration.Attributes;

namespace easyJet.Foundation.TripAdvisor.Reports
{
    public class TripAdvisorSyncRecord
    {
        [Name("Hotel Item Id")]
        public string HotelItemId { get; set; }

        [Name("Hotel Name")]
        public string HotelName { get; set; }

        [Name("TripAdvisor Id")]
        public string TripAdvisorId { get; set; }

        [Name("Error Code")]
        public string ErrorCode { get; set; }

        [Name("Error Type")]
        public string ErrorType { get; set; }

        [Name("Error Message")]
        public string ErrorMessage { get; set; }
    }
}
