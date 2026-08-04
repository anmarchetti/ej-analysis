using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Atcom.Mappers.Search.Filters
{
    /// <summary>
    /// Filters out adults only results when search with pax mix with children or infants
    /// </summary>
    public class PaxMixAdultsOnlyFilter : IFilter
    {
        private readonly FacilityMatrixSettings _facilityMatrix;

        /// <summary>
        /// <inheritdoc cref="PaxMixAdultsOnlyFilter"/>
        /// </summary>
        /// <param name="options">CMS settings</param>
        public PaxMixAdultsOnlyFilter(IOptions<CmsSettings> options)
        {
            ArgumentNullException.ThrowIfNull(options);

            _facilityMatrix = options.Value.FacilityMatrix;
        }

        /// <inheritdoc />
        public async Task<List<AvCacheResultOffersOfferExtended>> FilterBy(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            ArgumentNullException.ThrowIfNull(request);

            if (!request.IncludesChildrenOrInfants ||
                offers == null ||
                !offers.Exists(os => os.IsHolidayCodeType(_facilityMatrix.AdultHolidayCode)))
            {
                return offers;
            }

            offers = offers.Where(os => !os.IsHolidayCodeType(_facilityMatrix.AdultHolidayCode)).ToList();

            return await Task.FromResult(offers);
        }

        /// <inheritdoc />
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
