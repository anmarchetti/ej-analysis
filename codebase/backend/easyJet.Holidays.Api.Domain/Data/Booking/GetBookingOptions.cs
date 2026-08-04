namespace easyJet.Holidays.Api.Domain.Data.Booking
{
    public class GetBookingOptions
    {
        /// <summary>
        /// Supplier ID which should be used to fetch booking
        /// </summary>
        public string SupplierId { get; set; }

        /// <summary>
        /// Whether allow bookings without accommodation details
        /// </summary>
        public bool AllowNoAccomm { get; set; }

        /// <summary>
        /// Whether remove agent to enable all market searches
        /// </summary>
        public bool? IsAgentRequired { get; set; }
        /// <summary>
        /// Whether to ignore all or specific errors in Atcom response
        /// see "IgnoreAllErrors" and "ErrorCodesToIgnore" settings in the appsettings
        /// </summary>
        public bool IgnoreAtcomErrors { get; set; }
        
        /// <summary>
        /// When true, ExtraLuggageInfo will be mapped even when it is an internal flight
        /// </summary>
        public bool MapRealExtraLuggageInfoForInternalFlightsWhenConfiguredInCms { get; set; }
    }
}
