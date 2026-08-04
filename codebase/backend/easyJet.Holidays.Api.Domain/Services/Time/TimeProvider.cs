namespace easyJet.Holidays.Api.Domain.Services.Time;

/// <summary>
/// Wrapper class for DateTime
/// </summary>
public class TimeProvider : ITimeProvider
{
    /// <inheritdoc/>
    public DateTime UtcNow => DateTime.UtcNow;

    /// <inheritdoc/>
    public long GetTimestamp() => DateTimeOffset.UtcNow.ToUnixTimeSeconds();
}
