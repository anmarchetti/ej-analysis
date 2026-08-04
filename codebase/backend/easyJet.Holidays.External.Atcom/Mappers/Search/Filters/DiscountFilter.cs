using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.External.Atcom.Models.Extensions;

namespace easyJet.Holidays.External.Atcom.Mappers.Search.Filters
{
    public class DiscountFilter : IFilter
    {
        private readonly IReferenceDataService _referenceDataService;

        public DiscountFilter(IReferenceDataService referenceDataService)
        {
            _referenceDataService = referenceDataService;
        }

        public async Task<List<AvCacheResultOffersOfferExtended>> FilterBy(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            DiscountSettings discountSettings = await _referenceDataService.GetDiscountSettings();

            var maxDiscount = request.MaxDisc > 0 ? request.MaxDisc : decimal.MaxValue;
            var minDiscount = request.MinDisc;
            var maxDiscountPercentage = request.MaxDiscP > 0 ? request.MaxDiscP : 100;
            var minDiscountPercentage = request.MinDiscP;
            var offersOnlyWithDiscount = request.DiscountOnly == true;
            var promoPage = request.IsPromo.GetValueOrDefault();

            return offers
                .Where(offer =>
                {
                    var showOffer = offersOnlyWithDiscount ? offer.Discount > 0 == true : true;

                    if (!showOffer)
                        return false;

                    var sumOfDiscounts = offer.Discount;
                    //if this is promo page and offersOnlyWithDiscount = true -> we should return only offers that have discount value bigger than DiscountThreshold
                    if (promoPage && offersOnlyWithDiscount && sumOfDiscounts <= discountSettings.DiscountThreshold)
                        return false;

                    var discountPercentage = offer.Price > 0 ? sumOfDiscounts / (offer.Price + sumOfDiscounts) * 100 : 0;
                    var discountUnderThreshold = sumOfDiscounts > 0 && sumOfDiscounts < discountSettings.DiscountThreshold;

                    //if discount of the package less then discountThreshold -> set values to 0 to hide discount pill on FE
                    if (discountUnderThreshold)
                    {
                        sumOfDiscounts = 0;
                        discountPercentage = 0;
                    }

                    return sumOfDiscounts >= minDiscount && sumOfDiscounts <= maxDiscount
                    && discountPercentage >= minDiscountPercentage && discountPercentage <= maxDiscountPercentage;
                })
                .ToList();
        }

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
