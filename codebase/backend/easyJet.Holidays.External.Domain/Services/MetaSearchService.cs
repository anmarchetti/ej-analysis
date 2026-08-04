using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.Destinations;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Models;
using Force.DeepCloner;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Primitives;
using System.Text;

namespace easyJet.Holidays.External.Domain.Services
{
    public class MetaSearchService : IMetaSearchService
    {

        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IDestinationsService _destinationsService;
        private readonly SearchSettings _searchSettings;
        private readonly CmsSettings _cmsSettings;


        public MetaSearchService(
             IHttpContextAccessor httpContextAccessor,
             IDestinationsService destinationsService, IOptions<SearchSettings> searchSettings, IOptions<CmsSettings> cmsSettings)
        {
            _searchSettings = searchSettings.Value ?? throw new ArgumentNullException(nameof(searchSettings));
            _httpContextAccessor = httpContextAccessor;
            _destinationsService = destinationsService;
            _cmsSettings = cmsSettings.Value ?? throw new ArgumentNullException(nameof(searchSettings));
        }

        /// <inheritdoc />
        public SearchOffersResponse UpdateHotelLink(SearchOffersResponse packages, PackagesSearchRequest request)
        {
            var shouldUpdateOffers = _httpContextAccessor.HttpContext.Request.Headers[_searchSettings.MetaSearchHeader];
            // Should return deep link only if request contains special headers.
            if (shouldUpdateOffers != default(StringValues))
            {
                packages.Offers.ForEach(x => x.DeepLink = BuildHotelDeepLink(x, request));
            }
            return packages;
        }

        /// <inheritdoc />
        public async Task<MetaSearchOffersResponse> ConvertOffers(SearchOffersResponse packages, PackagesSearchRequest request)
        {
            if (packages.Offers.IsNullOrEmpty())
            {
                return new MetaSearchOffersResponse();
            }

            var convertedOffers = new List<MetaSearchOffer>(packages.Offers.Count);

            //no information about hotel -> get hotel location from CMS
            //without hotel location we can't build hotel deep link (see `BuildHotelDeepLink`)
            var accomIdsWithoutHotelInfo = packages.Offers
                ?.Where(offer => offer.Hotel == null)
                .Select(offer => offer.Accom.Id);

            var accomIdsWithoutHotelInfoChunks = accomIdsWithoutHotelInfo.Split(_cmsSettings.PageSize);

            //get locations for corresponding hotels
            var getDestinationsByCodesTasks = accomIdsWithoutHotelInfoChunks.Select(chunk =>
                _destinationsService.GetDestinationsByCodes(chunk.ToArray(), true));

            var destinationsByCodes = (await Task.WhenAll(getDestinationsByCodesTasks)).SelectMany(items => items);

            foreach (var offer in packages.Offers)
            {
                var hotelDestination =
                    destinationsByCodes?.FirstOrDefault(item => string.Equals(item.Code, offer.Accom.Id));

                //no hotel info and there is no in CMS -> skip 
                if (offer.Hotel == null && hotelDestination == null)
                {
                    continue;
                }

                BuildHotelAndAltBoardsDeepLinks(offer, request, hotelDestination);

                var metaSearchOffer = new MetaSearchOffer(offer)
                {
                    Hotel =
                    {
                        GiataCode = hotelDestination?.GiataCode
                    }
                };

                convertedOffers.Add(metaSearchOffer);
            }

            return new MetaSearchOffersResponse()
            {
                Offers = convertedOffers
            };
        }

        private void BuildHotelAndAltBoardsDeepLinks(Offer offer, PackagesSearchRequest request, DestinationItem hotelDestination)
        {
            if (offer.Hotel is null && hotelDestination is not null)
            {
                AddDestinationInfoToOffer(offer, hotelDestination);
            }

            string hotelDeepLinkPath = GetHotelBasePath(offer);

            var hotelDeepLinkQueryParam = BuildDeepLinkQueryParam(offer, request);
            offer.DeepLink = $"{hotelDeepLinkPath}?{hotelDeepLinkQueryParam}";

            if (offer.AltBoards != null)
            {
                foreach (var altBoard in offer.AltBoards)
                {
                    altBoard.DeepLink = BuildDeepLinkForAltBoard(offer, request, hotelDeepLinkPath, altBoard);
                }
            }
        }

