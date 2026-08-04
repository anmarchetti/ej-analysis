using easyJet.Holidays.Api.Domain.Data.AmendBooking.Dates;

namespace easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;

/// <summary>
/// Amend Date service.
/// </summary>
public interface IAmendDatesService
{
    /// <summary>
    /// Get available booking date.
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    Task<AmendDateInfoResponse> GetAvailableBookingDate(AmendDateInfoRequest request);

    /// <summary>
    /// Get dates change summary information.
    /// If we can not find fully matched offer, we should return the cheapest for selected Accom, roomComposition and duration.
    /// </summary>
    /// <param name="request"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    Task<AmendDatesOffer> GetAmendDatesSummary(AmendDatesSummaryRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Validate AmendDatesOffer request with InfoBookingModifyRequest
    /// </summary>
    /// <param name="requestOffers">Offers</param>
    /// <returns>Validate offers with calculated price</returns>
    Task<IEnumerable<AmendDatesOffer>> ValidateAmendDatesOffers(IEnumerable<AmendDatesOffer> requestOffers);
}