using easyJet.Holidays.Api.Domain.Data.AmendBooking.Dates;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.Api.Domain.Interfaces.Offers;

public interface IAvailableDatesOfferSearchService
{
    /// <summary>
    /// Search available date for holiday.
    /// </summary>
    /// <param name="request" cref="AmendDateInfoRequest">Date info search request</param>
    /// <returns>Calendar with availability.</returns>
    Task<AmendDateInfoResponse> AvailableDates(AmendDateInfoRequest request);

    /// <summary>
    /// Search available offer for selected date.
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>

    Task<SearchOffersResponse> SearchFullMatchedOffer(AmendDatesSummaryRequest request, bool includeTransfer = true);

    /// <summary>
    /// Search available offer for selected date not fully matching everything.
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    Task<SearchOffersResponse> SearchNotFullyMatchedOffer(AmendDatesSummaryRequest request);

    /// <summary>
    /// Search the cheapest offer for selected accommodation, room composition and duration.
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    Task<SearchOffersResponse> SearchCheapestOffer(AmendDatesSummaryRequest request);
}