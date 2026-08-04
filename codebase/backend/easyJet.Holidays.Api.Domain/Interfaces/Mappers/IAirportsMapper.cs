using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AlternativeFlights;
using System.Collections.ObjectModel;

namespace easyJet.Holidays.Api.Domain.Interfaces.Mappers;

/// <summary>
/// Contains utility methods for adding airport details 
/// </summary>
public interface IAirportsMapper
{
    /// <summary>
    /// Adds airport distance data
    /// </summary>
    /// <param name="offersResponse"></param>
    /// <param name="request"></param>
    /// <returns></returns>
    Task EnrichAirportDistance(SearchOffersResponse offersResponse, AlternativeFlightsSearchRequest request);
    /// <summary>
    /// Adds airport details data
    /// </summary>
    /// <param name="amendTransport"></param>
    /// <returns></returns>
    Task EnrichAirportDetails(AmendTransport amendTransport);
    /// <summary>
    /// Adds airport details data
    /// </summary>
    /// <param name="offers"></param>
    /// <returns></returns>
    Task EnrichAirportDetails(IReadOnlyCollection<Offer> offers);
    /// <summary>
    /// Adds airport details data
    /// </summary>
    /// <param name="routes"></param>
    /// <returns></returns>
    Task EnrichAirportsDetails(IReadOnlyCollection<Route> routes);
}