#nullable enable

using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Mappers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Extensions;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using easyJet.Holidays.External.Atcom.Services.Search;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Atcom.Utils;

/// <summary>
/// Service for all Atcom board manipulation
/// </summary>
public class BoardService : IBoardService
{
    private readonly string _dupicateBoardSuffix;

    /// <summary>
    /// 
    /// </summary>
    /// <param name="atcomSettings"></param>
    public BoardService(IOptions<AtcomSettings> atcomSettings)
    {
        ArgumentNullException.ThrowIfNull(atcomSettings);

        _dupicateBoardSuffix = atcomSettings.Value.DuplicationBoardSuffix;
    }


    /// <inheritdoc/>
    public AvCacheResultOffersOfferBoard? FirstOrDefaultAlternateBoard(IEnumerable<AvCacheResultOffersOfferBoard> alternateBoards, string requestBoardType)
    {
        ArgumentNullException.ThrowIfNull(alternateBoards);

        requestBoardType = GetBoardGroupOrCode(requestBoardType);

        return alternateBoards.FirstOrDefault(alternateBoard => GetBoardGroupOrCode(alternateBoard.Code) == requestBoardType);
    }

    /// <inheritdoc/>
    public decimal? GetBoardPrice(AvCacheResultOffersOffer offer, string board)
    {
        ArgumentNullException.ThrowIfNull(offer);

        board = GetBoardGroupOrCode(board);

        if (GetBoardGroupOrCode(offer.GetSelectedBoardCode()) == board)
        {
            return offer.Price;
        }

        return (FirstOrDefaultAlternateBoard(offer.AltBoard.EmptyIfNull(), board))?.Price;
    }

    /// <inheritdoc/>
    public bool HasRequestedBoardType(AvCacheResultOffersOffer offer, string boardType)
    {
        ArgumentNullException.ThrowIfNull(offer);

        var defaultUnitBoard = GetBoardGroupOrCode(offer.GetSelectedBoardCode());
        boardType = GetBoardGroupOrCode(boardType);

        return defaultUnitBoard == boardType || offer.AltBoard.EmptyIfNull().Any(board => GetBoardGroupOrCode(board.Code) == boardType);
    }

    /// <inheritdoc/>
    public bool AnyAlternateOffer(IEnumerable<AvCacheResultOffersOffer> offers, string boardType)
    {
        ArgumentNullException.ThrowIfNull(offers);

        boardType = GetBoardGroupOrCode(boardType);

        return offers.Any(offer =>
        {
            var boardToCompare = GetBoardGroupOrCode(offer.GetSelectedBoardCode());

            return boardToCompare != boardType;
        });
    }

    /// <inheritdoc/>
    public bool BoardCodesAreEqual(string lhs, string rhs)
    {
        if (lhs is null || rhs is null)
        {
            return false;
        }

        lhs = GetBoardGroupOrCode(lhs);
        rhs = GetBoardGroupOrCode(rhs);

        return lhs.Equals(rhs, StringComparison.Ordinal);
    }

    /// <inheritdoc/>
    public AvCacheResultOffersOfferBoard[] GetAllAlternativeBoards(
            IEnumerable<AvCacheResultOffersOffer> offers, string requestBoardType)
    {
        return offers.EmptyIfNull()
            .SelectMany(offer => offer.AltBoard.EmptyIfNull()
            .Where(board => GetBoardGroupOrCode(board.Code) != GetBoardGroupOrCode(requestBoardType))
            .Select(board =>
            {
                board.AccommodationId = offer.GetAccommodationId();
                board.PackageId = offer.GetPackageId();
                board.System = offer.GetSystem();
                board.IsExternal = offer.IsExternal();

                var unitCode = offer.GetUnitCode();

                if (string.IsNullOrEmpty(board.UnitCode) ||
                        OfferHotelMapper.IsExtRoomCode(board.UnitCode) &&
                        !OfferHotelMapper.IsExtRoomCode(unitCode))
                {
                    board.UnitCode = unitCode;
                }

                return board;
            }))
            .Concat(offers.Where(offer => GetBoardGroupOrCode(offer.GetSelectedBoardCode()) != GetBoardGroupOrCode(requestBoardType))
            .Select(offer =>
                new AvCacheResultOffersOfferBoard
                {
                    Code = offer.GetSelectedBoardCode(),
                    AccommodationId = offer.GetAccommodationId(),
                    PackageId = offer.GetPackageId(),
                    System = offer.GetSystem(),
                    IsExternal = offer.IsExternal(),
                    Price = offer.Price,
                    UnitCode = offer.GetUnitCode(),
                }
            ))
            .OrderBy(board => board.Price)
            .ToArray();
    }

