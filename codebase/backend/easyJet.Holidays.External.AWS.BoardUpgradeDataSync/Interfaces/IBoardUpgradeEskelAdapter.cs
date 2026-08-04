using easyJet.Holidays.External.AWS.BoardUpgradeDataSync.Models;

namespace easyJet.Holidays.External.AWS.BoardUpgradeDataSync.Interfaces;


/// <summary>
/// Defines methods to interact with Eskel for retrieving board upgrade data.
/// </summary>
public interface IBoardUpgradeEskelAdapter
{
    /// <summary>
    /// Retrieves all board upgrade data.
    /// </summary>
    /// <returns>A task that represents the asynchronous operation. The task result contains a collection of <see cref="BoardUpgradeModel"/>.</returns>
    Task<IEnumerable<BoardUpgradeModel>> GetAll();
}