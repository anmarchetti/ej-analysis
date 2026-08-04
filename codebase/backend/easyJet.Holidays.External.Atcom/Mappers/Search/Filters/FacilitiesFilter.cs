using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Atcom.Mappers.Search.Filters
{
    /// <summary>
    /// Facilities filter
    /// </summary>
    public class FacilitiesFilter : IFilter, IFilterOptionCount
    {
        private static readonly char[] separator = [','];

        /// <inheritdoc />
        public Task Count(IList<AvCacheResultOffersOfferExtended> offers, FilterOptions filterOptions, PackagesSearchRequest request)
        {
            ArgumentNullException.ThrowIfNull(filterOptions);
            ArgumentNullException.ThrowIfNull(offers);

            foreach (var offer in offers)
            {
                var facilities = offer.Accom.Where(a => a.FacilityGroups != null).SelectMany(a => a.FacilitiesCodes);
                foreach (var fac in facilities)
                {
                    foreach (var option in filterOptions.Options.Where(x => x.Children.Select(y => y.Code).Contains(fac)))
                    {
                        option.Children.Where(x => x.Code == fac).ToList().ForEach(x => x.Count++);
                        option.Count = option.Children.Count;
                    }
                }
            }
            return Task.CompletedTask;
        }

        /// <summary>
        /// Filter data set by facilities with AND condition
        /// </summary>
        /// <param name="offers">IEnumerable of offers</param>
        /// <param name="request">search request</param>
        /// <returns></returns>
        public async Task<List<AvCacheResultOffersOfferExtended>> FilterBy(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            ArgumentNullException.ThrowIfNull(request);

            if (!string.IsNullOrWhiteSpace(request.Facilities))
            {
                var facilities = request.Facilities.ToUpperInvariant().Split(separator, StringSplitOptions.RemoveEmptyEntries).Select(f => f.Trim());

                offers = offers.Where(offer =>
                    offer.Accom != null && offer.Accom.Any(accom => accom.FacilitiesCodes.Intersect(facilities).Count() == facilities.Count())
                ).ToList();
            }

            return await Task.FromResult(offers);
        }

        /// <summary>
        /// Collect all valid options for facilities filtering, without counters.
        /// Because list of options will always be based on original set, but counter are based on filtered set
        /// </summary>
        /// <param name="offers"></param>
        /// <param name="request"></param>
        /// <param name="applyAllOtherFilters"></param>
        /// <returns></returns>

        public async Task<FilterOptions> GetOptions(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request, ApplyAllFiltersFunc applyAllOtherFilters)
        {
            ArgumentNullException.ThrowIfNull(request);

            if (offers == null || offers.Count == 0)
            {
                return FilterOptions.Empty;
            }

            var options = offers
                .Where(offer => offer != null && offer.Accom != null)
                .SelectMany(offer => offer.Accom)
                .Where(a => a.FacilityGroups != null)
                .SelectMany(accom => accom.FacilityGroups)
                .OrderBy(x => x.Order)
                .GroupBy(x => x.Name)
                .Select(x => new FilterOption()
                {
                    Name = x.FirstOrDefault()?.Name,
                    TrackingId = x.FirstOrDefault()?.TrackingId,
                    Children = x.Where(y => y.FacilityFilteredTypes != null).SelectMany(y => y.FacilityFilteredTypes)
                    .Distinct(new FacilityComparer())
                    .OrderBy(y => y.Order)
                    .Select(facility => new FilterOption()
                    {
                        Code = facility.Code.ToUpperInvariant(),
                        Name = facility.Name,
                        TrackingId = facility.TrackingId,
                        TooltipText = facility.Tooltip,
                        FacilityFilterGroup = facility.FacilityFilterGroup
                    }).ToList()
                })
                .ToList();

            return await Task.FromResult(new FilterOptions { Options = options });
        }
    }

    public class FacilityComparer : IEqualityComparer<Facility>
    {
        public bool Equals(Facility x, Facility y)
        {
            if (x == null || y == null)
            {
                return x == y;
            }

            return x.Code == y.Code;
        }

        public int GetHashCode(Facility obj)
        {
            if (obj == null || obj.Code == null)
            {
                return 0;
            }

            return obj.Code.GetHashCode();
        }
    }
}