        private string BuildDeepLinkForAltBoard(Offer offer, PackagesSearchRequest request, string hotelDeepLinkPath, AltBoardType altBoard)
        {
            var altBoardOffer = offer.DeepClone();

            foreach (var unit in altBoardOffer.Accom.Unit)
            {
                if (unit.BoardType != null)
                    unit.BoardType.Code = altBoard.Code;

                unit.Board = altBoard.Code;

                if (altBoard.RoomAlterations != null && altBoard.RoomAlterations.ContainsKey(unit.Code))
                    unit.Code = altBoard.RoomAlterations[unit.Code];
            }

            var deepLinkQueryParams = BuildDeepLinkQueryParam(altBoardOffer, request);
            return $"{hotelDeepLinkPath}?{deepLinkQueryParams}";
        }

        private string GetHotelBasePath(Offer offer)
        {
            var hotelDetailsPath = HotelDetailsPath(offer.Hotel);
            var baseDeepLinkPath = $"{_searchSettings.FrontendBasePath}{hotelDetailsPath}";
            return baseDeepLinkPath;
        }

        private static void AddDestinationInfoToOffer(Offer offer, DestinationItem hotelDestination)
        {
            var hotelCountry = hotelDestination?.Parents?.FirstOrDefault(item => item.Type == DestinationItemType.Country) ??
                hotelDestination?.Parents?.FirstOrDefault(item => item.Type == DestinationItemType.VirtualCountry);

            var hotelRegion = hotelDestination?.Parents?.FirstOrDefault(item => item.Type == DestinationItemType.Region) ??
                hotelDestination?.Parents?.FirstOrDefault(item => item.Type == DestinationItemType.VirtualRegion);

            var hotelResort = hotelDestination?.Parents?.FirstOrDefault(item => item.Type == DestinationItemType.Resort) ??
                hotelDestination?.Parents?.FirstOrDefault(item => item.Type == DestinationItemType.VirtualResort);

            offer.Hotel = new OfferHotel()
            {
                Country = new HotelCountry()
                {
                    Name = hotelCountry?.Name,
                    ItemName = hotelCountry?.ItemName,
                    Code = hotelCountry?.Code
                },
                Resort = new HotelResort()
                {
                    Name = hotelResort?.Name,
                    ItemName = hotelResort?.ItemName,
                    Code = hotelResort?.Code
                },
                Location = new HotelLocation()
                {
                    Name = hotelRegion?.Name,
                    ItemName = hotelRegion?.ItemName,
                    Code = hotelRegion?.Code
                },
                Name = hotelDestination?.Name,
            };
        }

        private string BuildHotelDeepLink(Offer offer, PackagesSearchRequest request)
        {
            var hotelDetailsPath = HotelDetailsPath(offer.Hotel);

            return !string.IsNullOrWhiteSpace(hotelDetailsPath)
                ? $"{_searchSettings.FrontendBasePath}{hotelDetailsPath}?{BuildDeepLinkQueryParam(offer, request)}"
                : null;
        }

        private string HotelDetailsPath(OfferHotel hotel)
        {
            if (hotel != null)
            {
                var hotelLinkBuilder = new StringBuilder();
                var country = hotel.Country?.Name;
                var location = hotel.Location?.Name;
                var resort = hotel.Resort?.Name;
                var hotelName = hotel?.Name;

                if (!string.IsNullOrWhiteSpace(country))
                {
                    hotelLinkBuilder.Append($"/{country}");
                }

                if (!string.IsNullOrWhiteSpace(location))
                {
                    hotelLinkBuilder.Append($"/{location}");
                }

                if (!string.IsNullOrWhiteSpace(resort))
                {
                    hotelLinkBuilder.Append($"/{resort}");
                }

                if (!string.IsNullOrWhiteSpace(hotelName))
                {
                    hotelLinkBuilder.Append($"/{hotelName}");
                }

                var hotelLink = hotelLinkBuilder
                    .Replace("-", string.Empty)
                    .Replace("'", string.Empty)
                    .Replace(" ", "-")
                    .Replace("&", string.Empty);

                return hotelLink.ToString().ToLower();
            }

            return string.Empty;
        }

        private string BuildDeepLinkQueryParam(Offer offer, PackagesSearchRequest request)
        {
            return new HotelDeepLinkRequest(offer, request).BuildQueryString(new QueryStringOptions
            {
                UseBooleanString = true,
                UseDeepArrayParse = true,
                QueryEncodeFunc = Uri.EscapeDataString
            });
        }
    }
}
