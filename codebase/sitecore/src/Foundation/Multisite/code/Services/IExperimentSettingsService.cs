using System.Collections.Generic;

namespace easyJet.Foundation.Multisite.Services
{
    public interface IExperimentSettingsService
    {
        /// <summary>
        /// Gets all site settings with Optimizely experiment overrides applied.
        /// </summary>
        /// <returns>Collection of settings with experiment values merged in.</returns>
        List<Dictionary<string, object>> GetAllSettingsWithExperiments();
    }
}
