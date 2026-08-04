using easyJet.Holidays.Api.Domain.Data.Availability;
using easyJet.Holidays.Api.Domain.Data.Common;
using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.Api.Domain.Interfaces.Availability
{
    /// <summary>
    /// Interface describing service to get routes availability and schedule
    /// </summary>
    public interface IRouteAvailabilityService
    {
        /// <summary>
        /// Get available options for "from" field based on "to" field and selected dates
        /// This information is bassed on 
        /// a) schedule provided by Atcom
        /// b) match between locations and airports from Sitecore
        /// </summary>
        /// <param name="destination">Comma separated airports list</param>
        /// <param name="flexibleDays">Number of flexible days, if null then search is not flexible.</param>
        /// <param name="beginDate">selected begin date</param>
        /// <param name="endDate">selected end date</param>
        /// <param name="duration">Stay duration (optional)</param>
        /// <param name="promoPageId">Promo page id (optional)</param>
        /// <returns>array of available airport codes</returns>
        Task<string[]> GetDepartureAvailability(string destination, int flexibleDays, DateTime? beginDate, DateTime? endDate, int? duration, string promoPageId = null);

        /// <summary>
        /// 
        /// </summary>
        /// <param name="destination">countries to check</param>
        /// <param name="from">departure airports to check</param>
        /// <param name="flexibleDays">Number of flexible days</param>
        /// <param name="beginDate">selected begin date</param>
        /// <param name="endDate">selected end date</param>
        /// <param name="duration">hokiday duration</param>
        /// <param name="promoPageId">Promo page id (optional)</param>
        /// <returns></returns>
        Task<string[]> GetDepartureAvailability(string destination, string from, int flexibleDays, DateTime beginDate, DateTime endDate, int duration, string promoPageId = null);

        /// <summary>
        /// Get availability for destinations
        /// </summary>
        /// <param name="to">Comma separated destinations list</param>
        /// <returns>Availability map</returns>
        Task<Dictionary<string, bool>> DestinationAvailabilityExists(string to);

        /// <summary>
        /// get outbound flights
        /// with departure == from
        /// if dates are not null - to be within the interval
        /// </summary>
        /// <param name="departure"></param>
        /// <param name="flexibleDays">Number of flexible days</param>
        /// <param name="beginDate">search start date</param>
        /// <param name="endDate">search end date</param>
        /// <param name="duration">hokiday duration</param>
        /// <param name="query">search query string</param>
        /// <returns>array of available destinations codes</returns>
        Task<DestinationsSearchResponse> GetDestinationAvailability(string departure, int flexibleDays, DateTime? beginDate, DateTime? endDate, int? duration, string query);

        /// <summary>
        /// Get a list of available arrival airports
        /// </summary>
        /// <param name="departure"></param>
        /// <returns></returns>
        Task<List<string>> GetArrivalAirports(string departure);

        /// <summary>
        /// Get a list of available arrival airports
        /// </summary>
        /// <param name="departure"></param>
        /// <param name="flexibleDays">Number of flexible days</param>
        /// <param name="searchBeginDate"></param>
        /// <param name="searchEndDate"></param>
        /// <param name="stayDuration"></param>
        /// <returns></returns>d
        Task<List<string>> GetArrivalAirports(string departure, int flexibleDays, DateTime searchBeginDate, DateTime searchEndDate, int? stayDuration = null);

        /// <summary>
        /// get dates with flights between given departures and destination points, within given date range
        /// </summary>
        /// <param name="departure">departure airports</param>
        /// <param name="destination">destination points</param>
        /// <param name="beginDate">time range start</param>
        /// <param name="endDate">time range end</param>
        /// <param name="selectedFromDate">selected from date</param>
        /// <param name="promoPageId">Promo page id (optional)</param>
        /// <returns></returns>
        Task<DatesAvailability> GetAvailabilityDates(string departure, string destination, DateTime? beginDate, DateTime? endDate, DateTime? selectedFromDate = null, string promoPageId = null);

        /// <summary>
        /// get months with flights between given departures and destination points, within given date range
        /// </summary>
        /// <param name="departureAirportCodes"></param>
        /// <param name="destination"></param>
        /// <param name="duration"></param>
        /// <returns></returns>
        Task<MonthsAvailabilityResponse> GetAvailabilityMonths(string departureAirportCodes, string destination, int duration);

        /// <summary>
        /// Refresh Flights Schedule data
        /// </summary>
        /// <returns></returns>
        Task RefreshCacheData();

        /// <summary>
        /// Add other routes to offers response
        /// </summary>
        /// <param name="transformed">Offers to extend</param>
        /// <returns></returns>
        Task ExtendOtherAvailableRoutes(SearchOffersResponse transformed);

        /// <summary>
        /// Get last available date in schedule
        /// </summary>
        /// <returns>Date model</returns>
        Task<AvailabilityDate> GetLastAvailableDate();
    }
}