    /// <inheritdoc/>
    public AltBoardType GetAlternateBoardByBoardCode(AltBoardType[] altBoardTypes, string rhs)
    {
        ArgumentNullException.ThrowIfNull(altBoardTypes);

        rhs = GetBoardGroupOrCode(rhs);

        return altBoardTypes.First(x => GetBoardGroupOrCode(x.Code) == rhs);
    }

    /// <inheritdoc/>
    public string GetBoardGroupOrCode(string board)
    {
        if (board is null)
        {
            return board!;
        }

        if (board.EndsWith(_dupicateBoardSuffix, StringComparison.Ordinal))
        {
            return board.RemovePostfix(_dupicateBoardSuffix);
        }
        return board;
    }

    /// <inheritdoc/>
    public bool AnyAlternateBoardsContainBoardCode(AvCacheResultOffersOfferBoard[] altBoards, string directOfferDefaultBoard)
    {
        if (altBoards.IsNullOrEmpty())
        {
            return false;
        }

        return altBoards.ToList().Exists(x => GetBoardGroupOrCode(x.Code) == GetBoardGroupOrCode(directOfferDefaultBoard));
    }

    /// <inheritdoc/>
    public AltBoardType[] DistinctAlternateBoards(AltBoardType[] alternativeBoards)
    {
        if (alternativeBoards.ToList().Exists(ab => ab.Code.EndsWith(_dupicateBoardSuffix, StringComparison.Ordinal)))
        {
            List<AltBoardType> result = new();

            var altBoardTypes = alternativeBoards
                .GroupBy(ab => GetBoardGroupOrCode(ab.Code));

            foreach (var altBoardType in altBoardTypes)
            {
                result.Add(altBoardType.OrderBy(ab => ab.Price).First());
            }

            return result.ToArray();
        }
        return alternativeBoards;
    }

    /// <inheritdoc/>
    public AvCacheResultOffersOffer SelectBoard(AvCacheResultOffersOffer offer, string boardCode)
    {
        ArgumentNullException.ThrowIfNull(offer);

        var board = offer.AltBoard.ToList().Find(x => GetBoardGroupOrCode(x.Code) == GetBoardGroupOrCode(boardCode));

        if (board is null)
            return offer;

        var guestsCount = offer.PricePP != 0 ? (offer.Price / offer.PricePP) : 1;
        var offerUnits = offer.Accom.SelectMany(x => x.Unit).ToList();

        var currentBoard = GetSelectedBoard(offer);

        //replace the current board with the cheapest
        offerUnits.ForEach(u =>
        {
            u.Board = board.Code;
        });

        offer.Price = board.Price;
        offer.PricePP = board.Price / guestsCount;

        // finally replace the cheapest board with current board in the alternatives board list.
        // In order not to lose substituted current board from offer
        offer.AltBoard = offer.AltBoard.Select(x => GetBoardGroupOrCode(x.Code) == GetBoardGroupOrCode(board.Code) ? currentBoard : x).ToArray();

        return offer;
    }

    /// <inheritdoc/>
    public AvCacheResultOffersOfferBoard GetSelectedBoard(AvCacheResultOffersOffer offer)
    {
        ArgumentNullException.ThrowIfNull(offer);

        var unit = offer.Accom[0].Unit[0];
        var selectedBoard = CreateBoard(unit.Board, offer.Price, unit.Code, offer);
        return selectedBoard;
    }

