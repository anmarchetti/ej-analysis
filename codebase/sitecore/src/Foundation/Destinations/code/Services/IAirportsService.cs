using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Services
{
    public interface IAirportsService
    {
        /// <summary>
        /// Get airports Sitecore ID values for Accommodation Item Airport field.
        /// </summary>
        /// <param name="item">Accommodation item.</param>
        /// <param name="airportCodes">AirportCodes.</param>
        /// <param name="sitePath">site path root.</param>
        /// <returns>Airport Ids.</returns>
        string GetAccommodationAirportsField(Item item, IEnumerable<string> airportCodes, string sitePath = null);

        /// <summary>
        /// Get airports name and code for generating new enum value for SP rule.
        /// </summary>
        /// <param name="codes">Airport codes.</param>
        /// <returns>List of airport name and code.</returns>
        List<Airport> GetAirportsByCountryCodes(string[] codes);
    }
}