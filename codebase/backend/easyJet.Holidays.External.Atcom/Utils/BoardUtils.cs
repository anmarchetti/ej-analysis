#nullable enable

using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.External.Atcom.Extensions;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;

namespace easyJet.Holidays.External.Atcom.Utils;

public static class BoardUtils
{
    public static void MapAllBoards(AvCacheResultOffersOffer offer)
    {
        offer.AllBoards = GetAllBoards(offer).ToList();
    }

    public static Board[] GetAllBoards(AvCacheResultOffersOffer offer)
    {
        var accom = offer.Accom?.SingleOrDefault();

        if (accom is null || accom.Unit?.FirstOrDefault()?.Board is null)
        {
            return Array.Empty<Board>();
        }

        var offerBoard = new Board
        {
            Code = accom.Unit.First().Board.ToUpperInvariant(),
            Price = offer.Price,
        };

        var boards = new List<Board> { offerBoard };

        if (offer.AltBoard is not null && offer.AltBoard.Any())
        {
            var altBoards = offer.AltBoard.Select(x => new Board
            {
                Code = x.Code.ToUpperInvariant(),
                Price = x.Price,
            });
            boards.AddRange(altBoards);
        }

        return boards.ToArray();
    }

    /// <summary>
    /// Parse string with comma separated board codes
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    public static string[] ParseBoardTypes(PackagesSearchRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.BoardType))
        {
            return Array.Empty<string>();
        }

        var res = request.BoardType
                .ToUpperInvariant()
                .Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(bt => bt.Trim())
                .ToArray();
        return res;
    }

    public static void EnrichAltBoards(AvCacheResultOffersOffer offer)
    {
        if (offer.AltBoard.IsNullOrEmpty())
            return;

        foreach (var board in offer.AltBoard.EmptyIfNull())
        {
            board.AccommodationId = offer.GetAccommodationId();
            board.PackageId = offer.GetPackageId();
            board.System = offer.GetSystem();
            board.IsExternal = offer.IsExternal();
        }
    }
}
