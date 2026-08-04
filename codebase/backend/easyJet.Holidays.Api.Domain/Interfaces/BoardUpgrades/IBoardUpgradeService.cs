using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants;

namespace easyJet.Holidays.Api.Domain.Interfaces.BoardUpgrades;

/// <summary>
/// Interface for managing board upgrade services.
/// </summary>
public interface IBoardUpgradeService
{
    /// <summary>
    /// Enriches offer models with board upgrade information.
    /// </summary>
    /// <param name="offers">A collection of <see cref="Offer"/> to enrich.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    Task EnrichAccommodationWithBoardUpgradeInfo(IEnumerable<Offer> offers);

    /// <summary>
    /// Enriches a specific accommodation with board upgrade information.
    /// </summary>
    /// <param name="accommodationId">The ID of the accommodation.</param>
    /// <param name="startDate">The start date of the accommodation.</param>
    /// <param name="duration">A list of durations for the accommodation.</param>
    /// <param name="boardType">The requested board type.</param>
    /// <param name="result">The search response containing room variants.</param>
    Task EnrichAccommodationWithBoardUpgradeInfo(string accommodationId, string startDate, IList<int> duration, string boardType, RoomVariantsSearchResponse result);
}