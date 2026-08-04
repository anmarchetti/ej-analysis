using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Multisite.Logging;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Helper;
using Sitecore;
using Sitecore.Data.Fields;
using Sitecore.Mvc.Extensions;

namespace easyJet.Foundation.Multisite.Services
{
    [Service(typeof(ISettingsService), Lifetime = Lifetime.Singleton)]
    public class SettingsService : ISettingsService
    {
        private readonly IHtmlCacheRepository cache;

        private readonly HashSet<string> excludingFields = new HashSet<string>()
        {
            Constants.Fields.BaseSetting.IsPublic,
            Constants.Fields.BaseSetting.SkipTranslate,
            Constants.Fields.BaseSetting.AutoTranslate,
            Constants.Fields.BaseSetting.LanguagesWithDisabledFallback
        };

        private readonly IMultisiteLogger logger;

        public SettingsService(IHtmlCacheRepository cache, IMultisiteLogger logger)
        {
            this.cache = cache;
            this.logger = logger;
        }

        /// <summary>
        /// Gets all items under Site Settings folder
        /// returns all custom fields with values.
        /// </summary>
        /// <returns>Collection of settings.</returns>
        public List<Dictionary<string, object>> GetAllSettings()
        {
            var cacheKey = "Multisite.Cache.SiteSettings";
            var data = cache.GetItem<List<Dictionary<string, object>>>(cacheKey);
            if (data != null)
            {
                return data;
            }

            var settingsFolder = Context.Database.SelectSingleItem($"{Context.Site.RootPath}/*[@@templateid ='{Templates.Settings.Id}']");

            if (settingsFolder?.Children == null)
            {
                return new List<Dictionary<string, object>>();
            }

            var settingsItems = new List<Dictionary<string, object>>();
            var publicSettings = settingsFolder.Axes.GetDescendants().Where(x => MainUtil.GetBool(x[Constants.Fields.BaseSetting.IsPublic], false));
            foreach (var fields in publicSettings.Select(item => item.Fields))
            {
                var fieldValuesPairs = new Dictionary<string, object>();
                fields.ReadAll();
                foreach (Field field in fields)
                {
                    // Excluding OOTB or security fields.
                    if (field.Name.StartsWith("__") || excludingFields.Contains(field.Name))
                    {
                        continue;
                    }

                    fieldValuesPairs[field.Name] = ItemFieldsHelper.GetFieldValue(field);
                }

                settingsItems.Add(fieldValuesPairs);
            }

            if (settingsItems.Any())
            {
                cache.StoreItem(cacheKey, settingsItems);
            }

            return settingsItems;
        }

        /// <summary>
        /// Get setting field value.
        /// </summary>
        /// <param name="settingPath">Path of the setting.</param>
        /// <param name="fieldName">Name of the field.</param>
        /// <returns>String field value.</returns>
        public string GetSettingField(string settingPath, string fieldName)
        {
            if (settingPath.IsWhiteSpaceOrNull() || fieldName.IsWhiteSpaceOrNull())
            {
                logger.Error($"SettingPath or fieldName parameter can't be empty or null", this);
                return null;
            }

            try
            {
                var settingItem = Context.Database?.GetItem(settingPath);
                var fieldValue = settingItem?.Fields[fieldName]?.Value;
                return fieldValue;
            }
            catch (Exception e)
            {
                logger.Error($"Error while getting field {fieldName} of the setting with path: {settingPath}", e, this);
                return null;
            }
        }
    }
}