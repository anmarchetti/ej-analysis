using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using easyJet.Foundation.Destinations.ContentSearch.Queries;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Models;
using easyJet.Foundation.Destinations.Models.Requests;
using Sitecore.ContentSearch.Linq;
using Sitecore.Data;
using Sitecore.Globalization;

namespace easyJet.Foundation.Destinations.ContentSearch.Repositories
{
    public interface IDestinationsRepository : ISearchRepository
    {
        /// <summary>
        /// Search hotels by atcom codes.
        /// </summary>
        /// <param name="codes">Atcom codes.</param>
        /// <returns>Hotel Search Results.</returns>
        SearchResults<HotelSearchResultItem> SearchHotelsByCodes(string[] codes);

        SearchResults<HotelSyncSearchResultItem> SearchSyncHotelsByQuery(Expression<Func<HotelSyncSearchResultItem, bool>> filterQuery, Language language, List<string> atcomCodes = null);

        /// <summary>
        /// Get Hotels transfer items from Solr for specified Accommodation Ids.
        /// </summary>
        /// <param name="ids">Accommodation Ids.</param>
        /// <returns>Hotels info only with transfers.</returns>
        SearchResults<HotelSearchResultItem> SearchHotelTransfersByIds(string[] ids);

        /// <summary>
        /// Get items from Solr which have Country, Location,
        /// Resort or Accommodation Template and name contains <paramref name="name"/>.
        /// </summary>
        /// <param name="name">Part or whole Destination item's name.</param>
        /// <param name="showOnSearchPod">The flag shows that Solr get only Destination items with enable Show On Search Pod check-box.</param>
        /// <param name="shouldGetItemsForAutocompleteOnly">The flag shows that Solr get only Destination items with enable Show In Autocomplete check-box.</param>
        /// <param name="destinationFilter">Filter to filterQuery templates.</param>
        /// <param name="includeSearchByAirportCode">Indicates if needs to search destinations by airport codes.</param>
        /// <returns>Result array of <see cref="BaseDestinationsSearchResultItem"/>. </returns>
        SearchResults<BaseDestinationsSearchResultItem> SearchByName(string name, bool showOnSearchPod = false, bool shouldGetItemsForAutocompleteOnly = true, DestinationFilter destinationFilter = DestinationFilter.All, bool includeSearchByAirportCode = false);

        /// <summary>
        /// Performs a spell check on the provided search query and returns a list of suggested corrections.
        /// </summary>
        /// <param name="query">The search query to be spell-checked.</param>
        /// <param name="maximumSuggestionCount">The maximum number of suggestions to return</param>
        /// <returns>A list of suggested corrections for the provided search query.</returns>
        List<string> SpellCheck(string query, int maximumSuggestionCount);

        /// <summary>
        /// Get items by collection of names from solr.
        /// </summary>
        /// <param name="names">Whole Destination item's name.</param>
        /// <param name="destinationFilter">Filter to filterQuery templates.</param>
        /// <returns>Result array of <see cref="BaseDestinationsSearchResultItem"/>. </returns>
        SearchResults<BaseDestinationsSearchResultItem> SearchByNames(List<string> names, DestinationFilter destinationFilter = DestinationFilter.All);

        /// <summary>
        /// Get items from Solr which have Accommodation template and has codes <paramref name="ids"/>.
        /// </summary>
        /// <param name="ids">Array of atcom hotels code.</param>
        /// <returns>Result array of <see cref="HotelFacilitiesSearchResultItem"/>. </returns>
        SearchResults<HotelFacilitiesSearchResultItem> SearchHotelsFacilitiesByIds(List<string> ids);

        /// <summary>
        /// Get items from Solr which have Country Template.
        /// </summary>
        /// <param name="showOnSearchPod">The flag shows that Solr get only countries with enable Show On Search Pod check-box.</param>
        /// <param name="shouldGetItemsForDropdownOnly">The flag shows that Solr get only countries with enable Show On Dropdown check-box.</param>
        /// <returns>Result array of <see cref="BaseDestinationsSearchResultItem"/>.</returns>
        SearchResults<BaseDestinationsSearchResultItem> GetAllCountries(bool showOnSearchPod = false, bool shouldGetItemsForDropdownOnly = true);

