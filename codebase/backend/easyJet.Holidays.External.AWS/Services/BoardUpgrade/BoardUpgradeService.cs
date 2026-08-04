using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants;
using easyJet.Holidays.Api.Domain.Interfaces.BoardUpgrades;
using System.Globalization;
using System.Linq;

namespace easyJet.Holidays.External.AWS.Services.BoardUpgrade;

/// <inheritdoc />
public class BoardUpgradeService : IBoardUpgradeService
{
    private const int FreeBoardUpgrade = 100;
    private readonly IBoardUpgradeRepository _boardUpgradeRepository;

    /// <summary>
    /// Initializes a new instance of the <see cref="BoardUpgradeService"/> class.
    /// </summary>
    /// <param name="boardUpgradeRepository">The board upgrade repository.</param>
    public BoardUpgradeService(IBoardUpgradeRepository boardUpgradeRepository)
    {
        _boardUpgradeRepository = boardUpgradeRepository;
    }

    /// <inheritdoc/>
    public async Task EnrichAccommodationWithBoardUpgradeInfo(IEnumerable<Offer> offers)
    { 
        // HDP and SRP
        if (offers == null || !offers.Any())
        {
            return;
        }

        var tasks = offers.Select((offer) =>
            CalculateBoardUpgradeInfo(offer));

        await Task.WhenAll(tasks);
    }

    /// <inheritdoc/>
    public async Task EnrichAccommodationWithBoardUpgradeInfo(string accommodationId, string startDate, IList<int> duration, string boardType, RoomVariantsSearchResponse result)
    {
        // offers-alterations
        ArgumentNullException.ThrowIfNull(result);

        if (!DateTime.TryParse(startDate, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var bookFromDate))
        {
            return;
        }

        if (duration == null || duration.Count == 0)
        {
            return;
        }

        var stay = duration[0];
        var bookToDate = bookFromDate.AddDays(stay);

        var availableBoardUpgrades = await GetFilteredBoardUpgrades(
            accommodationId, 
            bookFromDate, 
            bookToDate, 
            [boardType]);

        if (availableBoardUpgrades == null)
        {
            return;
        }

        foreach (var altBoard in result.AltBoards)
        {
            var upgrade = availableBoardUpgrades.FirstOrDefault(abu => abu.BoardFrom == boardType && abu.BoardTo == altBoard.Code);

            if (upgrade == null) { continue; }

            altBoard.IsFreeBoardUpgrade = upgrade.DiscountPercent == FreeBoardUpgrade;
            altBoard.DiscountPercent = upgrade.DiscountPercent;
        }
    }

    private async Task CalculateBoardUpgradeInfo(Offer offer)
    {
        if (offer.Date == null || offer.Stay == null)
        {
            return;
        }

        var bookFromDate = offer.Date.Value;
        var bookToDate = bookFromDate.AddDays(offer.Stay.Value);
        var boards = offer.Accom.Unit.Select(x => x.BoardType.Code).ToList();

        var availableBoardUpgrades = await GetFilteredBoardUpgrades(
            offer.Accom.Code, 
            bookFromDate, 
            bookToDate, 
            boards);

        if (availableBoardUpgrades == null)
        {
            return;
        }

        offer.HasFreeBoardUpdate = availableBoardUpgrades.Any(abu => abu.DiscountPercent == FreeBoardUpgrade);
        offer.HasDiscountedBoardUpgrade = availableBoardUpgrades.Any(abu => abu.DiscountPercent != FreeBoardUpgrade);

        foreach (var unit in offer.Accom.Unit)
        {
            var upgrade = availableBoardUpgrades.FirstOrDefault(abu => abu.BoardTo == unit.Board);

            if(upgrade == null) { continue; }

            unit.IsFreeBoardUpgrade = upgrade.DiscountPercent == FreeBoardUpgrade;
            unit.BoardDiscountPercentage = upgrade.DiscountPercent;
        }
    }

    private async Task<IEnumerable<Api.Domain.Data.DynamoDB.BoardUpgrades.BoardUpgrade>> GetFilteredBoardUpgrades(
        string accommodationId,
        DateTime bookFromDate,
        DateTime bookToDate,
        IList<string> boards)
    {
        var allUpgrades = await _boardUpgradeRepository.GetAll();

        if (allUpgrades == null || !allUpgrades.Any())
        {
            return null;
        }

        var accommodationBoardUpgrade = allUpgrades.FirstOrDefault(x => x.AccommodationCode == accommodationId);

        if(accommodationBoardUpgrade?.AvailableBoardUpgrades == null || accommodationBoardUpgrade.AvailableBoardUpgrades.Count == 0)
        {
            return null;
        }

        var bookingDate = DateTime.UtcNow.Date;

        return accommodationBoardUpgrade.AvailableBoardUpgrades
            .Where(upgrade => upgrade.BookFromDate <= bookingDate && upgrade.BookToDate >= bookingDate)
            .Where(upgrade => upgrade.StartDate <= bookFromDate && upgrade.EndDate >= bookToDate)
            .Where(upgrade => boards.Contains(upgrade.BoardFrom) || boards.Contains(upgrade.BoardTo))
            .OrderByDescending(bu => bu.DiscountPercent);
    }
}