using System;
using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Optimizely.Logging;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Globalization;

namespace easyJet.Foundation.Optimizely.Services
{
    [Service(typeof(IOptimizelyExperimentationGateService), Lifetime = Lifetime.Transient)]
    public class OptimizelyExperimentationGateService : IOptimizelyExperimentationGateService
    {
        private const string DefaultOptimizelySettingsPath = "/sitecore/content/EasyJet/Holidays/Settings/Optimizely Settings";
        private const string RequestCacheKeyPrefix = "Optimizely.ExperimentationEnabled";
        private readonly IOptimizelyLogger logger;
        private readonly IConsentService consentService;

        public OptimizelyExperimentationGateService(IOptimizelyLogger logger, IConsentService consentService)
        {
            this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
            this.consentService = consentService;
        }

        public bool IsEnabledForCurrentLanguage()
        {
            string requestCacheKey = null;
            try
            {
                var settingPath = GetOptimizelySettingsPath();
                if (string.IsNullOrWhiteSpace(settingPath))
                {
                    logger.Warn("Optimizely experimentation settings path is empty. Disabling experimentation.", this);
                    return false;
                }

                var database = GetContextDatabase();
                if (database == null)
                {
                    logger.Warn("Optimizely experimentation check could not resolve context database. Disabling experimentation.", this);
                    return false;
                }

                var language = GetContextLanguage();
                if (language == null)
                {
                    logger.Warn("Optimizely experimentation check could not resolve context language. Disabling experimentation.", this);
                    return false;
                }

                if (!consentService.IsPersonalizationConsentGiven())
                {
                    logger.Debug("Optimizely experimentation is disabled. Consent is not given.", this);
                    return false;
                }

                requestCacheKey = GetRequestCacheKey(settingPath, database, language);
                if (TryGetRequestCacheValue(requestCacheKey, out var cachedValue))
                {
                    return cachedValue;
                }

                var settingsItem = GetSettingsItem(database, settingPath, language);
                if (settingsItem == null || settingsItem.Versions.Count == 0)
                {
                    logger.Debug(
                        $"Optimizely experimentation setting item is missing for language '{language.Name}' at path '{settingPath}'. Disabling experimentation.",
                        this);
                    SetRequestCacheValue(requestCacheKey, false);
                    return false;
                }

                var isEnabled = MainUtil.GetBool(settingsItem[Constants.SiteSettings.IsOptimizelyExperimentationEnabled], false);
                SetRequestCacheValue(requestCacheKey, isEnabled);
                return isEnabled;
            }
            catch (Exception e)
            {
                logger.Error("Error while checking Optimizely experimentation language setting. Disabling experimentation.", e, this);
                if (!string.IsNullOrWhiteSpace(requestCacheKey))
                {
                    SetRequestCacheValue(requestCacheKey, false);
                }

                return false;
            }
        }

        protected virtual string GetOptimizelySettingsPath() => Settings.GetSetting(
            Constants.OptimizelySettings.ExperimentationSettingsPath,
            DefaultOptimizelySettingsPath);

        protected virtual Database GetContextDatabase() => Sitecore.Context.Database;

        protected virtual Language GetContextLanguage() => Sitecore.Context.Language;

        protected virtual Item GetSettingsItem(Database database, string settingPath, Language language) => database.GetItem(settingPath, language);

        protected virtual object GetRequestCacheItem(string cacheKey) => Sitecore.Context.Items[cacheKey];

        protected virtual void SetRequestCacheItem(string cacheKey, object value) => Sitecore.Context.Items[cacheKey] = value;

        private static string GetRequestCacheKey(string settingPath, Database database, Language language) => $"{RequestCacheKeyPrefix}:{database.Name}:{language.Name}:{settingPath}";

        private bool TryGetRequestCacheValue(string requestCacheKey, out bool isEnabled)
        {
            var requestCacheValue = GetRequestCacheItem(requestCacheKey);
            if (requestCacheValue is bool cached)
            {
                isEnabled = cached;
                return true;
            }

            isEnabled = false;
            return false;
        }

        private void SetRequestCacheValue(string requestCacheKey, bool isEnabled) => SetRequestCacheItem(requestCacheKey, isEnabled);
    }
}
