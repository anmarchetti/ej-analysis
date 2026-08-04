using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using easyJet.Foundation.Optimizely.Models;
using easyJet.Foundation.Optimizely.Services;
using Sitecore.LayoutService.ItemRendering.Pipelines.GetLayoutServiceContext;

namespace easyJet.Foundation.Optimizely.Pipelines.GetLayoutServiceContext
{
    /// <summary>
    /// Attaches Optimizely request decision details to Layout Service context.
    /// </summary>
    public class OptimizelyDecisionsContextDataProcessor : IGetLayoutServiceContextProcessor
    {
        public const string OptimizelyDecisionsPropertyName = "optimizelyDecisions";
        public const string OptimizelyUserIdPropertyName = "optimizelyUserId";
        public const string OptimizelyUserAttributesPropertyName = "optimizelyUserAttributes";

        public void Process(GetLayoutServiceContextArgs args)
        {
            var decisionContext = ResolveScopedDecisionContext();
            if (decisionContext == null)
            {
                return;
            }

            var decisions = decisionContext.GetAll()?.ToList() ?? new List<OptimizelyDecisionContextModel>();

            if (!decisions.Any())
            {
                // Avoid leaking stale values when processor executes multiple times in one request.
                args.ContextData.Remove(OptimizelyDecisionsPropertyName);
                args.ContextData.Remove(OptimizelyUserIdPropertyName);
                args.ContextData.Remove(OptimizelyUserAttributesPropertyName);
                return;
            }

            // Always refresh values to keep latest winning decisions in context payload.
            args.ContextData[OptimizelyDecisionsPropertyName] = decisions;
            args.ContextData[OptimizelyUserIdPropertyName] = decisionContext.GetUserId();
            args.ContextData[OptimizelyUserAttributesPropertyName] = decisionContext.GetUserAttributes();
        }

        // Resolve scoped dependency per request. Processor instance can be long-lived.
        private static IOptimizelyDecisionContext ResolveScopedDecisionContext() => DependencyResolver.Current.GetService<IOptimizelyDecisionContext>();
    }
}
