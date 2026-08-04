using System.Globalization;
using easyJet.Holidays.Api.Domain.Constants;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;

namespace easyJet.Holidays.External.Atcom.Mappers.Search.Filters
{
    public class OffersFilter : IFilter
    {
        private static readonly string MaxDiscountCode = "maxds";
        private static readonly string MinDiscountCode = "minds";

        private readonly IReferenceDataService _referenceDataService;

        public OffersFilter(IReferenceDataService referenceDataService)
        {
            _referenceDataService = referenceDataService;
        }

        /// <summary>
        /// Free for kids filter is applied to atcom request, only need to do discount filtering here
        /// </summary>
        public async Task<List<AvCacheResultOffersOfferExtended>> FilterBy(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            var discountSettings = await _referenceDataService.GetDiscountSettings();
            var filters = await _referenceDataService.GetOfferFilterOptions();

            var requestOffers = request.Offers?.Split(',').ToList() ?? null;

            if (requestOffers.IsNullOrEmpty())
            {
                return offers;
            }

            var applyMaxDiscountFilter = IsDiscountFilterEnabled(filters, MaxDiscountCode, out var maxDiscountFilter) && requestOffers!.Contains(MaxDiscountCode);
            var applyMinDiscountFilter = IsDiscountFilterEnabled(filters, MinDiscountCode, out var minDiscountFilter) && requestOffers!.Contains(MinDiscountCode);

            //apply discount threshold filter if any of discount filters are selected
            if (applyMaxDiscountFilter || applyMinDiscountFilter)
            {
                offers = offers.Where(x => x.Discount > discountSettings.DiscountThreshold).ToList();
            }

            if (applyMaxDiscountFilter && applyMinDiscountFilter)
            {
                var minDiscount = decimal.Parse(minDiscountFilter.Value, CultureInfo.InvariantCulture);
                var maxDiscount = decimal.Parse(maxDiscountFilter.Value, CultureInfo.InvariantCulture);
                offers = offers.Where(x => x.Discount > minDiscount || x.Discount <= maxDiscount).ToList();
            }
            else if (applyMinDiscountFilter)
            {
                var minDiscount = decimal.Parse(minDiscountFilter.Value, CultureInfo.InvariantCulture);
                offers = offers.Where(x => x.Discount > minDiscount).ToList();
            }
            else if (applyMaxDiscountFilter)
            {
                var maxDiscount = decimal.Parse(maxDiscountFilter.Value, CultureInfo.InvariantCulture);
                offers = offers.Where(x => x.Discount <= maxDiscount).ToList();
            }

            return offers;
        }

        public async Task<FilterOptions> GetOptions(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request, ApplyAllFiltersFunc applyAllOtherFilters)
        {
            ArgumentNullException.ThrowIfNull(applyAllOtherFilters);

            if (offers.IsNullOrEmpty())
            {
                return FilterOptions.Empty;
            }

            offers = await applyAllOtherFilters(offers, request);

            var options = new List<FilterOption>();
            var filters = await _referenceDataService.GetOfferFilterOptions();
            var discountSettings = await _referenceDataService.GetDiscountSettings();

            var freeForKidsFilter = filters.Filters?.FirstOrDefault(f => f.Code == OfferConstants.FreeForKidsFilter);
            if (freeForKidsFilter != default && freeForKidsFilter.Enabled)
            {
                options.Add(new FilterOption
                {
                    Code = freeForKidsFilter.Code,
                    Name = freeForKidsFilter.Name,
                    Count = offers
                        .Where(offer => offer != null)
                        .SelectMany(offer => offer.Accom)
                        .SelectMany(accom => accom.Unit ?? Array.Empty<AvCacheResultOffersOfferAccomUnit>())
                        .Count(unit => unit.DcSpecified && unit.Dc == YesNo.Y),
                    TrackingId = freeForKidsFilter.TrackingId
                });
            }

            if (IsDiscountFilterEnabled(filters, MinDiscountCode, out var minDiscountFilter))
            {
                var minDiscount = decimal.Parse(minDiscountFilter.Value, CultureInfo.InvariantCulture);
                var count = offers.Count(x => x.Discount > discountSettings.DiscountThreshold && x.Discount > minDiscount);

                options.Add(new FilterOption
                {
                    Code = minDiscountFilter.Code,
                    Name = minDiscountFilter.Name,
                    Count = count,
                    TrackingId = minDiscountFilter.TrackingId
                });
            }

            if (IsDiscountFilterEnabled(filters, MaxDiscountCode, out var maxDiscountFilter))
            {
                var maxDiscount = decimal.Parse(maxDiscountFilter.Value, CultureInfo.InvariantCulture);
                var count = offers.Count(x => x.Discount > discountSettings.DiscountThreshold && x.Discount <= maxDiscount);

                options.Add(new FilterOption
                {
                    Code = maxDiscountFilter.Code,
                    Name = maxDiscountFilter.Name,
                    Count = count,
                    TrackingId = maxDiscountFilter.TrackingId
                });
            }

            return new FilterOptions
            {
                Options = options
            };
        }

        private static bool IsDiscountFilterEnabled(OfferFilterOptions offerFilters, string filterCode, out OfferFilterOption filter)
        {
            filter = offerFilters.Filters?.FirstOrDefault(x => x.Code == filterCode);
            return filter is not null && filter.Enabled && decimal.TryParse(filter.Value, CultureInfo.InvariantCulture, out _);
        }

    }
}
