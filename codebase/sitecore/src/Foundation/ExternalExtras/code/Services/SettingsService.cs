using System.Collections;
using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.ExternalExtras.Models;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Abstractions;
using Sitecore.Data;

namespace easyJet.Foundation.ExternalExtras.Services
{
    [Service(typeof(ISettingsService), Lifetime = Lifetime.Transient)]
    public class SettingsService : ISettingsService
    {
        private const string CacheIndex = nameof(SettingsService);
        private readonly BaseSettings settingsService;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IItemsContextProvider itemsContextProvider;

        public SettingsService(BaseSettings settingsService, IDatabaseProvider databaseProvider, IItemsContextProvider itemsContextProvider)
        {
            this.settingsService = settingsService;
            this.databaseProvider = databaseProvider;
            this.itemsContextProvider = itemsContextProvider;
        }

        public ExternalExtrasSettings GetSettings()
        {
            var cachedEntry = itemsContextProvider.GetItem<ExternalExtrasSettings>(CacheIndex);
            if (cachedEntry != null)
            {
                return cachedEntry;
            }

            var settingsPath = settingsService.GetSetting(Constants.SettingsPathSettingName);
            var settingsItem = databaseProvider.GetItem(settingsPath, DatabaseType.Master);
            if (settingsItem == null)
            {
                return new ExternalExtrasSettings
                {
                    IsEnabled = false,
                    IsPublic = false,
                };
            }

            Sitecore.Data.Fields.CheckboxField checkboxField = settingsItem.Fields[Constants.FieldNames.IsEnabled];
            Sitecore.Data.Fields.CheckboxField isPublicCheckboxField = settingsItem.Fields[Multisite.Constants.Fields.BaseSetting.IsPublic];

            var settings = new ExternalExtrasSettings
            {
                IsEnabled = checkboxField == null || checkboxField.Checked,
                IsPublic = isPublicCheckboxField == null || isPublicCheckboxField.Checked,
            };
            itemsContextProvider.SetItem(CacheIndex, settings);
            return settings;
        }
    }
}