namespace easyJet.Holidays.Api.Domain.Services.Time;

/// <summary>
/// Provides data about DateTime
/// </summary>
public interface ITimeProvider
{
    /// <summary>
    /// Gets a DateTime object set to the current date and time on this computer, expressed as Coordinated Universal Time
    /// </summary>
    DateTime UtcNow { get; }


    /// <summary>  
    /// Gets the current timestamp as a long value.  
    /// </summary>  
    long GetTimestamp();
}
