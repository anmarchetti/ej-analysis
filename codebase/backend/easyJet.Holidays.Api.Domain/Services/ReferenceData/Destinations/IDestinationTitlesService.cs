using easyJet.Holidays.Api.Domain.Data.Destinations;

namespace easyJet.Holidays.Api.Domain.Services.ReferenceData.Destinations
{
    /// <summary>
    /// Destination titles service
    /// </summary>
    public interface IDestinationTitlesService
    {
        /// <summary>
        /// Get destinatino titles using cache
        /// </summary>
        /// <param name="codes">Collection of codes</param>
        /// <param name="lang">Language</param>
        /// <returns>Collectin of destinatino items</returns>
        Task<IEnumerable<DestinationItem>> GetTitles(string[] codes, string lang);
    }
}
