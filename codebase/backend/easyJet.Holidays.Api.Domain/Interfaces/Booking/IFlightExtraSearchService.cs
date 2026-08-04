using easyJet.Holidays.Api.Domain.Data.Booking.Extras;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.Api.Domain.Interfaces.Booking;

/// <summary>
/// Service for retrieving available flight extras such as bags, sports equipment, etc.
/// </summary>
public interface IFlightExtraSearchService
{
    /// <summary>
    /// Returns available flight extras for the flights from the <param name="offer">offer</param>
    /// </summary>
    /// <param name="guests">Guest collection.</param>
    /// <param name="isPostBooking">Indicates post booking flow.</param>
    /// <returns>Returns FlightExtraCatgoryList collection.</returns>
    public Task<IList<FlightExtraCategoryList>> GetFlightExtras(Offer offer, IEnumerable<Person> guests, bool isPostBooking);
}