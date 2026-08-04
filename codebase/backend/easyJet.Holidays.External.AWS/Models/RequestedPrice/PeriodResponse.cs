namespace easyJet.Holidays.External.AWS.Models.RequestedPrice;

/// <summary>
/// The period response.
/// </summary>
public class PeriodResponse
{
    /// <summary>  
    /// Gets or sets the start date of the period.  
    /// </summary>  
    public DateTime? StartDate { get; set; }

    /// <summary>  
    /// Gets or sets the end date of the period.  
    /// </summary>  
    public DateTime? EndDate { get; set; }
}
