using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.LivePrice;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using easyJet.Holidays.External.Atcom.Services.Search;

namespace easyJet.Holidays.External.AWS.LivePriceSync.Services
{
    public class SearchService : ILivePriceSearchService
    {
        private readonly SearchOffersService _searchOffersService;

        public SearchService(SearchOffersService searchOffersService)
        {
            _searchOffersService = searchOffersService;
        }

        /// <summary>
        /// Send Request to Atcom to get offers by specified criteria
        /// </summary>
        /// <param name="namedSearch"></param>
        /// <param name="countryCodes"></param>
        /// <param name="range"></param>
        /// <param name="departurePoints"></param>
        /// <param name="marketCode"></param>
        /// <returns></returns>
        public virtual async Task<List<AvCacheResultOffersOffer>> DoSearch(NamedSearch namedSearch, IEnumerable<string> countryCodes, DateRange range, string departurePoints, string marketCode)
        {
            var packagesRequest = new PackagesSearchRequest
            {
                Geography = string.Join('|', countryCodes ?? new List<string>()),
                StartDate = range.Start?.ToString("yyyy-MM-dd"),
                EndDate = range.End?.ToString("yyyy-MM-dd"),
                Duration = new() { namedSearch.Duration },
                Room = new()
                {
                    new RoomAllocation()
                    {
                        Adults = namedSearch.Adults,
                        Children = namedSearch.Children,
                        Infants = namedSearch.Infants,
                    }
                },
                ChildAges = string.Join(",", namedSearch.ChildAges),
                Departure = departurePoints,
                MarketCode = marketCode
            };
            var destinationItems = countryCodes!.Select(code => new DestinationItem { Code = code, Type = DestinationItemType.Country });

            var result = await GeographyParseUtils.SplitRequestByDestinations(packagesRequest, _searchOffersService.DoSearch, destinationItems);

            var offers = result
                .Select(x => x.Item1?.Payload?.Body?.Result?.Offers?.Offer ?? Array.Empty<AvCacheResultOffersOffer>())
                .Aggregate((x, y) => x.Concat(y).ToArray())
                .ToList();


            // and filter them by theme on our site (Atcom can't do it for us)
            offers = FilterByTheme(offers, namedSearch.ThemeTypesCodes);

            return offers;
        }

        /// <summary>
        /// Filter offers by theme. Uses startsWith for codes comparison. 
        /// </summary>
        /// <param name="originalSet"></param>
        /// <param name="theme"></param>
        /// <returns></returns>
        public List<AvCacheResultOffersOffer> FilterByTheme(List<AvCacheResultOffersOffer> originalSet, IEnumerable<string> themeCodes)
        {
            if (themeCodes == null || !themeCodes.Any())
            {
                return originalSet;
            }

            // retrive themes from request
            var themes = themeCodes.Select(f => f?.ToUpperInvariant()?.Trim());

            // Filter offers by theme codes
            return originalSet
                .Where(offer => offer.Accom != null && themes.Any(t => HotelThemeService.CompareThemeCode(offer.Accom.FirstOrDefault()?.Prom, t)))
                .ToList();
        }
    }
}

