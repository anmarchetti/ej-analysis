using System.Collections.Generic;
using easyJet.Foundation.Optimizely.Models;

namespace easyJet.Foundation.Optimizely.Services
{
    public interface IOptimizelyService
    {
        (bool Enabled, string Variation, IDictionary<string, object> Variables) Decide(string flagKey);

        (bool Enabled, string Variation, IDictionary<string, object> Variables) Decide(string flagKey, OptimizelyDecisionSource source);

        Dictionary<string, (bool Enabled, string Variation, IDictionary<string, object> Variables)> Decide(string[] flagKeys);
    }
}
