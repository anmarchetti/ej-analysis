using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Atcom.Mappers.Search.Filters
{
    public class DistressedFlightsFilter : IFilter
    {

        private readonly AtcomSettings _atcomSettings;

        public DistressedFlightsFilter(IOptions<AtcomSettings> atcomSettings)
        {
            _atcomSettings = atcomSettings.Value ?? throw new ArgumentNullException(nameof(atcomSettings));
        }

        public async Task<List<AvCacheResultOffersOfferExtended>> FilterBy(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            if (!request.DistressedFlightsOnly.HasValue || !request.DistressedFlightsOnly.Value)
            {
                return offers;
            }

            return offers
                .Where(offer => offer.Transport.Route.Any(r => r.Class == _atcomSettings.DistressedFlightsClass) == request.DistressedFlightsOnly.Value)
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
