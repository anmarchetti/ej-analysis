using easyJet.Holidays.Api.Domain.Data.DynamoDB.BoardUpgrades;
using easyJet.Holidays.Api.Domain.Interfaces.BoardUpgrades;
using easyJet.Holidays.External.AWS.BoardUpgradeDataSync.Interfaces;
using easyJet.Holidays.External.AWS.BoardUpgradeDataSync.Settings;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.AWS.BoardUpgradeDataSync.Services;

/// <inheritdoc cref="IBoardUpgradeSyncingService"/>
public class BoardUpgradeSyncingService : IBoardUpgradeSyncingService
{
    private readonly IBoardUpgradeEskelAdapter _boardUpgradeAdapter;
    private readonly IBoardUpgradeRepository _boardUpgradeRepository;
    private readonly LambdaSettings _settings;

    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="boardUpgradeAdapter"></param>
    /// <param name="boardUpgradeRepository"></param>
    /// <param name="lambdaOptions"></param>
    public BoardUpgradeSyncingService(
        IBoardUpgradeEskelAdapter boardUpgradeAdapter, 
        IBoardUpgradeRepository boardUpgradeRepository, 
        IOptions<LambdaSettings> lambdaOptions)
    {
        _boardUpgradeAdapter = boardUpgradeAdapter;
        _boardUpgradeRepository = boardUpgradeRepository;

        ArgumentNullException.ThrowIfNull(lambdaOptions);
        _settings = lambdaOptions.Value;
    }


    /// <inheritdoc cref="IBoardUpgradeSyncingService"/>
    public async Task Sync()
    {
        //get board upgrade data from Eskel
        var boardUpgrades = (await _boardUpgradeAdapter.GetAll())?.ToList();

        if (boardUpgrades is null or [])
            throw new InvalidOperationException("Board upgrade data from Eskel is empty or null");

        //delete old data from dynamoDb table
        await _boardUpgradeRepository.DeleteAll();

        //Validate and filter data from Eskel system
        boardUpgrades = boardUpgrades.Where(promo => !string.IsNullOrWhiteSpace(promo.BoardFrom) &&
                                                     !string.IsNullOrWhiteSpace(promo.BoardTo) &&
                                                     promo.StartDate.HasValue && promo.EndDate.HasValue &&
                                                     !string.IsNullOrWhiteSpace(promo.AccommodationCode) &&
                                                     !string.IsNullOrWhiteSpace(promo.AccommodationName) &&
                                                     (promo.DiscountPercent.HasValue && promo.DiscountPercent.Value >= _settings.FilterDiscountPercentage)).ToList();

        //group by AccommodationCode
        var boardUpgradesByAtcomCodes = boardUpgrades.GroupBy(body => body?.AccommodationCode)
            .Where(group => !string.IsNullOrEmpty(group.Key))
            .Select(group => new AccommodationBoardUpgrade()
            {
                AccommodationCode = group.Key,
                AccommodationName = group.FirstOrDefault()?.AccommodationName,
                AvailableBoardUpgrades = group.Select(Map).ToList(),
            }).ToList();

        //save board upgrade data into dynamoDb
        if (boardUpgradesByAtcomCodes is not [])
        {
            await _boardUpgradeRepository.Put(boardUpgradesByAtcomCodes);
        }

    }

    private static BoardUpgrade Map(Models.BoardUpgradeModel boardUpgradeModelModel)
    {
        return new BoardUpgrade()
        {
            BoardFrom = boardUpgradeModelModel.BoardFrom,
            BoardTo = boardUpgradeModelModel.BoardTo,
            DiscountPercent = boardUpgradeModelModel.DiscountPercent,
            EndDate = boardUpgradeModelModel.EndDate,
            StartDate = boardUpgradeModelModel.StartDate,
            BookFromDate = boardUpgradeModelModel.BookFromDate,
            BookToDate = boardUpgradeModelModel.BookToDate,
        };
    }
}