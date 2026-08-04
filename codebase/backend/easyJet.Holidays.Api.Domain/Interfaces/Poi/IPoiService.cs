using easyJet.Holidays.Api.Domain.Data.DynamoDB.Poi;
using easyJet.Holidays.Api.Domain.Models.Poi;

namespace easyJet.Holidays.Api.Domain.Interfaces.Poi;

/// <summary>
/// Service abstraction providing Point of Interest (POI) data operations for a resort.
/// </summary>
public interface IPoiService
{
    /// <summary>
    /// Returns ordered POIs for a resort.
    /// </summary>
    /// <param name="resortId">Resort identifier.</param>
    /// <param name="requestedCategories">Comma separated list of categories to define ordering (optional).</param>
    /// <param name="latitude">Latitude of user (optional).</param>
    /// <param name="longitude">Longitude of user (optional).</param>
    /// <param name="airport">Airport code of the offer</param>
    /// <param name="theme">The theme of the hotel e.g. city or beach</param>
    /// <returns>Ordered collection of POI key groups.</returns>
    Task<IEnumerable<PoiByCategory>> GetPoiAsync(string resortId, string requestedCategories, double? latitude, double? longitude, 
        string airport, string theme);
}