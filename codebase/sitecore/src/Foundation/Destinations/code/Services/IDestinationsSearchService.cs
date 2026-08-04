using System.Collections.Generic;
using easyJet.Foundation.Destinations.ContentSearch.Queries;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Models;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Models.Requests;
using easyJet.Foundation.Destinations.Models.Responses;
using Sitecore.Data;
using Muzement = easyJet.Foundation.Destinations.Models.Domain.Muzement.Muzement;

namespace easyJet.Foundation.Destinations.Services
{
    public interface IDestinationsSearchService
    {
        /// <summary>
        /// Get Destinations by airport codes.
        /// </summary>
        /// <param name="args">Query args.</param>
        /// <returns>Response.</returns>
        DestinationsByAirportCodesResponse GetDestinationsByAirportCodes(DestinationByCodeQueryArgs args);

        /// <summary>
        /// Get all countries.
        /// </summary>
        /// <param name="showOnSearchPod">Show on search pod.</param>
        /// <param name="shouldGetItemsForDropdownOnly">Should get items for dropdown only.</param>
        /// <returns>Destinations search response.</returns>
        DestinationsSearchResponse GetAllCountries(bool showOnSearchPod, bool shouldGetItemsForDropdownOnly);

        /// <summary>
        /// Gets destination image URL by provided code.
        /// </summary>
        /// <param name="code">Destination code.</param>
        /// <returns>Image Url.</returns>
        string GetImage(string code);

        /// <summary>
        /// Gets hotel image URLs by provided code.
        /// </summary>
        /// <param name="code">Hotel code.</param>
        /// <returns>Image Urls.</returns>
        ImageData GetHotelImage(string code);

        /// <summary>
        /// Get hotels coordinates which are under specific Item by it's code.
        /// </summary>
        /// <param name="code">Code of Parent Item.</param>
        /// <returns>Collection of Hotel's Coordinates.</returns>
        IEnumerable<HotelCoordinates> GetHotelsCoordinatesByParentCode(string code);

        /// <summary>
        /// Get items from Solr which have Resort or Accommodation Template and code is equal to <paramref name="codes"/>.
        /// </summary>
        /// <param name="codes">Collection of Destination Code.</param>
        /// <param name="includeHotelCoordinates">Whether to include hotel coordinates or not.</param>
        /// <returns>Collection of resorts.</returns>
        IEnumerable<ResortResponse> GetResortsByCodes(string[] codes, bool includeHotelCoordinates = false);

        /// <summary>
        /// Get items from Solr witch have Resort or Accommodation Template/>.
        /// </summary>
        /// <param name="includeHotelCoordinates">Whether to include hotel coordinates or not.</param>
        /// <returns>Collection of resorts.</returns>
        IEnumerable<ResortResponse> GetResorts(bool includeHotelCoordinates = false);

        /// <summary>
        /// Get hotels by entry in polygon borders.
        /// </summary>
        /// <param name="topLeftAngle">Coordinates of Top Left Angle of Polygon.</param>
        /// <param name="bottomRightAngle">Coordinates of Bottom Right Angles of Polygon.</param>
        /// <returns>Collection of Hotel's Coordinates.</returns>
        IEnumerable<HotelCoordinates> GetHotelsByEntryInPolygonBorders(Point topLeftAngle, Point bottomRightAngle);

        /// <summary>
        /// Get accommodation resort image and description by accommodation code.
        /// </summary>
        /// <param name="code">Hotel code.</param>
        /// <returns>Image, Description of resort.</returns>
        AccommodationResortInfo GetHotelResortInfoByHotelCode(string code);

        /// <summary>
        /// Get hotel highlights info by accommodation code.
        /// </summary>
        /// <param name="code">Hotel code.</param>
        /// <returns>Hotel Highlights tiles.</returns>
        IEnumerable<HotelHighlights> GetHotelHighlightsByHotelCode(string code);

        /// <summary>
        /// Get accommodation promo facilities.
        /// </summary>
        /// <param name="code">Hotel code.</param>
        /// <returns>Promo facilities.</returns>
        IEnumerable<PromoFacility> GetPromoFacilities(string code);

        /// <summary>
        /// Get muzement data for destination.
        /// </summary>
        /// <param name="code">Destination code.</param>
        /// <returns>Muzement data.</returns>
        Muzement GetMuzement(string code);

        /// <summary>
        /// Get all destinations of promo page asynchronously.
        /// </summary>
        /// <param name="promoPageItemId">Promo page Sitecore ID.</param>
        /// <returns>List of destinations items.</returns>
        IEnumerable<ChildDestination> GetPromoPageDestinations(ID promoPageItemId);

        /// <summary>
        /// Get destinations by names.
        /// </summary>
        /// <param name="names">Collection of destination names.</param>
        /// <param name="filter">Destination filter flag.</param>
        /// <returns>Collection of destinations items.</returns>
        IEnumerable<BaseDestinationsSearchResultItem> GetDestinationsByNames(string[] names, DestinationFilter filter);

        /// <summary>
        /// Get destinations by codes.
        /// </summary>
        /// <param name="codes">Collection of destination codes.</param>
        /// <param name="includeRelatedItems">The flag indicate include relatedItems (children, parents, etc).</param>
        /// <returns>Collection of destinations items.</returns>
        IEnumerable<BaseDestinationsSearchResultItem> GetDestinationsByCodes(string[] codes, bool includeRelatedItems = true);

        /// <summary>
        /// Get destination info by code.
        /// </summary>
        /// <param name="code">Destination code.</param>
        /// <returns>Destination info.</returns>
        DestinationInfo GetDestinationInfo(string code);

        /// <summary>
        /// Gets hotels by matching GIATA codes.
        /// </summary>
        /// <param name="giataCodes">Collection of GIATA codes to match.</param>
        /// <returns>Collection of Hotels with GIATA codes matching those passed with <paramref name="giataCodes"/>.</returns>
        IEnumerable<BaseHotelSearchResultItem> GetHotelsByGiataCodes(string[] giataCodes);

        /// <summary>
        /// Get existing hotel codes.
        /// </summary>
        /// <param name="codes">Collection of hotel codes.</param>
        /// <returns>Hotel codes to process.</returns>
        string[] GetHotelsCodes(string[] codes);

        /// <summary>
        /// Get hotels by atcom codes.
        /// </summary>
        /// <param name="codes">Atcom codes.</param>
        /// <returns>Collection of hotels.</returns>
        IEnumerable<Hotel> GetHotelsByAtcomCodes(string[] codes);

        /// <summary>
        /// Search destinations by query.
        /// </summary>
        /// <param name="searchQuery">Part or whole Destination item's name.</param>
        /// <param name="showOnSearchPod">The flag shows get only Destination items with enable Show On Search Pod check-box.</param>
        /// <param name="shouldGetItemsForAutocompleteOnly">The flag shows get only Destination items with enable Show In Autocomplete check-box.</param>
        /// <param name="destinationFilter">Filter to filterQuery templates.</param>
        /// <param name="includeSearchByAirportCode">Indicates should include search by airports code.</param>
        /// <returns>Result collections of <see cref="ChildDestination"/>. </returns>
        IEnumerable<ChildDestination> SearchByName(string searchQuery, bool showOnSearchPod, bool shouldGetItemsForAutocompleteOnly, DestinationFilter destinationFilter, bool includeSearchByAirportCode);

        /// <summary>
        /// Get Expedia hotel by GIATA code.
        /// </summary>
        /// <param name="giataCode">GIATA code.</param>
        /// <returns>Hotel data.</returns>
        HotelByGiataResponse GetExpediaHotelByGiataCode(string giataCode);
    }
}
