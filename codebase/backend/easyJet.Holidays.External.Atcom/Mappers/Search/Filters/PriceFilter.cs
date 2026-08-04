using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.External.Atcom.Models.Extensions;

namespace easyJet.Holidays.External.Atcom.Mappers.Search.Filters
{
    /// <summary>
    /// Price filter
    /// </summary>
    public class PriceFilter : IFilter
    {
        /// <summary>
        /// Filter offers by price
        /// </summary>
        /// <param name="originalSet"></param>
        /// <param name="request"></param>
        /// <returns></returns>
        public async Task<List<AvCacheResultOffersOfferExtended>> FilterBy(List<AvCacheResultOffersOfferExtended> originalSet, PackagesSearchRequest request)
        {
            var priceTo = request.PriceTo <= 0 ? decimal.MaxValue : request.PriceTo;

            originalSet = originalSet.Where(offer =>
                request.IsPricePP
                ? offer.PricePP >= request.PriceFrom && offer.PricePP <= priceTo
                : offer.Price >= request.PriceFrom && offer.Price <= priceTo
            ).ToList();

            return originalSet;
        }

        /// <summary>
        /// calculate filter options and all possible results for Star Rating filter
        /// </summary>
        /// <param name="offers"></param>
        public async Task<FilterOptions> GetOptions(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request, ApplyAllFiltersFunc applyAllOtherFilters)
        {
            var options = await Task.FromResult(new List<FilterOption>());

            return new FilterOptions
            {
                Options = options
            };
        }
    }
}
