using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Optimizely.Logging;
using easyJet.Foundation.Optimizely.Models;

namespace easyJet.Foundation.Optimizely.Services
{
    /// <summary>
    /// Request-scoped storage for Optimizely decisions collected during page rendering.
    /// Keeps one decision per feature key and resolves collisions by source priority.
    /// </summary>
    [Service(typeof(IOptimizelyDecisionContext), Lifetime = Lifetime.Scoped)]
    public class OptimizelyDecisionContext : IOptimizelyDecisionContext
    {
        private const string RequestStateKey = "easyJet.Foundation.Optimizely.DecisionContext.State";
        private readonly IOptimizelyLogger logger;
        private readonly RequestState fallbackState = new RequestState();

        public OptimizelyDecisionContext(IOptimizelyLogger logger)
        {
            this.logger = logger;
        }

        public IEnumerable<OptimizelyDecisionContextModel> GetAll()
        {
            var state = GetState();
            return state.FeatureOrder.Select(featureKey => state.DecisionsByFeature[featureKey]).ToList();
        }

        public string GetUserId() => GetState().UserId;

        public IDictionary<string, object> GetUserAttributes()
        {
            var state = GetState();
            return new Dictionary<string, object>(state.UserAttributes ?? new Dictionary<string, object>());
        }

        public void SetUserContext(string userId, IDictionary<string, object> userAttributes)
        {
            var state = GetState();

            // Preserve the first available user context so downstream payload is consistent.
            if (string.IsNullOrWhiteSpace(state.UserId) && !string.IsNullOrWhiteSpace(userId))
            {
                state.UserId = userId;
            }

            if ((state.UserAttributes == null || !state.UserAttributes.Any()) && userAttributes != null && userAttributes.Any())
            {
                state.UserAttributes = new Dictionary<string, object>(userAttributes);
            }
        }

        public void TryAdd(OptimizelyDecisionContextModel decision)
        {
            if (decision == null || string.IsNullOrWhiteSpace(decision.FeatureKey))
            {
                return;
            }

            var normalizedFeatureKey = NormalizeFeatureKey(decision.FeatureKey);
            decision.FeatureKey = normalizedFeatureKey;
            var state = GetState();

            if (state.DecisionsByFeature.TryGetValue(normalizedFeatureKey, out var existingDecision))
            {
                if (decision.Source < existingDecision.Source)
                {
                    return;
                }

                state.DecisionsByFeature[normalizedFeatureKey] = decision;
                logger?.Debug($"Optimizely - replacing decision for '{normalizedFeatureKey}'", this);
                return;
            }

            state.DecisionsByFeature.Add(normalizedFeatureKey, decision);
            state.FeatureOrder.Add(normalizedFeatureKey);
            logger?.Debug($"Optimizely - storing first decision for '{normalizedFeatureKey}' with source '{decision.Source}'", this);
        }

        private static string NormalizeFeatureKey(string featureKey) => featureKey.Trim();

        private RequestState GetState()
        {
            var items = HttpContext.Current?.Items;
            if (items == null)
            {
                return fallbackState;
            }

            if (!(items[RequestStateKey] is RequestState state))
            {
                state = new RequestState();
                items[RequestStateKey] = state;
            }

            return state;
        }

        private sealed class RequestState
        {
            // Fast lookup of latest winning decision by feature key.
            public IDictionary<string, OptimizelyDecisionContextModel> DecisionsByFeature { get; set; } =
                new Dictionary<string, OptimizelyDecisionContextModel>(StringComparer.OrdinalIgnoreCase);

            // Stable output order based on first time a feature was seen in the request.
            public IList<string> FeatureOrder { get; set; } = new List<string>();

            public string UserId { get; set; }

            public IDictionary<string, object> UserAttributes { get; set; } = new Dictionary<string, object>();
        }
    }
}
