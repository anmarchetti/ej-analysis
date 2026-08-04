using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Optimizely.Factory;
using easyJet.Foundation.Optimizely.Logging;
using easyJet.Foundation.Optimizely.Models;
using OptimizelySDK;
using OptimizelySDK.OptimizelyDecisions;

namespace easyJet.Foundation.Optimizely.Services
{
    /// <summary>
    /// Central Optimizely integration service used by rules, rendering processors and settings evaluation.
    /// Evaluates flags and records each decision into request-scoped context for Layout Service payloads.
    /// </summary>
    [Service(typeof(IOptimizelyService), Lifetime = Lifetime.Transient)]
    public class OptimizelyService : IOptimizelyService
    {
        // Evaluate only enabled flags and suppress decision events for backend layout evaluation.
        private static readonly OptimizelyDecideOption[] DefaultOptions =
        {
            OptimizelyDecideOption.ENABLED_FLAGS_ONLY,
            OptimizelyDecideOption.DISABLE_DECISION_EVENT
        };

        private readonly IOptimizely optly;
        private readonly IOptimizelyUserContextFactory ucf;
        private readonly IOptimizelyDecisionContext decisionContext;
        private readonly IOptimizelyExperimentationGateService experimentationGateService;
        private readonly IOptimizelyLogger logger;

        public OptimizelyService(
            IOptimizely o,
            IOptimizelyUserContextFactory f,
            IOptimizelyDecisionContext decisionContext,
            IOptimizelyExperimentationGateService experimentationGateService,
            IOptimizelyLogger logger)
        {
            optly = o;
            ucf = f;
            this.decisionContext = decisionContext;
            this.experimentationGateService = experimentationGateService;
            this.logger = logger;
        }

        public (bool, string, IDictionary<string, object>) Decide(string flagKey) =>
            Decide(flagKey, OptimizelyDecisionSource.Default);

        public (bool, string, IDictionary<string, object>) Decide(string flagKey, OptimizelyDecisionSource source)
        {
            if (string.IsNullOrWhiteSpace(flagKey))
            {
                return (false, null, new Dictionary<string, object>());
            }

            // Normalize once so SDK calls and context storage use identical keys.
            var normalizedFlagKey = flagKey.Trim();
            var userAttributes = GetUserAttributes();

            if (!IsExperimentationEnabled())
            {
                return (false, null, new Dictionary<string, object>());
            }

            decisionContext?.SetUserContext(ucf.GetUserId(), userAttributes);

            try
            {
                if (ucf.TryCreateUserContext(optly, out var userContext, out var userId))
                {
                    var d = userContext.Decide(normalizedFlagKey, DefaultOptions);

                    if (d == null)
                    {
                        decisionContext?.SetUserContext(userId, userAttributes);
                        TryStoreDecision(normalizedFlagKey, null, null, isDisabled: true, source: source);
                        return (false, null, new Dictionary<string, object>());
                    }

                    if (string.IsNullOrEmpty(d.VariationKey))
                    {
                        logger.Warn("Optimizely - decision error: " + string.Join(" ", d.Reasons ?? Array.Empty<string>()), this);
                    }

                    decisionContext?.SetUserContext(userId, userAttributes);
                    // Store every decision in request context for layout payload consumers.
                    TryStoreDecision(normalizedFlagKey, d.VariationKey, d.RuleKey, isDisabled: !d.Enabled, source: source);
                    return (d.Enabled, d.VariationKey, d.Variables?.ToDictionary() ?? new Dictionary<string, object>());
                }
            }
            catch (Exception e)
            {
                logger.Error($"Optimizely - decision failure for {normalizedFlagKey}", e, this);
                TryStoreDecision(normalizedFlagKey, null, null, isDisabled: true, source: source);
                return (false, null, new Dictionary<string, object>());
            }

            TryStoreDecision(normalizedFlagKey, null, null, isDisabled: true, source: source);
            return (false, null, new Dictionary<string, object>());
        }

