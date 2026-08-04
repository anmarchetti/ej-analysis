using System.Collections.Generic;
using easyJet.Foundation.Optimizely.Models;

namespace easyJet.Foundation.Optimizely.Services
{
    /// <summary>
    /// CM-safe fallback used when the Optimizely SDK is intentionally not active.
    /// </summary>
    public class DisabledOptimizelyService : IOptimizelyService
    {
        public (bool Enabled, string Variation, IDictionary<string, object> Variables) Decide(string flagKey) =>
            (false, null, new Dictionary<string, object>());

        public (bool Enabled, string Variation, IDictionary<string, object> Variables) Decide(string flagKey, OptimizelyDecisionSource source) =>
            (false, null, new Dictionary<string, object>());

        public Dictionary<string, (bool Enabled, string Variation, IDictionary<string, object> Variables)> Decide(string[] flagKeys) =>
            new Dictionary<string, (bool Enabled, string Variation, IDictionary<string, object> Variables)>();
    }
}