        /// <summary>
        /// Get items from Solr witch have Country Template.
        /// </summary>
        /// <param name="codes">Collection of Airport Codes.</param>
        /// <returns>Result array of <see cref="BaseDestinationsSearchResultItem"/>.</returns>
        SearchResults<BaseDestinationsSearchResultItem> GetDestinationsByAirportCodes(string[] codes);

        /// <summary>
        /// Get items from Solr witch have Country, Location,
        /// Resort or Accommodation Template and code is equal to <paramref name="codes"/>.
        /// Looks for matches from following fields: Code, SourceCodes, GiataCode
        /// </summary>
        /// <param name="codes">Collection of Destination Code.</param>
        /// <param name="includeRelatedItems">The flag shows that Solr get relatedItems too.</param>
        /// <param name="orderByName">Specify whether to order the results by item name.</param>
        /// <returns>Result array of <see cref="BaseDestinationsSearchResultItem"/>.</returns>
        SearchResults<BaseDestinationsSearchResultItem> SearchByCodes(List<string> codes, bool includeRelatedItems = false, bool orderByName = true);

        /// <summary>
        /// Get items from Solr witch have Resort or Accommodation Template and code is equal to <paramref name="codes"/>.
        /// </summary>
        /// <param name="codes">Collection of Destination Code.</param>
        /// <param name="batchSize">batch size.</param>
        /// <returns>Result array of <see cref="HotelSearchResultItem"/>.</returns>
        IEnumerable<SearchHit<HotelSearchResultItem>> SearchHotelsByResortCodes(string[] codes, int batchSize = 1000);

        /// <summary>
        /// Get hotels codes from Solr.
        /// </summary>
        /// <param name="codes">Collection of Hotels Codes.</param>
        /// <returns>Result array of hotels codes.</returns>
        SearchResults<SourcesSearchResultItem> GetAllExistHotelsCodes(string[] codes);

        /// <summary>
        /// Get all hotel codes from Solr.
        /// </summary>
        /// <returns>Collection of hotel codes.</returns>
        SearchResults<SourcesSearchResultItem> GetAllExistHotelsCodes();

        SearchResults<HotelSyncSearchResultItem> GetHotels(string startPath = "", int page = 1, int take = 0, bool shouldGetFirstVersion = false, bool orderByName = true);

        /// <summary>
        /// Get hotel data with reviews.
        /// </summary>
        /// <param name="startPath">Parent start path.</param>
        /// <param name="page">Page.</param>
        /// <param name="take">Amount.</param>
        /// <returns>Collection of hotel data with reviews.</returns>
        SearchResults<HotelWithReviewSearchResultItem> GetHotelsWithReviews(string startPath, int page = 1, int take = 0);

        /// <summary>
        /// GetAllHotels using batches.
        /// </summary>
        /// <param name="startPath"> Requires a startingpath.</param>
        /// <param name="batchSize">chunksize for internal processing.</param>
        /// <param name="shouldGetFirstVersion">shouldGetFirstVersion.</param>
        /// <param name="orderByName">orderByName.</param>
        /// <returns>List of hotels.</returns>
        IEnumerable<SearchHit<HotelSyncSearchResultItem>> GetAllHotels(string startPath = "", int batchSize = 1000, bool shouldGetFirstVersion = false, bool orderByName = true);

        /// <summary>
        /// Compose and get Giata to Accommodation codes Mapping based on Solr search.
        /// </summary>
        /// <returns>Collection of hotel codes.</returns>
        SearchResults<HotelSearchResultItem> GetGiataToAccommodationCodesMapping(List<string> codes);

        /// <summary>
        /// Get items from Solr witch have Resort or Location Template and code is equal to <paramref name="codes"/>.
        /// </summary>
        /// <param name="codes">Collection of Destination Code.</param>
        /// <returns>Result array of <see cref="ItinerarySearchResultItem"/>.</returns>
        SearchResults<ItinerarySearchResultItem> SearchItinerary(List<string> codes);

        /// <summary>
        /// Get destinations by airport codes.
        /// </summary>
        /// <param name="args">Query args.</param>
        /// <returns>Collection of destinations.</returns>
        SearchResults<DestinationSearchResultItem> GetDestinationsByAirportCodes(DestinationByCodeQueryArgs args);

