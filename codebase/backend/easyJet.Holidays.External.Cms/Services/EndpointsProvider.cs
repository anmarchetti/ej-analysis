using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Models;
using easyJet.Holidays.External.Domain.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Cms.Services
{
    /// <summary>
    /// Available endpoints
    /// </summary>
    public enum CmsEndpoint
    {
        SearchHotels,
        SearchHotelsSummary,
        SearchPolygonHotelsSummary,
        SearchFacilities,
        /// <summary>
        /// SearchAccomodations
        /// </summary>
        SearchAccomodations,
        GetAllFilters,
        GetFlightFilters,
        SearchDestinations,
        DestinationCountries,
        Countries,
        DialingCodes,
        Airports,
        LocationImage,
        GetTitles,
        GetByAirportCodes,
        GetHierarchyByAirportCodes,
        GetTopByAirportCodes,
        GetDestinationsByCodes,
        PriceBreakdownSetting,
        CancelAndCreditSettings,
        GetPromoCacheBustingSetting,
        RoomTypes,
        RoomTypeByCode,
        BoardTypes,
        Transfers,
        FilteredFacilities,
        GetHotelTransfers,
        Content,
        /// <summary>
        /// Get Luggage API endpoint.
        /// </summary>
        GetLuggage,
        PackageThemes,
        GetHolidayTransferByProductId,
        GetMediaCenterArticles,
        GetDestinationCodeByName,
        GetMediaCenterTopics,
        GetHotelsCodes,
        GetHotelResortInfoByHotelCode,
        GetFeaturedFacilitiesByHotelCode,
        ValidatePromotion,
        GetCustomerPromoCode,
        GetAllPromotions,
        GetAllSpecialRequests,
        GetHealthEntryRequirements,
        /// <summary>
        /// Health Entry Requirements for Flight and Hotel bookings (different Sitecore item).
        /// </summary>
        GetHealthEntryRequirementsFlightAndHotel,
        GetPromoDestinations,
        GetExcursionMap,
        /// <summary>
        /// Track customer log in endpoint
        /// </summary>
        TrackCustomerLogIn,
        GetAllHotelCodes,
        /// <summary>
        /// End tracking endpoint
        /// </summary>
        EndTracking,
        /// <summary>
        /// Acmi Settings endpoint.
        /// </summary>
        GetAcmiSettings,
        GetAllMarketSettings,
        GetOfferFilterOptions,
        MatchPromocodes,
        GetAccommodationCodeToGiataCodeMapping,
        GetLivePrice,
        GetAllRecommendedDestinations,
        /// <summary>
        /// Facility Matrix Configuration endpoint.
        /// </summary>
        FacilityMatrixConfiguration,
        /// <summary>
        /// Get destination info endpoint.
        /// </summary>
        GetDestinationInfo,
        /// <summary>
        /// Get hotel highlights endpoint
        /// </summary>
        GetHotelHighlightsByHotelCode,
        /// <summary>
        /// Get TradeAgentFeedback attached file settings endpoint
        /// </summary>
        TradeAgentFeedbackAttachedFileSettings,
        /// <summary>
        /// Get all transfer duration times endpoint
        /// </summary>
        GetAllTransferDurations,
        /// <summary>
        /// Get Offer Filters Reordering Configuration API endpoint.
        /// </summary>
        GetOfferFiltersReorderingConfiguration,
        /// <summary>
        /// Filter Pills Configuration endpoint
        /// </summary>
        GetFilterPillsConfig
    }

    /// <summary>
    /// Endpoints provider for CMS services
    /// </summary>
    public class EndpointsProvider : BaseEndpointsProvider
    {
        private readonly CmsSettings _cmsSettings;

        public EndpointsProvider(
            IOptions<CmsSettings> cmsSettings,
            IOptions<EnvironmentBehaviourSettings> envBehaviorSettings,
            ICookiesService cookiesService,
            ILogger<BaseEndpointsProvider> logger
        ) : base(envBehaviorSettings, cookiesService, logger)
        {
            _cmsSettings = cmsSettings.Value ?? throw new ArgumentNullException(nameof(cmsSettings));

            // setup endpoints
            UriContainer[(int)CmsEndpoint.SearchHotels] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetHotels);
            UriContainer[(int)CmsEndpoint.SearchHotelsSummary] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetHotelsSummary);
            UriContainer[(int)CmsEndpoint.SearchPolygonHotelsSummary] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetPolygonHotelsSummary);
            UriContainer[(int)CmsEndpoint.SearchDestinations] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.DestinationsSearch);
            UriContainer[(int)CmsEndpoint.DestinationCountries] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.DestinationCountries);
            UriContainer[(int)CmsEndpoint.SearchFacilities] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetFacilities);
            UriContainer[(int)CmsEndpoint.SearchAccomodations] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetAccommodations);
            UriContainer[(int)CmsEndpoint.GetAllFilters] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetAllFilters);
            UriContainer[(int)CmsEndpoint.GetFlightFilters] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetFlightFilters);
            UriContainer[(int)CmsEndpoint.PackageThemes] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetAllThemes);

            UriContainer[(int)CmsEndpoint.Airports] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.Airports);
            UriContainer[(int)CmsEndpoint.LocationImage] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.LocationImage);
            UriContainer[(int)CmsEndpoint.GetTitles] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetTitles);
            UriContainer[(int)CmsEndpoint.PriceBreakdownSetting] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.PriceBreakdownSetting);
            UriContainer[(int)CmsEndpoint.CancelAndCreditSettings] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.CancelAndCreditSettings);
            UriContainer[(int)CmsEndpoint.GetByAirportCodes] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetByAirportCodes);
            UriContainer[(int)CmsEndpoint.GetHierarchyByAirportCodes] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetHierarchyByAirportCodes);
            UriContainer[(int)CmsEndpoint.GetTopByAirportCodes] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetTopByAirportCodes);
            UriContainer[(int)CmsEndpoint.GetDestinationsByCodes] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetDestinationsByCodes);
            UriContainer[(int)CmsEndpoint.Countries] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.Countries);
            UriContainer[(int)CmsEndpoint.DialingCodes] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.DialingCodes);
            UriContainer[(int)CmsEndpoint.GetHolidayTransferByProductId] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetHolidayTransferByProductId);
            UriContainer[(int)CmsEndpoint.GetAllTransferDurations] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetAllTransferDurations);
            UriContainer[(int)CmsEndpoint.GetAllHotelCodes] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetAllHotelCodes);

            UriContainer[(int)CmsEndpoint.RoomTypes] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.RoomTypes);
            UriContainer[(int)CmsEndpoint.BoardTypes] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.BoardTypes);

            UriContainer[(int)CmsEndpoint.RoomTypeByCode] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.RoomTypesByCode);

            UriContainer[(int)CmsEndpoint.Transfers] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.Transfers);
            UriContainer[(int)CmsEndpoint.GetHotelTransfers] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetHotelTransfers);

            UriContainer[(int)CmsEndpoint.FilteredFacilities] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetFilteredFacilities);

            UriContainer[(int)CmsEndpoint.Content] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.Content);
            UriContainer[(int)CmsEndpoint.GetLuggage] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetLuggage);

            UriContainer[(int)CmsEndpoint.GetHotelsCodes] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetHotelsCodes);
            UriContainer[(int)CmsEndpoint.GetDestinationCodeByName] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetDestinationCodeByName);
            UriContainer[(int)CmsEndpoint.GetMediaCenterArticles] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetMediaCenterArticles);

            UriContainer[(int)CmsEndpoint.GetMediaCenterTopics] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetMediaCenterTopics);

            UriContainer[(int)CmsEndpoint.GetHotelResortInfoByHotelCode] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetHotelResortInfoByHotelCode);
            UriContainer[(int)CmsEndpoint.GetHotelHighlightsByHotelCode] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetHotelHighlightsByHotelCode);
            UriContainer[(int)CmsEndpoint.GetFeaturedFacilitiesByHotelCode] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetFeaturedFacilitiesByHotelCode);

            UriContainer[(int)CmsEndpoint.ValidatePromotion] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.ValidatePromotion);
            UriContainer[(int)CmsEndpoint.GetCustomerPromoCode] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetCustomerPromoCode);
            UriContainer[(int)CmsEndpoint.MatchPromocodes] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.MatchPromoCodes);
            UriContainer[(int)CmsEndpoint.GetAllPromotions] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetAllPromotions);
            
            UriContainer[(int)CmsEndpoint.GetPromoCacheBustingSetting] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetPromoCacheBustingSetting);
            UriContainer[(int)CmsEndpoint.GetPromoDestinations] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetPromoDestinations);

            UriContainer[(int)CmsEndpoint.GetAllSpecialRequests] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetAllSpecialRequests);

            UriContainer[(int)CmsEndpoint.GetHealthEntryRequirements] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetHealthEntryRequirements);
            UriContainer[(int)CmsEndpoint.GetHealthEntryRequirementsFlightAndHotel] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetHealthEntryRequirementsFlightAndHotel);

            UriContainer[(int)CmsEndpoint.GetExcursionMap] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetExcursionMap);

            UriContainer[(int)CmsEndpoint.GetAllMarketSettings] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetAllMarketSettings);
            UriContainer[(int)CmsEndpoint.GetOfferFilterOptions] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetOfferFilterOptions);

            UriContainer[(int)CmsEndpoint.GetAccommodationCodeToGiataCodeMapping] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetAccommodationCodeToGiataMapping);
            UriContainer[(int)CmsEndpoint.GetLivePrice] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetLivePrice);
            UriContainer[(int)CmsEndpoint.GetAllRecommendedDestinations] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetAllRecommendedDestinations);
            UriContainer[(int)CmsEndpoint.FacilityMatrixConfiguration] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.FacilityMatrixConfiguration);
            UriContainer[(int)CmsEndpoint.GetDestinationInfo] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetDestinationInfo);
            UriContainer[(int)CmsEndpoint.GetOfferFiltersReorderingConfiguration] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetOfferFiltersReorderingConfiguration);
            UriContainer[(int)CmsEndpoint.GetFilterPillsConfig] = new EndpointUri(_cmsSettings.Host, _cmsSettings.Api.GetFilterPillsConfig);
        }

        /// <summary>
        /// Get Cms API endpoint. Uses mocked domain from cookies is used if it's allowed.
        /// </summary>
        /// <param name="type">Endpoint type</param>
        /// <param name="cookies">Collection of cookies</param>
        /// <returns>Endpoint Uri</returns>
        public Uri GetEndpoint(CmsEndpoint type, IRequestCookieCollection cookies, Dictionary<string, string> urlSegments = null)
        {
            return GetEndpoint((int)type, cookies, urlSegments);
        }

        /// <inheritdoc />        
        protected override string GetMockedDomain(IRequestCookieCollection cookies)
        {
            return CookiesService.SitecoreMockCookie(cookies);
        }
    }
}
