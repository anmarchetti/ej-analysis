using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Feature.ScrappingTrigger.Settings;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Globalization;

namespace easyJet.Feature.ScrappingTrigger.Services
{
    [Service(typeof(IScrapingTriggerSettingsService), Lifetime = Lifetime.Transient)]
    public class ScrapingTriggerSettingsService : IScrapingTriggerSettingsService
    {
        private readonly BaseSettings settingsService;
        private readonly IDatabaseProvider databaseProvider;

        public ScrapingTriggerSettingsService(BaseSettings settingsService, IDatabaseProvider databaseProvider)
        {
            this.settingsService = settingsService;
            this.databaseProvider = databaseProvider;
        }

        public ScrapingTriggerSettings GetSettings()
        {
            var settingsPath = settingsService.GetSetting(Constants.ScrapingTriggerSettingsPathName);
            var settingsItem = databaseProvider.GetItem(settingsPath, DatabaseType.Master);
            if (settingsItem == null)
            {
                return new ScrapingTriggerSettings
                {
                    IsEnabled = false,
                    Templates = new HashSet<ID>(),
                    QueueArn = null,
                    SupportedLanguage = null
                };
            }

            var templateValues = settingsItem.Fields[Constants.Fields.ScrapingTriggerEnabledTemplates]?.Value ?? string.Empty;
            var templates = string.IsNullOrEmpty(templateValues)
                ? new HashSet<ID>()
                : new HashSet<ID>(templateValues.Split("|".ToCharArray(), StringSplitOptions.RemoveEmptyEntries).Select(ID.Parse));

            var languageValue = settingsService.GetSetting(Constants.ScrapingTriggerSettingsSupportedLanguage);
            var supportedLanguage = !Language.TryParse(languageValue, out var language)
                ? Language.Parse("en")
                : language;

            var isEnabled = ((CheckboxField)settingsItem.Fields[Constants.Fields.ScrapingTriggerIsEnabled])?.Checked ?? false;
            var isEnabledInConfig = settingsService.GetBoolSetting(Constants.ScrapingTriggerEnabled, false);

            return new ScrapingTriggerSettings
            {
                QueueArn = settingsService.GetSetting(Constants.ScrapingTriggerSettingsQueueArn),
                ProfileArn = settingsService.GetSetting(Constants.ScrapingTriggerSettingsProfileArn),
                SessionName = settingsService.GetSetting(Constants.ScrapingTriggerSettingsSessionName),
                SessionDuration = settingsService.GetIntSetting(Constants.ScrapingTriggerSettingsSessionDuration, Foundation.AmazonSecurityToken.Constants.DefaultSessionDuration),
                VpcEndpoint = settingsService.GetSetting(Foundation.AmazonSqs.Constants.VpcEndpoint),
                SupportedRootPath = settingsService.GetSetting(Constants.ScrapingTriggerSettingsSupportedRootPath),
                BaseUrl = settingsService.GetSetting(Constants.ScrapingTriggerBaseUrl),
                MessagesPerBatch = settingsService.GetIntSetting(Constants.ScrapingTriggerMessagesPerBatch, Foundation.AmazonSqs.Constants.MaxNumberOfMessagesPerBatch),
                SupportedLanguage = supportedLanguage,
                Templates = templates,
                IsEnabled = isEnabled && isEnabledInConfig
            };
        }
    }
}
