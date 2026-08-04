using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using easyJet.Foundation.Destinations.ContentSearch.Queries;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Mappers;
using easyJet.Foundation.Destinations.Models;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Models.Requests;
using easyJet.Foundation.Destinations.Models.Responses;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Attributes;
using easyJet.Foundation.SitecoreExtensions.Controllers;
using Newtonsoft.Json;
using Sitecore.Configuration;
using Sitecore.Data;

namespace easyJet.Foundation.Destinations.Controllers
{
    // todo: check which endpoints are not used anymore
    // todo: replace IDestinationsRepository with IDestinationsSearchService in all actions
    public class DestinationsSearchController : BaseServicesApiController
    {
        private static readonly bool IncludeSearchByAirportCode = Settings.GetBoolSetting("Destinations.IncludeSearchByAirportCode", false);

        private readonly IDestinationsRepository repository;
        private readonly IDestinationsSearchService searchService;
        private readonly IHotelFacilitiesService hotelFacilitiesService;
        private readonly IDestinationsLogger destinationsLogger;

        public DestinationsSearchController(
            IDestinationsRepository repository,
            IDestinationsSearchService searchService,
            IHotelFacilitiesService hotelFacilitiesService,
            IDestinationsLogger destinationsLogger)
            : base(destinationsLogger)
        {
            this.repository = repository;
            this.searchService = searchService;
            this.hotelFacilitiesService = hotelFacilitiesService;
            this.destinationsLogger = destinationsLogger;
        }

        /// <summary>
        /// Search for Accommodations by provided Atcom IDs.
        /// </summary>
        /// <param name="request">Array of Atcom IDs.</param>
        /// <returns>Collection of Accommodations in JSON format.</returns>
        [HttpPost]
        [LogExecutionTime]
        public ActionResult GetHotels(HotelsByIdsRequest request)
        {
            if (request.AtcomIds == null || !request.AtcomIds.Any())
            {
                throw new ArgumentException($"Argument {nameof(request.AtcomIds)} cannot be null or empty");
            }

            var response = new HotelsByIdsResponse(searchService.GetHotelsByAtcomCodes(request.AtcomIds).ToList());

            return UnlimitedJson(response, JsonRequestBehavior.DenyGet);
        }

