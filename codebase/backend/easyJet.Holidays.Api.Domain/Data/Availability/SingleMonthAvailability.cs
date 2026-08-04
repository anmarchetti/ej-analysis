namespace easyJet.Holidays.Api.Domain.Data.Availability;
/// <summary>  
/// Represents the availability status for a single month.  
/// </summary>  
/// <param name="Date">The date representing the month.</param>  
/// <param name="Availability">Indicates whether availability exists for the specified month.</param>  
public record SingleMonthAvailability(DateTime Date, bool Availability);