        public Dictionary<string, (bool, string, IDictionary<string, object>)> Decide(string[] flagKeys)
        {
            var normalizedFlagKeys = NormalizeFlagKeys(flagKeys);
            if (!normalizedFlagKeys.Any())
            {
                return CreateEmptyDecisionsMap();
            }

            var userAttributes = GetUserAttributes();

            if (!IsExperimentationEnabled())
            {
                return CreateEmptyDecisionsMap();
            }

            decisionContext?.SetUserContext(ucf.GetUserId(), userAttributes);

            try
            {
                if (!ucf.TryCreateUserContext(optly, out var userContext, out var userId))
                {
                    StoreDisabledDecisions(normalizedFlagKeys);
                    return CreateEmptyDecisionsMap();
                }

                decisionContext?.SetUserContext(userId, userAttributes);
                return DecideForNormalizedKeys(userContext, normalizedFlagKeys);
            }
            catch (Exception e)
            {
                logger.Error("Optimizely - decisions failure for keys", e, this);
                StoreDisabledDecisions(normalizedFlagKeys);
                return CreateEmptyDecisionsMap();
            }
        }

        private static string[] NormalizeFlagKeys(string[] flagKeys)
        {
            return flagKeys?
                .Where(flagKey => !string.IsNullOrWhiteSpace(flagKey))
                .Select(flagKey => flagKey.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray()
                   ?? Array.Empty<string>();
        }

        private static Dictionary<string, (bool, string, IDictionary<string, object>)> CreateEmptyDecisionsMap() =>
            new Dictionary<string, (bool, string, IDictionary<string, object>)>();

        private Dictionary<string, (bool, string, IDictionary<string, object>)> DecideForNormalizedKeys(
            OptimizelyUserContext userContext,
            string[] normalizedFlagKeys)
        {
            var result = CreateEmptyDecisionsMap();
            var decisionsByFlagKey = userContext.DecideForKeys(normalizedFlagKeys, DefaultOptions);

            foreach (var flagKey in normalizedFlagKeys)
            {
                if (decisionsByFlagKey != null && decisionsByFlagKey.TryGetValue(flagKey, out var flagDecision) && flagDecision != null)
                {
                    if (string.IsNullOrEmpty(flagDecision.VariationKey))
                    {
                        logger.Error($"Optimizely - decision error for {flagKey}: " + string.Join(" ", flagDecision.Reasons ?? Array.Empty<string>()), this);
                    }

                    TryStoreDecision(flagKey, flagDecision.VariationKey, flagDecision.RuleKey, isDisabled: false, source: OptimizelyDecisionSource.Default);
                    result[flagKey] = (flagDecision.Enabled, flagDecision.VariationKey, flagDecision.Variables?.ToDictionary() ?? new Dictionary<string, object>());
                    continue;
                }

                // Keep a disabled record for flags without a decision so payload is complete.
                TryStoreDecision(flagKey, null, null, isDisabled: true, source: OptimizelyDecisionSource.Default);
            }

            return result;
        }

        private void StoreDisabledDecisions(IEnumerable<string> flagKeys)
        {
            foreach (var flagKey in flagKeys)
            {
                TryStoreDecision(flagKey, null, null, isDisabled: true, source: OptimizelyDecisionSource.Default);
            }
        }

        private bool IsExperimentationEnabled() => experimentationGateService == null || experimentationGateService.IsEnabledForCurrentLanguage();

        private IDictionary<string, object> GetUserAttributes() => ucf.GetAttributes()?.ToDictionary(attribute => attribute.Key, attribute => attribute.Value) ?? new Dictionary<string, object>();

        private void TryStoreDecision(string featureKey, string variationKey, string experimentKey, bool isDisabled, OptimizelyDecisionSource source)
        {
            decisionContext?.TryAdd(
                new OptimizelyDecisionContextModel
                {
                    FeatureKey = featureKey,
                    VariationKey = variationKey,
                    ExperimentKey = experimentKey,
                    IsDisabled = isDisabled,
                    Source = source,
                });
        }
    }
}