        /// <summary>
        /// Search for Hotel by provided GIATA ID.
        /// </summary>
        /// <param name="code">GIATA ID.</param>
        /// <returns>Hotel data in JSON format.</returns>
        [HttpGet]
        [LogExecutionTime]
        public ActionResult GetExpediaHotel(string code)
        {
            if (code == null || string.IsNullOrWhiteSpace(code))
            {
                throw new ArgumentException($"Argument {nameof(code)} cannot be null or empty");
            }

            try
            {
                var hotel = searchService.GetExpediaHotelByGiataCode(code);

                if (hotel == null)
                {
                    return HttpNotFound($"Hotel with giata code '{code}' was not found.");
                }

                return UnlimitedJson(hotel, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                destinationsLogger?.Error($"Error in {nameof(GetExpediaHotel)} for Giata:'{code}'.", ex, this);

                return new HttpStatusCodeResult(
                    (int)System.Net.HttpStatusCode.InternalServerError,
                    "Internal Server Error.");
            }
        }

        /// <summary>
        /// Get Atcom Ids by GIATA codes.
        /// </summary>
        /// <param name="request">Array of GIATA codes.</param>
        /// <returns>Mapping between GIATA code and corresponding Atcom Ids.</returns>
        [HttpPost]
        [LogExecutionTime]
        public ActionResult GetAtcomIdsByGiataCodes(BaseByCodesRequest request)
        {
            if (request.Codes == null || !request.Codes.Any())
            {
                throw new ArgumentException($"Argument {nameof(request.Codes)} cannot be null or empty");
            }

            var requestedGiataCodes = request.Codes
                .Where(code => !string.IsNullOrWhiteSpace(code))
                .Distinct()
                .ToArray();

            var response = requestedGiataCodes.ToDictionary(code => code, _ => Array.Empty<string>());
            var hotels = searchService.GetHotelsByGiataCodes(requestedGiataCodes);
            var atcomIdsByGiataCode = hotels
                .Where(item => !string.IsNullOrWhiteSpace(item.GiataCode))
                .GroupBy(item => item.GiataCode)
                .ToDictionary(
                    group => group.Key,
                    group => group.SelectMany(item => item.SourceCodes ?? Array.Empty<string>())
                        .Where(code => !string.IsNullOrWhiteSpace(code))
                        .Distinct()
                        .ToArray());

            foreach (var giataCode in atcomIdsByGiataCode.Keys)
            {
                response[giataCode] = atcomIdsByGiataCode[giataCode];
            }

            return UnlimitedJson(response, JsonRequestBehavior.DenyGet);
        }

        /// <summary>
        /// Search for Accommodation transfers s by provided Atcom IDs.
        /// </summary>
        /// <param name="request">Array of Atcom IDs.</param>
        /// <returns>Collection of Accommodations transfers .</returns>
        [HttpPost]
        [LogExecutionTime]
        public ActionResult GetHotelTransfers(HotelsByIdsRequest request)
        {
            if (request.AtcomIds == null || !request.AtcomIds.Any())
            {
                throw new ArgumentException($"Argument {nameof(request.AtcomIds)} cannot be null or empty");
            }

            var data = repository.SearchHotelTransfersByIds(request.AtcomIds);
            var response = data.Hits.Select(x => AccommodationMapper.MapTransfersFromSearchResultItem(x.Document));

            return Json(response, JsonRequestBehavior.DenyGet);
        }

        /// <summary>
        /// Search by search query.
        /// </summary>
        /// <param name="searchQuery">Search Query.</param>
        /// <param name="showOnSearchPod">The flag which shows that Solr get only destinations with enable Show On Search Pod check-box.</param>
        /// <param name="shouldGetItemsForAutocompleteOnly">The flag which shows that Solr get only destinations with enable Show In Autocomplete check-box.</param>
        /// <param name="destinationFilter">Destination filter.</param>
        /// <returns>Result JSON.</returns>
        [HttpGet]
        [LogExecutionTime]
        public ActionResult Search(string searchQuery, bool showOnSearchPod = false, bool shouldGetItemsForAutocompleteOnly = true, DestinationFilter destinationFilter = DestinationFilter.All)
        {
            // Search for Destination items
            var data = searchService.SearchByName(searchQuery, showOnSearchPod, shouldGetItemsForAutocompleteOnly, destinationFilter, IncludeSearchByAirportCode);

            // Build response
            var response = new DestinationsSearchResponse(data);

            // Return results
            return UnlimitedJson(response, JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        [LogExecutionTime]
        public ActionResult GetResorts(ResortByIdsRequest request)
        {
            var shouldIncludeCoordinates = request?.WithHotelCoordinates == true;
            var data = request?.AtcomIds == null || !request.AtcomIds.Any()
                ? searchService.GetResorts(includeHotelCoordinates: shouldIncludeCoordinates)
                : searchService.GetResortsByCodes(request.AtcomIds, shouldIncludeCoordinates);

            var response = data?.ToArray() ?? Array.Empty<ResortResponse>();

            return UnlimitedJson(response, JsonRequestBehavior.DenyGet);
        }

        [HttpPost]
        [LogExecutionTime]
        public ActionResult GetHotelsFacilities(HotelsByIdsRequest request)
        {
            if (request.AtcomIds == null || !request.AtcomIds.Any())
            {
                throw new ArgumentException($"Argument {nameof(request.AtcomIds)} cannot be null or empty");
            }

            var data = hotelFacilitiesService.GetHotelsFacilities(request.AtcomIds);

            var response = new HotelFacilitiesResponse(data);

            return Json(response, JsonRequestBehavior.DenyGet);
        }

        /// <summary>
        /// Gets location image URL by provided code.
        /// </summary>
        /// <param name="code">Location (region) code.</param>
        /// <returns>Image Url.</returns>
        [HttpGet]
        public ActionResult GetImage(string code)
        {
            if (string.IsNullOrEmpty(code))
            {
                throw new ArgumentException($"Argument {nameof(code)} cannot be null or empty");
            }

            var response = searchService.GetImage(code);

            return Json(response, JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Gets hotel image URLs by provided code.
        /// </summary>
        /// <param name="code">Hotel code.</param>
        /// <returns>Image Urls.</returns>
        [HttpGet]
        public ActionResult GetHotelImage(string code)
        {
            if (string.IsNullOrEmpty(code))
            {
                throw new ArgumentException($"Argument {nameof(code)} cannot be null or empty");
            }

            var response = searchService.GetHotelImage(code);

            return Json(response, JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Get all countries with regions.
        /// </summary>
        /// <param name="showOnSearchPod">The flag which shows that Solr get only countries with enable Show On Search Pod check-box.</param>
        /// <param name="shouldGetItemsForDropdownOnly">The flag which shows that Solr get only countries with enable Show On Dropdown check-box.</param>
        /// <returns>Collection of Destinations in JSON format.</returns>
        [HttpGet]
        [LogExecutionTime]
        public ActionResult GetAllCountries(bool showOnSearchPod = false, bool shouldGetItemsForDropdownOnly = true)
        {
            // Get all countries.
            var response = searchService.GetAllCountries(showOnSearchPod, shouldGetItemsForDropdownOnly);

            // Return results
            return Json(response, JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Get destinations by airport codes.
        /// </summary>
        /// <param name="request">DestinationsByAirportCodesRequest.</param>
        /// <returns>Collection of Destinations in JSON format.</returns>
        [HttpPost]
        [LogExecutionTime]
        public ActionResult GetByAirportCodes(BaseByCodesRequest request)
        {
            if (request.Codes == null || !request.Codes.Any())
            {
                throw new ArgumentException($"Argument {nameof(request.Codes)} cannot be null or empty");
            }

            // Search for Destination items
            var data = repository.GetDestinationsByAirportCodes(request.Codes);

            // Build response
            var response = SourcesSearchResultMapper
                .MapDataSourceSearchResultByAtcomCode(data?.Select(x => x.Document), (code, document) => new ChildDestination(document, false) { Code = code });

            // Return results
            return Json(response, JsonRequestBehavior.DenyGet);
        }

        [HttpPost]
        [LogExecutionTime]
        public ActionResult GetDestinationsByAirportCodes(DestinationsByAirportCodesRequest request)
        {
            if (request.Codes == null || !request.Codes.Any())
            {
                throw new ArgumentException($"Argument {nameof(request.Codes)} cannot be null or empty");
            }

            DestinationsByAirportCodesResponse response = searchService.GetDestinationsByAirportCodes(
                new DestinationByCodeQueryArgs
                {
                    Query = request.Query,
                    Codes = request.Codes.Distinct().ToArray(),
                    Page = request.Page,
                    Take = request.Take,
                    Filter = request.Filter,
                    ShouldGetItemsForAutocompleteOnly = request.ShouldGetItemsForAutocompleteOnly,
                    ShouldGetItemsForDropdownOnly = request.ShouldGetItemsForDropdownOnly,
                    IncludeSearchByAirportCode = IncludeSearchByAirportCode
                });

            return Json(response, JsonRequestBehavior.DenyGet);
        }

        /// <summary>
        /// Get destinations by airport codes.
        /// </summary>
        /// <param name="request">DestinationsByAirportCodesRequest.</param>
        /// <returns>Collection of Destinations in JSON format.</returns>
        [HttpPost]
        [LogExecutionTime]
        [Obsolete]
        public ActionResult GetHierarchyByAirportCodes(BaseByCodesRequest request)
        {
            if (request.Codes == null || !request.Codes.Any())
            {
                throw new ArgumentException($"Argument {nameof(request.Codes)} cannot be null or empty");
            }

            // Search for Destination items
            var data = repository.GetDestinationsByAirportCodes(request.Codes);

            // Build response
            var response = data?.Select(x => new ChildDestination(x.Document)).ToArray();

            // Return results
            return Json(response, JsonRequestBehavior.DenyGet);
        }

        /// <summary>
        /// Search for Destinations (country, location, resort, hotels) by provided Atcom IDs.
        /// </summary>
        /// <param name="request">Array of Atcom IDs.</param>
        /// <param name="includeRelatedItems">Indicates if should include parents and children or not.</param>
        /// <returns>Collection of DatasourceObject in JSON format.</returns>
        [HttpPost]
        [LogExecutionTime]
        public ActionResult GetDestinationsByCodes(BaseByCodesRequest request, bool includeRelatedItems = false)
        {
            if (request.Codes == null || !request.Codes.Any())
            {
                throw new ArgumentException($"Argument {nameof(request.Codes)} cannot be null or empty");
            }

            var data = searchService.GetDestinationsByCodes(request.Codes, includeRelatedItems);
            var response = SourcesSearchResultMapper.MapDataSourceSearchResultByAtcomCode(data, DestinationsMapper.MapFromBaseDestinationSearchResultItem);

            return Json(response, JsonRequestBehavior.DenyGet);
        }

        /// <summary>
        /// Search for Destination (country, location, resort) by provided Atcom ID.
        /// </summary>
        /// <param name="code">Destination code.</param>
        /// <returns>Destination Info.</returns>
        [HttpGet]
        [LogExecutionTime]
        public ActionResult GetDestinationInfo(string code)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                throw new ArgumentException($"Argument {nameof(code)} cannot be null or empty");
            }

            var data = searchService.GetDestinationInfo(code);

            return Json(data, JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Get muzement data or hotels coordinates by destination code.
        /// </summary>
        /// <param name="code">Destination code.</param>
        /// <returns>Muzement data.</returns>
        [HttpGet]
        [LogExecutionTime]
        public ActionResult GetMuzementData(string code)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                throw new ArgumentException($"Argument {nameof(code)} cannot be null or empty");
            }

            var response = searchService.GetMuzement(code);
            return Json(response, JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Search for Destinations (country, location, resort, hotels) by provided Atcom IDs.
        /// </summary>
        /// <param name="request">Array of Atcom IDs.</param>
        /// <returns>Collection of DatasourceObject in JSON format.</returns>
        [HttpPost]
        public ActionResult GetTitles(BaseByCodesRequest request)
        {
            if (request.Codes == null || !request.Codes.Any())
            {
                throw new ArgumentException($"Argument {nameof(request.Codes)} cannot be null or empty");
            }

            var data = searchService.GetDestinationsByCodes(request.Codes);
            var response = SourcesSearchResultMapper.MapSourcesSearchResultByAtcomCodes(
                request.Codes,
                data,
                (code, document) => new DatasourceObject()
                {
                    Code = code,
                    Name = document.ItemName,
                    ItemName = document.Name,
                    Type = DestinationsMapper.MapRegionTemplateName(document.TemplateName),
                }).ToList();

            return Json(response, JsonRequestBehavior.DenyGet);
        }

        /// <summary>
        /// Get all not exist hotels codes.
        /// </summary>
        /// <param name="request">Array of codes.</param>
        /// <returns>Collection of codes in JSON format.</returns>
        [HttpPost]
        public ActionResult GetMissingCodes(BaseByCodesRequest request)
        {
            if (request.Codes == null || !request.Codes.Any())
            {
                throw new ArgumentException($"Argument {nameof(request.Codes)} cannot be null or empty");
            }

            var codes = request.Codes.Distinct().ToArray();
            var data = searchService.GetHotelsCodes(codes);
            var response = codes.Except(data);

            return Json(response, JsonRequestBehavior.DenyGet);
        }

        /// <summary>
        /// Search for Itineraries for Locations or Resorts by provided Atcom IDs.
        /// </summary>
        /// <param name="request">Array of Atcom IDs.</param>
        /// <returns>Collection of Itineraries in JSON format.</returns>
        [HttpPost]
        public ActionResult GetItineraries(BaseByCodesRequest request)
        {
            if (request.Codes == null || !request.Codes.Any())
            {
                throw new ArgumentException($"Argument {nameof(request.Codes)} cannot be null or empty");
            }

            var data = repository.SearchItinerary(request.Codes.ToList());
            var response = data.Hits.Select(x => new DestinationItinerary
            {
                Code = x.Document.Code,
                Name = x.Document.Name,
                Itineraries = x.Document.Itineraries != null ? JsonConvert.DeserializeObject<IEnumerable<Itinerary>>(x.Document.Itineraries) : null,
            });

            return Json(response, JsonRequestBehavior.DenyGet);
        }

        /// <summary>
        /// Get hotels coordinates which are under specific Item by it's code.
        /// </summary>
        /// <param name="code">Code of Parent Item.</param>
        /// <returns>Collection of HotelCoordinates in JSON format.</returns>
        [HttpGet]
        public ActionResult GetHotelsCoordinatesByParentCode(string code)
        {
            if (string.IsNullOrEmpty(code))
            {
                throw new ArgumentException($"Argument {nameof(code)} cannot be null or empty");
            }

            var response = searchService.GetHotelsCoordinatesByParentCode(code);

            return Json(response, JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Get hotels by entry in polygon borders.
        /// </summary>
        /// <param name="coordinates">Coordinates of Top Left and Bottom Right Angles of Polygon.</param>
        /// <returns>Collection of HotelCoordinates in JSON format.</returns>
        [HttpPost]
        public ActionResult GetHotelsByEntryInPolygonBorders(PolyCoordinates coordinates)
        {
            var topLeftAngle = coordinates.TopLeftAngle;
            var bottomRightAngle = coordinates.BottomRightAngle;
            if (topLeftAngle.Latitude == bottomRightAngle.Latitude || topLeftAngle.Longitude == bottomRightAngle.Longitude)
            {
                throw new ArgumentException($"Arguments {nameof(topLeftAngle)} or {nameof(bottomRightAngle)} Latitudes or Longitudes are same");
            }

            var response = searchService.GetHotelsByEntryInPolygonBorders(topLeftAngle, bottomRightAngle);

            return Json(response, JsonRequestBehavior.DenyGet);
        }

        /// <summary>
        /// Get hotels codes by search criteria.
        /// </summary>
        /// <param name="args">Search criteria.</param>
        /// <returns>Array of hotels codes.</returns>
        [HttpGet]
        public ActionResult GetHotelsCodes(HotelsCodesByDateRequest args)
        {
            var hotelsCodes = repository.GetHotelsCodes(args.Take, args.Page, args.LastUpdated);

            return UnlimitedJson(hotelsCodes, JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Get destination code by destination name.
        /// </summary>
        /// <param name="name">Name of destination.</param>
        /// <returns>Destination code in JSON format.</returns>
        [HttpGet]
        public ActionResult GetDestinationCodeByName(string name)
        {
            if (string.IsNullOrEmpty(name))
            {
                throw new ArgumentException($"Argument {nameof(name)} cannot be null or empty");
            }

            var response = repository.GetDestinationCodeByName(name);

            return Json(response, JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Get Accommodation's Resort Image Description by accommodation code.
        /// </summary>
        /// <param name="code">Accommodation's code.</param>
        /// <returns>Image, Description of resort in JSON format.</returns>
        [HttpGet]
        public ActionResult GetHotelResortInfoByHotelCode(string code)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                throw new ArgumentException($"Argument {nameof(code)} cannot be null or empty");
            }

            var response = searchService.GetHotelResortInfoByHotelCode(code);

            return Json(response, JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Get hotel highlights by accommodation code.
        /// </summary>
        /// <param name="code">Accommodation's code.</param>
        /// <returns>Hotel Highlights tiles in JSON format.</returns>
        [HttpGet]
        public ActionResult GetHotelHighlightsByHotelCode(string code)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                throw new ArgumentException($"GetHotelHighlightsByHotelCode: Argument {nameof(code)} cannot be null or empty");
            }

            var response = searchService.GetHotelHighlightsByHotelCode(code);

            return Json(response, JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Get accommodation promo facilities.
        /// </summary>
        /// <param name="code">Accommodation's code.</param>
        /// <returns>Promo facilities.</returns>
        [HttpGet]
        public ActionResult GetPromoFacilities(string code)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                throw new ArgumentException($"Argument {nameof(code)} cannot be null or empty");
            }

            var response = searchService.GetPromoFacilities(code);

            return Json(response, JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Get all destinations of promo page.
        /// </summary>
        /// <param name="promoPageId">Promo page Sitecore ID.</param>
        /// <returns>List of objects containing destination codes and types.</returns>
        [HttpGet]
        [LogExecutionTime]
        public ActionResult GetPromoPageDestinations(string promoPageId)
        {
            if (string.IsNullOrWhiteSpace(promoPageId))
            {
                throw new ArgumentException($"Argument {nameof(promoPageId)} cannot be null, empty or whitespace");
            }

            if (!ID.TryParse(promoPageId, out var promoPageSitecoreId))
            {
                throw new ArgumentException($"Argument {nameof(promoPageId)} not valid. Can't be parsed to Sitecore ID type");
            }

            var response = searchService.GetPromoPageDestinations(promoPageSitecoreId);

            return Json(response, JsonRequestBehavior.AllowGet);
        }
    }
}
