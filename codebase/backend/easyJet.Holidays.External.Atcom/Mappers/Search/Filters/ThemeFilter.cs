using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Atcom.Mappers.Search.Filters
{
    /// <summary>
    /// Theme filter
    /// </summary>
    public class ThemeFilter : IFilter
    {
        private readonly AtcomSettings _atcomSettings;
        private readonly IReferenceDataService _referenceDataService;

        public ThemeFilter(IOptions<AtcomSettings> atcomSettings, IReferenceDataService referenceDataService)
        {
            _atcomSettings = atcomSettings.Value ?? throw new ArgumentNullException(nameof(atcomSettings));
            _referenceDataService = referenceDataService;
        }

        /// <summary>
        /// Get themes value from request
        /// </summary>
        /// <returns>Themes value to filter by</returns>
        protected virtual string PropertyValue(PackagesSearchRequest r) => r.Themes;

        /// <summary>
        /// Filter offers by theme
        /// </summary>
        /// <param name="originalSet"></param>
        /// <param name="request"></param>
        /// <returns></returns>
        public async Task<List<AvCacheResultOffersOfferExtended>> FilterBy(List<AvCacheResultOffersOfferExtended> originalSet, PackagesSearchRequest request)
        {
            var themeVal = PropertyValue(request);
            if (!string.IsNullOrWhiteSpace(themeVal))
            {
                // retrive themes from request
                var themes = themeVal.ToUpperInvariant().Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries).Select(f => f.Trim());

                // Filter offers by theme codes
                originalSet = originalSet
                    .Where(offer => offer.Accom != null && themes.Any(theme => HotelThemeService.CompareThemeCode(offer.Accom.FirstOrDefault()?.Prom, theme)))
                    .ToList();
            }

            return originalSet;
        }

        /// <summary>
        /// Calculate filter options for the theme filters
        /// </summary>
        /// <param name="offers">Offers to filter</param>
        /// <param name="request">Request to exicute</param>
        /// <param name="themes">Theme settings from sitecore</param>
        /// <returns></returns>
        public async Task<FilterOptions> GetOptions(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request, ApplyAllFiltersFunc applyAllOtherFilters)
        {
            if (offers == null || !offers.Any())
            {
                return FilterOptions.Empty;
            }

            var filteredOffers = await applyAllOtherFilters(offers, request);

            var themeTypesToIgnore = _atcomSettings.Themes?.HideOnFilters;
            var themes =
                (await _referenceDataService.GetAllThemes())?.Where(theme =>
                    !string.IsNullOrWhiteSpace(theme.Code)); // get rid of theme without code (Default one)

            var options = themes?.Select(theme =>
                {
                    // Prefilter by theme to improve performance
                    var themeOffers = filteredOffers.Where(offer =>
                        HotelThemeService.CompareThemeCode(offer.Accom.FirstOrDefault()?.Prom, theme.Code));

                    return new FilterOption()
                    {
                        Code = theme.Code,
                        Name = theme.Name,
                        TrackingId = theme.TrackingId,
                        Icon = theme.Icon,
                        Children = theme.Types?.Where(t => themeTypesToIgnore?.Contains(t.Code) != true)
                            .Select(type => new FilterOption()
                            {
                                Code = type.Code,
                                Name = type.Name,
                                TrackingId = type.TrackingId,
                                Icon = type.Icon,
                                Count = themeOffers.Count(offer =>
                                    HotelThemeService.CompareThemeCode(offer.Accom.FirstOrDefault()?.Prom, type.Code))
                            })
                            .ToList(),
                        // Get count based on theme code. We can't sum children counts because there are types that can be not mapped in sitecore
                        Count = themeOffers.Count(),
                    };
                })
                .ToList();

            return new FilterOptions
            {
                Options = options
            };
        }
    }
}
