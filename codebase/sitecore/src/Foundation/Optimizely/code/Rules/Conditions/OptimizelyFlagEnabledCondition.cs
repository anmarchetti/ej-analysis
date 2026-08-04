using System.Web.Mvc;
using easyJet.Foundation.Optimizely.Models;
using easyJet.Foundation.Optimizely.Services;
using Sitecore.Rules;
using Sitecore.Rules.Conditions;

namespace easyJet.Foundation.Optimizely.Rules.Conditions
{
    /// <summary>
    /// Sitecore personalization condition that evaluates whether an Optimizely flag is enabled.
    /// </summary>
    /// <typeparam name="T">The RuleContext.</typeparam>
    public class OptimizelyFlagEnabledCondition<T> : WhenCondition<T>
        where T : RuleContext
    {
        public string FlagKey { get; set; } // bound from rules editor

        protected override bool Execute(T ruleContext)
        {
            if (Sitecore.Context.PageMode.IsExperienceEditor)
            {
                return true;
            }

            var experimentationGateService = DependencyResolver.Current.GetService<IOptimizelyExperimentationGateService>();
            if (experimentationGateService == null || !experimentationGateService.IsEnabledForCurrentLanguage())
            {
                return false;
            }

            // Resolve per execution to use current request scope services.
            var decisionService = DependencyResolver.Current.GetService<IOptimizelyService>();
            if (decisionService == null)
            {
                return false;
            }

            // Rules-driven evaluations are tracked as personalization source.
            var decision = decisionService.Decide(FlagKey, OptimizelyDecisionSource.ComponentPersonalization);
            return decision.Enabled;
        }
    }
}
