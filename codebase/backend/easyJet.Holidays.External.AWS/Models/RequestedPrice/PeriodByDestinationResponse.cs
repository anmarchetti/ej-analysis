namespace easyJet.Holidays.External.AWS.Models.RequestedPrice
{
    /// <summary>  
    /// Represents the response containing period information for a specific destination.  
    /// </summary>  
    public class PeriodByDestinationResponse
    {
        /// <summary>  
        /// Gets or sets the period response indicating the date of the run.  
        /// </summary>  
        public required PeriodResponse DateOfRun { get; set; }

        /// <summary>  
        /// Gets or sets the period response indicating the search date range.  
        /// </summary>  
        public required PeriodResponse SearchDateRange { get; set; }
    }
}
