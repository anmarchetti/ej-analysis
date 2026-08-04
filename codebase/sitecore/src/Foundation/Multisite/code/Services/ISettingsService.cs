using System.Collections.Generic;

namespace easyJet.Foundation.Multisite.Services
{
    public interface ISettingsService
    {
        /// <summary>
        /// Gets all items under Site Settings folder
        /// returns all custom fields with values.
        /// </summary>
        /// <returns>Collection of settings.</returns>
        List<Dictionary<string, object>> GetAllSettings();

        /// <summary>
        /// Get setting field value.
        /// </summary>
        /// <param name="settingPath">Path of the setting.</param>
        /// <param name="fieldName">Name of the field.</param>
        /// <returns>String field value.</returns>
        string GetSettingField(string settingPath, string fieldName);
    }
}