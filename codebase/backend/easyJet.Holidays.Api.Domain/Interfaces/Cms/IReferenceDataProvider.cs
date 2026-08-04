using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.Filters;
using easyJet.Holidays.Api.Domain.Data.Hotels.Facilities;
using easyJet.Holidays.Api.Domain.Data.LivePrice;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Data.ReferenceData.Luggage;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.Themes;
using easyJet.Holidays.Api.Domain.Data.Transfers;
using Airport = easyJet.Holidays.Api.Domain.Data.ReferenceData.Airport;
using BoardType = easyJet.Holidays.Api.Domain.Data.ReferenceData.BoardType;
using Country = easyJet.Holidays.Api.Domain.Data.ReferenceData.Country;
using RoomType = easyJet.Holidays.Api.Domain.Data.ReferenceData.RoomType;

namespace easyJet.Holidays.Api.Domain.Interfaces.Cms
{
    /// <summary>
    /// Reference data provider from CMS
    /// </summary>
    public interface IReferenceDataProvider
    {
        /// <summary>
        /// Collection of all available aiports with localized name
        /// </summary>
        /// <param name="language">Language</param>
        /// <returns>Collection of aiports</returns>
        Task<List<Airport>> GetAirports(string language);

        /// <summary>
        /// Get collection of countries
        /// </summary>
        /// <param name="language">Language</param>
        /// <returns></returns>
        Task<List<Country>> GetCountries(string language);

        /// <summary>
        /// Get dialing codes collection
        /// </summary>
        /// <param name="language">Language</param>
        /// <returns></returns>
        Task<List<DialingCode>> GetDialingCodes(string language);

        /// <summary>
        /// Get board types collection
        /// </summary>
        /// <param name="language">Language</param>
        /// <returns></returns>
        Task<List<BoardType>> GetBoardTypes(string language);

        /// <summary>
        /// Get room types collection
        /// </summary>
        /// <returns></returns>
        Task<List<RoomType>> GetRoomTypes();

        /// <summary>
        /// Get room type by code
        /// </summary>
        /// <param name="code"></param>
        /// <returns></returns>
        Task<RoomType> GetRoomType(string code);

        /// <summary>
        /// Get all transfer options
        /// </summary>
        /// <param name="language">Language</param>
        /// <returns></returns>
        Task<List<Data.Hotels.HotelTransfer>> GetAllTransfers(string language);

        /// <summary>
        /// Collection of facilities available for filtering
        /// </summary>
        /// <param name="language">Language</param>
        /// <returns></returns>
        Task<List<FilteredFacility>> GetFilterFacilities(string language);

        /// <summary>
        /// Get sitecore settings
        /// </summary>
        /// <typeparam name="T">Return type</typeparam>
        /// <param name="setting">Setting to get</param>
        /// <param name="withChildren">Sitecore setting with children.</param>
        /// <param name="language">Sitecore language.</param>
        /// <returns></returns>
        Task<T> GetSitecoreSetting<T>(SitecoreSettings setting, string language, bool withChildren = false);

        /// <summary>
        /// Get package themes from sitecore
        /// </summary>
        /// <param name="language">Language</param>
        /// <returns></returns>
        Task<List<PackageTheme>> GetThemes(string language);

        /// <summary>
        /// Get transfer instructions by product id
        /// </summary>
        /// <param name="productId">Product id</param>
        /// <returns>Transfer instructions</returns>
        Task<TransferInfo> GetTransferInfoByProductId(string productId, string languageCode);

        /// <summary>
        /// Gets all transfers as a dictionary mapping ProductId to Duration.
        /// </summary>
        /// <returns>Dictionary with ProductId as key and Duration as value.</returns>
        Task<Dictionary<string, int>> GetAllTransferDurations();

        /// <summary>
        /// Get special requests from sitecore
        /// </summary>
        /// <param name="language">Language</param>
        /// <returns></returns>
        Task<SpecialRequests> GetAllSpecialRequests(string language);

        /// <summary>
        /// Search for all destinations (with child items)
        /// </summary>
        /// <param name="showOnSearchPodOnly">Whether include items that should be hiden from search pod</param>
        /// <param name="language">Language</param>
        /// <returns></returns>
        Task<List<DestinationItem>> GetAllDestinations(bool showOnSearchPodOnly, string language);

        /// <summary>
        /// Get flight filters for hotels
        /// </summary>
        /// <param name="language">Language</param>
        /// <returns>list of available flight filters (with time slots inside) from Sitecore</returns>
        Task<List<FlightFilters>> GetFlightFilters(string language);

        /// <summary>
        /// Get all hotel codes
        /// </summary>
        /// <returns>Collection of hotel codes</returns>
        Task<List<string>> GetAllHotelCodes(string language);

        /// <summary>
        /// Get Offer filters for hotels
        /// </summary>
        /// <param name="language">Language</param>
        /// <returns></returns>
        Task<OfferFilterOptions> GetOfferFilters(string language);

        /// <summary>
        /// Get filter pills configuration.
        /// </summary>
        /// <param name="language">Language</param>
        /// <returns>Filter pills configuration.</returns>
        Task<FilterPillsConfig> GetFilterPillsConfig(string language);

        /// <summary>
        /// Get luggage information from sitecore
        /// </summary>
        /// <param name="language">Language</param>
        /// <returns></returns>
        Task<Luggage> GetLuggage(string language);

        /// <summary>
        /// Get mapping Accommodation code to giata code mapping from sitecore
        /// </summary>
        /// <param name="language">Language</param>
        /// <param name="accommodatonCodes">atcom codes</param>
        /// <returns>AccommodationCode -> GiataCode</returns>
        Task<Dictionary<string, string>> GetAccommodationToGiataMappings(string language, IEnumerable<string> accommodatonCodes);

        /// <summary>
        /// Get live price searches for market
        /// </summary>
        /// <param name="marketCode"></param>
        /// <returns></returns>
        Task<List<LivePriceSearch>> GetLivePriceSearches(string marketCode);

        /// <summary>
        /// Gets Facility Matrix Filter Display Configuration.
        /// </summary>
        /// <param name="language">Language</param>
        /// <returns>Facility Matrix Filter Display Configuration.</returns>
        Task<List<HotelTypeFilterConfiguration>> GetFacilityMatrixConfiguration(string language);
        
        /// <summary>
        /// Gets Offer Filters Reordering Configuration.
        /// </summary>
        /// <param name="language">Language.</param>
        /// <returns></returns>
        Task<OfferFiltersReorderingConfiguration> GetOfferFiltersReorderingConfiguration(string language);
    }
}