    private static AvCacheResultOffersOfferBoard CreateBoard(string boardCode, decimal boardPrice, string unitCode, AvCacheResultOffersOffer offer)
    {
        var board = new AvCacheResultOffersOfferBoard()
        {
            Code = boardCode,
            Price = boardPrice,
            UnitCode = unitCode,
            AccommodationId = offer.GetAccommodationId(),
            IsExternal = offer.IsExternal(),
            PackageId = offer.GetPackageId(),
            System = offer.GetSystem(),
        };

        return board;
    }
}

/// <summary>
/// Compares boards, also compares board groups 
/// </summary>
public interface IBoardService
{
    /// <summary>
    /// Simple implementation of changing board that works for search, however it doesn't update unit price.
    /// Check <see cref="AccommodationOfferService.TryChangeOfferBoardType"/> for alternative implementation
    /// </summary>
    /// <param name="offer"></param>
    /// <param name="boardCode"></param>
    /// <returns></returns>
    AvCacheResultOffersOffer SelectBoard(AvCacheResultOffersOffer offer, string boardCode);

    /// <summary>
    /// Returns selected board
    /// </summary>
    /// <param name="offer"></param>
    /// <returns></returns>
    AvCacheResultOffersOfferBoard GetSelectedBoard(AvCacheResultOffersOffer offer);

    /// <summary>
    /// Returns BoardGroup or BoardCode 
    /// </summary>
    /// <param name="board"></param>
    /// <returns></returns>
    string GetBoardGroupOrCode(string board);

    /// <summary>
    /// Returns first item in a collection by same board type.
    /// </summary>
    /// <param name="alternateBoards">List of boards.</param>
    /// <param name="requestBoardType">Board to find.</param>
    /// <returns></returns>
    AvCacheResultOffersOfferBoard? FirstOrDefaultAlternateBoard(IEnumerable<AvCacheResultOffersOfferBoard> alternateBoards, string requestBoardType);

    /// <summary>
    /// 
    /// </summary>
    /// <param name="offers"></param>
    /// <param name="boardType"></param>
    /// <returns></returns>
    bool AnyAlternateOffer(IEnumerable<AvCacheResultOffersOffer> offers, string boardType);

    /// <summary>
    /// Compares two given boards, convert to board group where neccessary.
    /// </summary>
    /// <param name="lhs">Board to compare</param>
    /// <param name="rhs">Board to compare</param>
    /// <returns></returns>
    bool BoardCodesAreEqual(string lhs, string rhs);

    /// <summary>
    /// Compares two given boards, convert to board group where neccessary.
    /// </summary>
    /// <param name="altBoardTypes">Board to compare</param>
    /// <param name="rhs">Board to compare</param>
    /// <returns></returns>
    AltBoardType GetAlternateBoardByBoardCode(AltBoardType[] altBoardTypes, string rhs);

    /// <summary>
    /// Returns true if offer default unit or any alternate board is the same board as requested.
    /// </summary>
    /// <param name="offer"></param>
    /// <param name="boardType"></param>
    /// <returns></returns>
    bool HasRequestedBoardType(AvCacheResultOffersOffer offer, string boardType);

    /// <summary>
    /// Returns the price matching the given board
    /// </summary>
    /// <param name="offer"></param>
    /// <param name="board"></param>
    /// <returns></returns>
    decimal? GetBoardPrice(AvCacheResultOffersOffer offer, string board);

    /// <summary>
    /// Builds a list of alternative boards
    /// </summary>
    /// <param name="offers">Alternative offer response</param>
    /// <param name="requestBoardType">Requeted board type</param>
    /// <returns></returns>
    AvCacheResultOffersOfferBoard[] GetAllAlternativeBoards(IEnumerable<AvCacheResultOffersOffer> offers, string requestBoardType);

    /// <summary>
    /// Any matching dynamic alt board with direct offer
    /// </summary>
    /// <param name="altBoards"></param>
    /// <param name="directOfferDefaultBoard"></param>
    /// <returns></returns>
    bool AnyAlternateBoardsContainBoardCode(AvCacheResultOffersOfferBoard[] altBoards, string directOfferDefaultBoard);

    /// <summary>
    /// Returns distinct list of alternate boards
    /// </summary>
    /// <param name="alternativeBoards"></param>
    AltBoardType[] DistinctAlternateBoards(AltBoardType[] alternativeBoards);
}


