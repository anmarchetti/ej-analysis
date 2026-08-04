using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.Hotels.Facilities;

namespace easyJet.Holidays.Api.Domain.Interfaces.Hotels
{
    /// <summary>
    /// Service for communicating with CMS to get rich information on destinations
    /// </summary>
    public interface IHotelsService
    {
        /// <summary>
        /// Get hotels by Atcom ids
        /// </summary>
        /// <param name="atcomIds"></param>
        /// <returns></returns>
        Task<IEnumerable<Hotel>> Search(string[] atcomIds);

        /// <summary>
        /// Get hotels by Atcom IDs for the specified language
        /// </summary>
        /// <param name="atcomIds">Atcom IDs for which to get hotels from cms</param>
        /// <param name="langCode">the code of the desired language</param>
        /// <returns></returns>
        Task<IEnumerable<Hotel>> Search(string[] atcomIds, string langCode);

        /// <summary>
        /// Get hotel information by code and concatinate requested default board to room with hotel boards and rooms
        /// </summary>
        /// <param name="atcomId">hotel id to search</param>
        /// <param name="roomCode">rooms code to search</param>
        /// <param name="boardCode">board type to search</param>
        /// <returns></returns>
        Task<Hotel> SearchWithRoomsAndBoards(string atcomId, string roomCode, string boardCode);

        /// <summary>
        /// Get hotel transfer options
        /// </summary>
        /// <param name="atcomIds"></param>
        /// <returns></returns>
        Task<IEnumerable<IEnumerable<HotelTransfer>>> GetHotelTransfers(string[] atcomIds);

        /// <summary>
        /// Search CMS for all facilities for given set of accommodations
        /// </summary>
        /// <param name="codes">array of accommodation codes</param>
        /// <returns>dictionary, where accommodation code mats into list of facilities</returns>
        Task<Dictionary<string, List<Facility>>> GetFacilitiesForAccommodations(string[] codes);

        /// <summary>
        /// Get All filters for hotels with given codes
        /// </summary>
        /// <param name="codes">accommodation codes</param>
        /// <returns></returns>
        Task<Dictionary<string, HotelFilters>> GetAllFiltersForAccommodations(string[] codes);

        /// <summary>
        /// Enrich Atcom booking response with rich data from Sitecore: 
        /// * Hotel description and images
        /// * room types descriptions and images
        /// * board types descriptions and images
        /// * Payment categories 
        /// </summary>
        /// <param name="bookingResponse"></param>
        Task EnrichBookingResponse(Data.Booking.BookingResponse bookingResponse);

        /// <summary>
        /// Get sitecore hotels based on region code
        /// </summary>
        /// <param name="code">Region code</param>
        /// <returns></returns>
        Task<List<HotelSummary>> GetHotelsSummary(string code);

        /// <summary>
        /// Get sitecore hotels based on polygon coordinates
        /// </summary>
        /// <param name="topLeftAngle">Top-left polygon angle</param>
        /// <param name="bottomRightAngle">Botton-right polygon angle</param>
        /// <returns></returns>
        Task<List<HotelSummary>> GetPolygonHotelsSummary(Point topLeftAngle, Point bottomRightAngle);

        /// <summary>
        /// Get missing hotel codes in CMS
        /// </summary>
        /// <param name="atcomIds"></param>
        /// <returns></returns>
        Task<List<string>> GetMissingCodes(IEnumerable<string> atcomIds);

        /// <summary>
        /// Get hotels ids.
        /// </summary>
        /// <returns>List of hotels ids.</returns>
        Task<string[]> GetHotelsCodes(HotelsCodesRequest args);

        /// <summary>
        /// Get hotels information by atcome code
        /// </summary>
        /// <param name="ids">IDs to search</param>
        ///<param name="langCode">the code of the desired language</param>
        /// <returns>Hotels from sitecore</returns>
        Task<IEnumerable<Hotel>> GetHotelsByCodes(string[] ids, string langCode = null);

        /// <summary>
        /// Get hotel's resort info by code.
        /// </summary>
        Task<HotelResortInfo> GetHotelResortInfoByHotelCode(string code);
        
        /// <summary>
        /// Get hotel's highlights data.
        /// </summary>
        Task<IEnumerable<HotelHighlightsData>> GetHotelHighlights(string code);

        /// <summary>
        /// Get featured facilities by hotel code.
        /// </summary>
        /// <param name="code">Hotel code.</param>
        /// <returns>Collection of featured facilities.</returns>
        Task<List<FeaturedFacility>> GetFeaturedFacilitiesByHotelCode(string code);

        /// <summary>
        /// Gets the accomodations by giata.
        /// </summary>
        /// <param name="giataCodes"></param>
        /// <param name="lang">The lang.</param>
        /// <returns>A Task.</returns>
        Task<Dictionary<string, HashSet<string>>> GetAccomodationsByGiata(IList<string> giataCodes, string lang = null);
    }
}
