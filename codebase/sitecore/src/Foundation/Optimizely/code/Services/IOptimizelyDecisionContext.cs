using System.Collections.Generic;
using easyJet.Foundation.Optimizely.Models;

namespace easyJet.Foundation.Optimizely.Services
{
    public interface IOptimizelyDecisionContext
    {
        IEnumerable<OptimizelyDecisionContextModel> GetAll();

        string GetUserId();

        IDictionary<string, object> GetUserAttributes();

        void SetUserContext(string userId, IDictionary<string, object> userAttributes);

        void TryAdd(OptimizelyDecisionContextModel decision);
    }
}
