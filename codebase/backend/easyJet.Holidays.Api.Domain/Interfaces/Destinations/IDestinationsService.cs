using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.Excursions;

namespace easyJet.Holidays.Api.Domain.Interfaces.Destinations
{
    /// <summary>
    /// Destinations service
    /// </summary>
    public interface IDestinationsService
    {
        /// <summary>
        /// Search destinations by query: name contains specified filter
        /// </summary>
        /// <param name="query">Query string</param>        
        /// <param name="from">Optional value of "From" field</param>
        /// <param name="beginDate">Optional begin of displayed range in calendar</param>
        /// <param name="endDate">Optional end of displayed range in calendar</param>
        /// <returns>Filtered destinations list</returns>
        Task<DestinationsSearchResponse> Search(string query, DestinationFilter destination);

        /// <summary>
        /// Get location image by code
        /// </summary>
        /// <param name="code">Destination code</param>
        /// <returns>Location image from CMS</returns>
        Task<string> GetImage(string code);

        /// <summary>
        /// Get destination titles by codes
        /// </summary>
        /// <param name="codes">Codes</param>
        /// <returns>Destination items titles with code</returns>
        Task<DestinationItem[]> GetTitles(string[] codes);

        /// <summary>
        /// Get all destinations by airport codes
        /// </summary>
        /// <param name="codes">airport codes</param>
        /// <param name="query">query string to search destinations</param>
        /// <param name="destinationFilter">optional filter for destination types</param>
        /// <returns>destination items which contains at least one airport from proivded array</returns>
        Task<DestinationsSearchResponse> GetDestinationsByAirportCodes(string[] codes, string query, DestinationFilter? destinationFilter = null);

        /// <summary>
        /// Get destinations by their codes
        /// </summary>
        /// <param name="codes">destintaion codes, e.g. ES, ESMJ, EXNK0091</param>
        /// <param name="includeRelatedItems">Whether </param>
        /// <returns>list of destinations items</returns>
        Task<DestinationItem[]> GetDestinationsByCodes(ICollection<string> codes, bool includeRelatedItems = false);

        /// <summary>
        /// Get destination codes by codes from legacy .com site
        /// </summary>
        /// <param name="query">Query of destination codes</param>
        /// <returns>Destination items codes</returns>
        Task<DestinationsMappingResponse> Map(string query);

        /// <summary>
        /// Get destination code by name.
        /// </summary>
        /// <param name="name">Name of destination.</param>
        /// <returns>Code of destination.</returns>
        Task<string> GetDestinationCodeByName(string name);

        /// <summary>
        /// Get destinations for promo page
        /// </summary>
        /// <param name="promoPageId"></param>
        /// <returns>Array of destinations, or empty collection if no destinations were received from CMS</returns>
        Task<IEnumerable<DestinationItem>> GetPromoDestinations(string promoPageId);

        /// <summary>
        /// Get excursion maps by destination code
        /// </summary>
        /// /// <param name="destinationCode">region code (i.e. "IT" - for country, "ESMJ" - for region, "ESMJAL" - for resort)</param>
        /// <returns>Excursion map</returns>
        Task<ExcursionsMap> GetExcursionMap(string destinationCode);

        /// <summary>
        /// Get destination info by the code
        /// </summary>
        /// <param name="code">destintaion code, e.g. ES, ESMJ, EXNK0091</param>
        /// <exception cref="Common.Exceptions.ApiException">Api Exceptions.</exception>
        /// <returns>Destination info.</returns>
        Task<DestinationInfo> GetDestinationInfo(string code);
    }
}