        /// <summary>
        /// Get parent of hotel.
        /// </summary>
        /// <param name="code">Code of hotel.</param>
        /// <returns>Return parent of hotel.</returns>
        ID GetParentByHotelsCode(string code);

        /// <summary>
        /// Get hotels Parent Item which has code supplied as parameter.
        /// </summary>
        /// <param name="code">Code of Parent Item.</param>
        /// <returns>ID of parent Item.</returns>
        BaseDatasourceSearchResultItem GetDestinationItemByCode(string code);

        /// <summary>
        /// Get hotels coordinates from Solr that are under Item which IDs are supplied as parameter and have Accomodation Template.
        /// </summary>
        /// <param name="hotelsParentItemIds">Collection of IDs of hotels' parent item.</param>
        /// <returns>Result array of <see cref="HotelSearchResultItem"/>.</returns>
        SearchResults<HotelSearchResultItem> GetHotelsCoordinatesByHotelsParentsPath(ID[] hotelsParentItemIds);

        /// <summary>
        /// Get hotels which coordinates are inside supplied polygon top left and bottom right angles.
        /// </summary>
        /// <param name="topLeftAngle">Top Left Angle of polygon.</param>
        /// <param name="bottomRightAngle">Bottom Right Angle of polygon.</param>
        /// <returns>Result array of <see cref="HotelSearchResultItem"/>.</returns>
        SearchResults<HotelSearchResultItem> GetHotelsInsideCoordinateGrid(Point topLeftAngle, Point bottomRightAngle);

        /// <summary>
        /// Get hotels codes which updated or created date is more than specified date or all codes.
        /// </summary>
        /// <param name="take">Number of codes to take.</param>
        /// <param name="page">Start position to take codes from.</param>
        /// <param name="lastUpdated">Date to take codes from hotels updated after.</param>
        /// <returns>Result array of hotel codes.</returns>
        IEnumerable<string> GetHotelsCodes(int take, int page, DateTime? lastUpdated);

        /// <summary>
        /// Get destination code by destination name.
        /// </summary>
        /// <param name="name">Display name of destination.</param>
        /// <returns>Destination code.</returns>
        string GetDestinationCodeByName(string name);

        /// <summary>
        /// Get Accomodation's Resort Image Description by accomodation code.
        /// </summary>
        /// <param name="code">Accomodation's code.</param>
        /// <returns>Image, Description of accomodation's resort.</returns>
        HotelResortSearchResultItem GetAccommodationResortInfoByAccommodationCode(string code);

        /// <summary>
        /// Get hotel highlights info by accommodation code.
        /// </summary>
        /// <param name="code">Hotel code.</param>
        /// <returns>Hotel Highlights tiles.</returns>
        HotelHighlightsSearchResultItem GetHotelHighlightsByAccommodationCode(string code);

        /// <summary>
        /// Get accommodation promo facilities.
        /// </summary>
        /// <param name="hotelCode">Hotel code.</param>
        /// <returns>Promo facilities search result item.</returns>
        PromoFacilitiesSearchResultItem GetPromoFacilities(string hotelCode);

        /// <summary>
        /// Get destinations by Hotel code or GIATA code.
        /// </summary>
        /// <param name="hotelCodes">Collection of Hotel codes.</param>
        /// <param name="giataCodes">Collection of GIATA codes.</param>
        /// <param name="forceIndexName">Name of index where search should look. Leave empty if default index should be used.</param>
        /// <returns>Collection of destinations.</returns>
        SearchResults<DestinationSearchResultItem> GetDestinationsByCodes(List<string> hotelCodes, List<string> giataCodes, string forceIndexName = null);

        /// <summary>
        /// Gets Hotels by GIATA code.
        /// </summary>
        /// <param name="giataCodes">Collection of GIATA codes to match.</param>
        /// <returns>Collection of Hotels with GIATA codes matching those passed with <paramref name="giataCodes"/>.</returns>
        SearchResults<BaseHotelSearchResultItem> GetHotelsByGiataCodes(List<string> giataCodes);

        /// <summary>
        /// Gets all regions.
        /// </summary>
        /// <returns>Returns all hits for regions.</returns>
        SearchResults<BaseDatasourceSearchResultItem> GetAllRegions();
    }
}