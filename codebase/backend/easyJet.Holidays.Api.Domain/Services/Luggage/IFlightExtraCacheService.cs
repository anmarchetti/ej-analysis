using easyJet.Holidays.Api.Domain.Data.Booking.Extras;
using easyJet.Holidays.Api.Domain.Data.Luggage;

namespace easyJet.Holidays.Api.Domain.Services.Luggage;

/// <summary>
/// Cache-Aside (or Lazy Loading) service to cache FlightExtraCategoryList
/// </summary>
public interface IFlightExtraCacheService
{
    /// <summary>
    /// Gets cached flight extras, resets cache with extras from provided function
    /// </summary>
    public Task<IList<FlightExtraCategoryList>> GetFlightExtras(
        FlightId[] flights,
        Func<Task<IList<FlightExtraCategoryList>>> fetchFunction,
        bool forceFetch);
}