using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using easyJet.Foundation.BeCause.Settings;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Abstractions;
using Sitecore.Data.Fields;

namespace easyJet.Foundation.BeCause.Services
{
    [ExcludeFromCodeCoverage]
    [Service(typeof(ISettingsService), Lifetime = Lifetime.Transient)]
    public class SettingsService : ISettingsService
    {
        private const string CacheIndex = nameof(BeCauseSettings);
        private readonly BaseSettings baseSettings;
        private readonly IDatabaseProvider databaseProvider;
        private readonly bool useCaching;

        public SettingsService(BaseSettings baseSettings, IDatabaseProvider databaseProvider, bool useCaching = true)
        {
            this.baseSettings = baseSettings;
            this.databaseProvider = databaseProvider;
            this.useCaching = useCaching;
        }

        public BeCauseSettings GetSettings()
        {
            if (useCaching && Sitecore.Context.Items[CacheIndex] != null)
            {
                return (BeCauseSettings)Sitecore.Context.Items[CacheIndex];
            }

            var settingsPath = baseSettings.GetSetting(Constants.SettingsPathSettingName);
            var settingsItem = databaseProvider.GetItem(settingsPath, DatabaseType.Master);
            if (settingsItem == null)
            {
                return new BeCauseSettings
                {
                    IsEnabled = false,
                    Certificates = new HashSet<string>()
                };
            }

            var certificateValues = settingsItem.Fields[Constants.FieldNames.Certificates]?.Value ?? string.Empty;
            var certificates = string.IsNullOrEmpty(certificateValues)
                ? new HashSet<string>()
                : new HashSet<string>(certificateValues.Split(new string[] { Environment.NewLine, "|", ",", ";" }, StringSplitOptions.RemoveEmptyEntries).Select(c => c.Trim()));

            var fieldNamesValues = settingsItem.Fields[Constants.FieldNames.SelectedResultFieldNames]?.Value ?? string.Empty;
            var fieldNames = string.IsNullOrEmpty(fieldNamesValues)
                ? new HashSet<string>()
                : new HashSet<string>(fieldNamesValues.Split(new[] { Environment.NewLine, "|", ",", ";" }, StringSplitOptions.RemoveEmptyEntries).Select(c => c.Trim()));

            var isEnabled = ((CheckboxField)settingsItem.Fields[Constants.FieldNames.IsEnabled])?.Checked ?? false;
            var isEnabledInConfig = baseSettings.GetBoolSetting(Constants.BecauseEnabledSettingName, false);

            var settings = new BeCauseSettings
            {
                IsEnabled = isEnabled && isEnabledInConfig,
                Certificates = certificates,
                SelectedResultFieldNames = fieldNames,
                Endpoint = baseSettings.GetSetting(Constants.EndpointSettingName),
                CustomIdentifierId = baseSettings.GetSetting(Constants.CustomIdentifierIdSettingsName),
                CertificationTags = baseSettings.GetSetting(Constants.CertificationTagsSettingsName).Split(new[] { "|", ",", ";" }, StringSplitOptions.RemoveEmptyEntries)
            };

            if (!useCaching)
            {
                return settings;
            }

            Sitecore.Context.Items[CacheIndex] = settings;
            return (BeCauseSettings)Sitecore.Context.Items[CacheIndex];
        }
    }
}