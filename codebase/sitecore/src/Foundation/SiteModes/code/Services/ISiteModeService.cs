using easyJet.Foundation.SiteModes.Models.Domain;

namespace easyJet.Foundation.SiteModes.Services
{
    /// <summary>
    /// Service for reciving current modes.
    /// </summary>
    public interface ISiteModeService
    {
        /// <summary>
        /// Check that current mode is soft.
        /// </summary>
        /// <returns>Current mode is soft.</returns>
        bool IsSoftMode();

        /// <summary>
        /// Check that current mode is full.
        /// </summary>
        /// <returns>Current mode is full.</returns>
        bool IsFullMode();

        /// <summary>
        /// Get site modes.
        /// </summary>
        /// <returns>Site modes.</returns>
        Modes GetModes();
    }
}
