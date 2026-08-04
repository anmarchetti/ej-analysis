using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using easyJet.Holidays.External.Atcom.Utils;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Atcom.Mappers.Search.Filters
{
    /// <summary>
    /// Board type filter
    /// </summary>
    public class BoardTypeFilter : IFilter
    {
        private readonly IReferenceDataService _referenceDataService;

        public BoardTypeFilter(IReferenceDataService referenceDataService)
        {
            _referenceDataService = referenceDataService;
        }

        /// <summary>
        /// Filter data set by board types with OR condition
        /// Takes into account Unit Board and AltBoard of accommodation
        /// </summary>
        /// <param name="originalSet">IEnumerable of offers</param>
        /// <param name="request">search request</param>
        /// <returns></returns>
        public async Task<List<AvCacheResultOffersOfferExtended>> FilterBy(List<AvCacheResultOffersOfferExtended> originalSet, PackagesSearchRequest request)
        {
            var boardTypes = BoardUtils.ParseBoardTypes(request);

            if (!boardTypes.Any())
            {
                return originalSet;
            }

            var filteredOffers = originalSet
                .Where(offer => offer.AllBoards.IntersectBy(boardTypes, board => board.Code).Any())
                .ToList();

            return filteredOffers;
        }

        /// <summary>
        /// Calculate filter options and all possible results for Board Type filter
        /// </summary>
        /// <param name="offers">Atcom search response</param>
        /// <param name="request">Search request</param>
        /// <param name="applyAllOtherFilters">Call back func</param>
        public async Task<FilterOptions> GetOptions(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request, ApplyAllFiltersFunc applyAllOtherFilters)
        {
            ArgumentNullException.ThrowIfNull(applyAllOtherFilters);

            var referenceDataBoards = await _referenceDataService.GetBoardTypes();

            if (offers.IsNullOrEmpty() || referenceDataBoards.IsNullOrEmpty())
            {
                return FilterOptions.Empty;
            }

            offers = await applyAllOtherFilters(offers, request);

            var resultDistinctBoards = offers.SelectMany(x => x.AllBoards.Select(y => y.Code)).Distinct();

            // only top level boards will be shown on UI (AI), no point in creating options for variations only (AI+, AI-)
            // since top level board will already count whoule group including children (AI, AI+, AI-) 
            var options = resultDistinctBoards.Select(x =>
            {
                if (referenceDataBoards.TryGetValue(x, out var board))
                {
                    // top level board
                    if (board.BoardGroup is null)
                    {
                        return new FilterOption
                        { 
                            Code = board.Code,
                            Name = board.Name,
                            TrackingId = board.TrackingId,
                            BoardGroup = board.BoardGroup
                        };
                    }
                    // child board
                    else
                    {
                        if (referenceDataBoards.TryGetValue(board.BoardGroup.Code, out var parentBoard))
                        {
                            return new FilterOption
                            {
                                Code = parentBoard!.Code,
                                Name = parentBoard.Name,
                                TrackingId = board.TrackingId,
                                BoardGroup = parentBoard.BoardGroup
                            };
                        }
                        else
                        {
                            return new();
                        }
                    }
                }
                else
                {
                    return new();
                }

            }).Where(o => !string.IsNullOrEmpty(o.Code)).GroupBy(o => o.Code).Select(grp => grp.First()).ToList();

            foreach (var option in options)
            {
                var boardTypes = new List<string> { option.Code };

                var children = referenceDataBoards
                    .Where(x => x.Value.BoardGroup?.Code == option.Code)
                    .Select(x => new FilterOption()
                    {
                        Code = x.Value?.Code,
                        Name = x.Value?.Name,
                        TrackingId = x.Value?.TrackingId,
                    })
                    .ToList();
                boardTypes.AddRange(children.Select(x => x.Code));

                option.Children = children;
                option.Count = offers.Count(x => DoesOfferMatchBoardAndPrice(x, boardTypes, request));
            }

            // no point in returning groups that don't have options, they'll be disabled on UI anyway
            options = options.Where(x => x.Count != 0).ToList();
            return new FilterOptions
            {
                Options = options
            };
        }

        private static bool DoesOfferMatchBoardAndPrice(AvCacheResultOffersOfferExtended offer, IEnumerable<string> boards, PackagesSearchRequest request)
        {
            if (offer is null)
                return false;

            var matchingBoards = offer.AllBoards.Where(x => boards.Contains(x.Code)).ToList();

            if (matchingBoards.Count == 0)
                return false;

            //SetCheapestBoardFromSelected in SearchAvailablePackagesFilterAndMapper will select the cheapest board
            //among applicable so we have to check against the cheapest one
            var cheapestBoard = matchingBoards.OrderBy(x => x.Price).First();
            var guestsCount = request.TotalGuests();

            var initialMaxPriceTo = request.InitialPricePPTo.HasValue ? request.InitialPricePPTo.Value * guestsCount: decimal.MaxValue;

            var cheapestBoardExceedsMaxPriceTo = cheapestBoard.Price > initialMaxPriceTo;
            if (cheapestBoardExceedsMaxPriceTo)
            {
                return false;
            }

            var isPriceFilterApplied = request.PriceFrom != 0 || request.PriceTo != 0;
            if (!isPriceFilterApplied)
                return true;

            var priceFrom = request.IsPricePP ? request.PriceFrom * guestsCount : request.PriceFrom;
            var priceTo = request.IsPricePP ? request.PriceTo * guestsCount : request.PriceTo;
            priceTo = request.PriceTo <= 0 ? decimal.MaxValue : priceTo;

            var cheapestBoardMatchesPriceFilter = cheapestBoard.Price >= priceFrom && cheapestBoard.Price <= priceTo;
            return cheapestBoardMatchesPriceFilter;
        }
    }
}
