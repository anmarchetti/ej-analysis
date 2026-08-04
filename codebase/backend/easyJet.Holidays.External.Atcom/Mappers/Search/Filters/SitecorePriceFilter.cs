using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.External.Atcom.Models.Extensions;

namespace easyJet.Holidays.External.Atcom.Mappers.Search.Filters
{
    /// <summary>
    /// Filter result based on sitecore values
    /// </summary>
    public class RequestedPriceFilter : IFilter
    {
        /// <summary>
        /// Filter offers by price
        /// </summary>
        /// <param name="originalSet"></param>
        /// <param name="request"></param>
        /// <returns></returns>
        public async Task<List<AvCacheResultOffersOfferExtended>> FilterBy(List<AvCacheResultOffersOfferExtended> originalSet, PackagesSearchRequest request)
        {
            if (request.InitialPricePPFrom == null && request.InitialPricePPTo == null && request.InitialTotalPriceFrom == null && request.InitialTotalPriceTo == null)
            {
                return originalSet;
            }

            var pricePPFrom = ValidateDecimalFrom(request.InitialPricePPFrom);
            var pricePPTo = ValidateDecimalTo(request.InitialPricePPTo);
            var priceTotalFrom = ValidateDecimalFrom(request.InitialTotalPriceFrom);
            var priceTotalTo = ValidateDecimalTo(request.InitialTotalPriceTo);

            originalSet = originalSet.Where(offer =>
                offer.PricePP >= pricePPFrom && offer.PricePP <= pricePPTo &&
                offer.Price >= priceTotalFrom && offer.Price <= priceTotalTo
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

        /// <summary>
        /// Validate nullable decimal value as a minimal value of range
        /// </summary>
        /// <param name="initValue"></param>
        /// <returns></returns>
        private static decimal ValidateDecimalFrom(decimal? initValue)
        {
            if (initValue == null || initValue <= 0)
                return 0;

            return initValue.Value;
        }

        /// <summary>
        /// Validate nullable decimal value as a maximum value of range
        /// </summary>
        /// <param name="initValue"></param>
        /// <returns></returns>
        private static decimal ValidateDecimalTo(decimal? initValue)
        {
            if (initValue == null || initValue <= 0)
                return decimal.MaxValue;

            return initValue.Value;
        }
    }
}
