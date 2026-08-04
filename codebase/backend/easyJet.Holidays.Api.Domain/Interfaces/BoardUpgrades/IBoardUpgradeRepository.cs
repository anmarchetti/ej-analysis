using easyJet.Holidays.Api.Domain.Data.DynamoDB.BoardUpgrades;

namespace easyJet.Holidays.Api.Domain.Interfaces.BoardUpgrades;

/// <summary>
/// Interface for managing board upgrade repository operations.
/// </summary>
public interface IBoardUpgradeRepository
{
    /// <summary>
    /// Retrieves all items from the board upgrade table.
    /// </summary>
    /// <returns>A collection of <see cref="AccommodationBoardUpgrade"/>.</returns>
    Task<IEnumerable<AccommodationBoardUpgrade>> GetAll();

    /// <summary>
    /// Deletes all items from the board upgrade table.
    /// </summary>
    Task DeleteAll();

    /// <summary>
    /// Inserts items into the board upgrade table.
    /// </summary>
    /// <param name="accommodationBoardUpgrade">A collection of <see cref="AccommodationBoardUpgrade"/> to insert.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    Task Put(IEnumerable<AccommodationBoardUpgrade> accommodationBoardUpgrade);
}