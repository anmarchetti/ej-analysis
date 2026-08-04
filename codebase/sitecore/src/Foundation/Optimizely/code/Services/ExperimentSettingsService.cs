using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Multisite.Services;
using easyJet.Foundation.Optimizely.Logging;
using Newtonsoft.Json;

namespace easyJet.Foundation.Optimizely.Services
{
    [Service(typeof(IExperimentSettingsService), Lifetime = Lifetime.Transient)]
    public class ExperimentSettingsService : IExperimentSettingsService
    {
        private readonly ISettingsService settingsService;
        private readonly IOptimizelyService optimizelyService;
        private readonly IOptimizelyDecisionContext optimizelyDecisionContext;
        private readonly IOptimizelyExperimentationGateService experimentationGateService;
        private readonly IOptimizelyLogger logger;

        public ExperimentSettingsService(
            ISettingsService settingsService,
            IOptimizelyService optimizelyService,
            IOptimizelyDecisionContext optimizelyDecisionContext,
            IOptimizelyExperimentationGateService experimentationGateService,
            IOptimizelyLogger logger)
        {
            this.settingsService = settingsService ?? throw new ArgumentNullException(nameof(settingsService));
            this.optimizelyService = optimizelyService ?? throw new ArgumentNullException(nameof(optimizelyService));
            this.optimizelyDecisionContext = optimizelyDecisionContext ?? throw new ArgumentNullException(nameof(optimizelyDecisionContext));
            this.experimentationGateService = experimentationGateService ?? throw new ArgumentNullException(nameof(experimentationGateService));
            this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Gets all site settings with Optimizely experiment overrides applied.
        /// </summary>
        /// <returns>Collection of settings with experiment values merged in.</returns>
        public List<Dictionary<string, object>> GetAllSettingsWithExperiments()
        {
            var settings = settingsService.GetAllSettings();

            if (settings == null || !settings.Any())
            {
                return settings ?? new List<Dictionary<string, object>>();
            }

            if (!experimentationGateService.IsEnabledForCurrentLanguage())
            {
                logger.Debug("Optimizely experimentation is disabled for current language. Returning base settings.", this);
                return settings;
            }

            var experimentFlags = GetExperimentFlags(settings);
            if (experimentFlags == null || experimentFlags.Length == 0)
            {
                return settings;
            }

            var decisions = optimizelyService.Decide(experimentFlags);
            var hasEnabledDecisions = decisions != null && decisions.Any(x => x.Value.Enabled);
            var settingsWithExperimentValues = hasEnabledDecisions ? ApplyExperimentDecisions(settings, decisions) : settings;
            return AttachOptimizelyDetails(settingsWithExperimentValues, cloneBeforeMutate: !hasEnabledDecisions);
        }

        private List<Dictionary<string, object>> AttachOptimizelyDetails(List<Dictionary<string, object>> settings, bool cloneBeforeMutate)
        {
            var decisionDetails = optimizelyDecisionContext.GetAll()?.ToList();
            if (decisionDetails == null || !decisionDetails.Any())
            {
                return settings;
            }

            var responseSettings = cloneBeforeMutate
                ? settings.Select(dict => new Dictionary<string, object>(dict)).ToList()
                : settings;

            if (!responseSettings.Any())
            {
                return responseSettings;
            }

            var targetSetting = responseSettings.FirstOrDefault(setting => setting.ContainsKey(Constants.SiteSettings.SiteSettingsExperimentsKey)) ?? responseSettings[0];
            targetSetting[Constants.SiteSettings.OptimizelyDecisionsKey] = JsonConvert.SerializeObject(decisionDetails);
            targetSetting[Constants.SiteSettings.OptimizelyUserIdKey] = optimizelyDecisionContext.GetUserId();
            targetSetting[Constants.SiteSettings.OptimizelyUserAttributesKey] = JsonConvert.SerializeObject(optimizelyDecisionContext.GetUserAttributes() ?? new Dictionary<string, object>());

            return responseSettings;
        }

        /// <summary>
        /// Extracts experiment flag keys from settings.
        /// </summary>
        /// <param name="settings">The settings collection.</param>
        /// <returns>Array of distinct flag keys, or an empty array if not found.</returns>
        private string[] GetExperimentFlags(List<Dictionary<string, object>> settings)
        {
            var experimentsSetting = settings
                .FirstOrDefault(x => x.ContainsKey(Constants.SiteSettings.SiteSettingsExperimentsKey));

            if (experimentsSetting == null)
            {
                return Array.Empty<string>();
            }

            var experimentsValue = experimentsSetting[Constants.SiteSettings.SiteSettingsExperimentsKey] as string;

            if (string.IsNullOrWhiteSpace(experimentsValue))
            {
                return Array.Empty<string>();
            }

            var flags = experimentsValue
                .Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(x => x.Trim())
                .Where(x => !string.IsNullOrEmpty(x))
                .Distinct()
                .ToArray();

            if (flags.Length == 0)
            {
                return Array.Empty<string>();
            }

            logger.Debug($"Found {flags.Length} experiment flag(s) to evaluate: {string.Join(", ", flags)}", this);

            return flags;
        }

        /// <summary>
        /// Applies enabled experiment decisions to a cloned copy of settings.
        /// </summary>
        /// <param name="settings">The original settings collection.</param>
        /// <param name="decisions">The Optimizely decisions.</param>
        /// <returns>A new settings collection with experiment values applied.</returns>
        private List<Dictionary<string, object>> ApplyExperimentDecisions(
            List<Dictionary<string, object>> settings,
            Dictionary<string, (bool Enabled, string Variation, IDictionary<string, object> Variables)> decisions)
        {
            // Clone the settings to avoid modifying the cached original
            var experimentedSettings = settings
                .Select(dict => new Dictionary<string, object>(dict))
                .ToList();

            var enabledDecisions = decisions
                .Where(x => x.Value.Enabled && x.Value.Variables != null)
                .ToList();

            if (!enabledDecisions.Any())
            {
                return experimentedSettings;
            }

            var appliedCount = 0;

            foreach (var decision in enabledDecisions)
            {
                foreach (var variable in decision.Value.Variables)
                {
                    var existingSetting = experimentedSettings
                        .FirstOrDefault(x => x.ContainsKey(variable.Key));

                    if (existingSetting != null)
                    {
                        existingSetting[variable.Key] = variable.Value;
                        appliedCount++;
                    }
                }
            }

            if (appliedCount > 0)
            {
                logger.Debug($"Applied {appliedCount} experiment variable(s) to settings", this);
            }

            return experimentedSettings;
        }
    }
}