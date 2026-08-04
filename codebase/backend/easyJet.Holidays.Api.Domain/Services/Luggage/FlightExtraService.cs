using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Extras;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.Luggage;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;

namespace easyJet.Holidays.Api.Domain.Services.Luggage;

/// <inheritdoc />
public class FlightExtraService : IFlightExtraService
{
    private readonly IFlightExtraSearchService _flightExtraSearch;
    private readonly IFlightExtraCacheService _flightExtraCache;
    private readonly IReferenceDataService _referenceDataService;

    /// <summary>
    /// DI constructor, initializes services.
    /// </summary>
    public FlightExtraService(
        IFlightExtraSearchService flightExtraSearch,
        IReferenceDataService referenceDataService,
        IFlightExtraCacheService flightExtraCache)
    {
        _flightExtraSearch = flightExtraSearch;
        _referenceDataService = referenceDataService;
        _flightExtraCache = flightExtraCache;
    }

    /// <inheritdoc />
    public async Task<IList<FlightExtraCategoryList>> GetFlightExtras(Offer offer, IEnumerable<Person> guests)
    {
        var flights = offer.Transport?.Routes?.Select(BuildFlightId).ToArray() ?? Array.Empty<FlightId>();

        if (flights.IsNullOrEmpty() || guests.IsNullOrEmpty())
            return Array.Empty<FlightExtraCategoryList>();

        return await _flightExtraCache.GetFlightExtras(flights, FetchFunction, false);

        Task<IList<FlightExtraCategoryList>> FetchFunction() => _flightExtraSearch.GetFlightExtras(offer, guests, false);

        FlightId BuildFlightId(Route route)
        {
            return new FlightId(
                route.RouteId,
                route.FlightNumberWithoutCar,
                route.DepPt,
                route.ArrPt,
                route.DepDate.Value.Date
            );
        }
    }

    /// <inheritdoc />
    public async Task<bool> NeedToAddExtraFlightInformationIntoAtcomRequest(string promotionCode)
    {
        var flightExtraInformationSettings = await _referenceDataService.GetFlightExtraInformationSettings(null);
        if (flightExtraInformationSettings == null)
            return false;

        if (string.IsNullOrEmpty(flightExtraInformationSettings.PromotionCodes))
            return false;

        return flightExtraInformationSettings.PromotionCodes.Contains(promotionCode, StringComparison.InvariantCultureIgnoreCase);
    }
}