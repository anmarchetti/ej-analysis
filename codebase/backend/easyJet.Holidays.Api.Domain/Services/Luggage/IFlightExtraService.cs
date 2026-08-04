using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Extras;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.Api.Domain.Services.Luggage;

/// <summary>
/// Luggage flight extra information service.
/// </summary>
public interface IFlightExtraService
{
    /// <summary>
    /// Gets extras for accommodation offer.
    /// </summary>
    /// <param name="offer">Offer from Atcom cache.</param>
    /// <param name="guests">Persons from FE request.</param>
    /// <returns>List of FlightExtraCategoryList</returns>
    Task<IList<FlightExtraCategoryList>> GetFlightExtras(Offer offer, IEnumerable<Person> guests);


    /// <summary>
    /// Checks if we need to add extra flight information into Atcom request
    /// </summary>
    /// <param name="promotionCode">The promotion code of the current booking</param>
    /// <returns></returns>
    Task<bool> NeedToAddExtraFlightInformationIntoAtcomRequest(string promotionCode);
}