using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using easyJet.Feature.ChangeTracking.Models;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using Sitecore.Abstractions;
using Sitecore.Data;

namespace easyJet.Feature.ChangeTracking.Services
{
    [ExcludeFromCodeCoverage]
    [Service(typeof(IChangeTrackingSettingsService), Lifetime = Lifetime.Transient)]
    public class ChangeTrackingSettingsService : IChangeTrackingSettingsService
    {
        private const string CacheIndex = nameof(ChangeTrackingSettingsService);
        private readonly BaseSettings settingsService;

        public ChangeTrackingSettingsService(BaseSettings settingsService)
        {
            this.settingsService = settingsService;
        }

        public ChangeTrackingSettings GetSettings()
        {
            if (Sitecore.Context.Items[CacheIndex] != null)
            {
                return (ChangeTrackingSettings)Sitecore.Context.Items[CacheIndex];
            }

            var settingsPath = settingsService.GetSetting(Constants.SettingsPathSettingName);
            var settingsItem = Database.GetDatabase("master").GetItem(settingsPath);
            if (settingsItem == null)
            {
                return new ChangeTrackingSettings
                {
                    IsEnabled = false,
                    Templates = new HashSet<ID>()
                };
            }

            var templateValues = settingsItem.Fields[Constants.Fields.ChangeTrackingTemplates]?.Value ?? string.Empty;
            var templates = string.IsNullOrEmpty(templateValues)
                ? new HashSet<ID>()
                : new HashSet<ID>(templateValues.Split("|".ToCharArray(), StringSplitOptions.RemoveEmptyEntries).Select(ID.Parse));

            var excludedFieldValues = settingsItem.Fields[Constants.Fields.ChangeTrackingExcludedFields]?.Value ?? string.Empty;
            var excludedFields = string.IsNullOrEmpty(excludedFieldValues)
                ? new HashSet<ID>()
                : new HashSet<ID>(new HashSet<ID>(excludedFieldValues.Split("|".ToCharArray(), StringSplitOptions.RemoveEmptyEntries).Select(ID.Parse)));
            Sitecore.Data.Fields.CheckboxField checkboxField = settingsItem.Fields[Constants.Fields.ChangeTrackingIsEnabled];

            var settings = new ChangeTrackingSettings
            {
                IsEnabled = checkboxField == null || checkboxField.Checked,
                Templates = templates,
                ExcludedFields = excludedFields
            };

            Sitecore.Context.Items[CacheIndex] = settings;
            return (ChangeTrackingSettings)Sitecore.Context.Items[CacheIndex];
        }
    }
}