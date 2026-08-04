using easyJet.Holidays.Api.Domain.Data.Hotels.Reviews;

namespace easyJet.Holidays.Api.Domain.Interfaces.Hotels;

/// <summary>
/// Trip Advisor Adaptor
/// </summary>
public interface ITripAdvisorAdaptor
{
    /// <summary>
    /// Get hotel reviews by TripAdvisor id
    /// </summary>
    /// <param name="id">TripAdvisor id</param>
    /// <param name="language">Current Language</param>
    /// <returns>Hotel reviews details</returns>
    Task<HotelReviews> GetReviews(string id, string language);
}
