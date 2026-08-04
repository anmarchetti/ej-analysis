using System;
using System.Web.Mvc;
using easyJet.Feature.Tracker.Models.Personalize;
using easyJet.Feature.Tracker.Services.Personalize;
using easyJet.Foundation.Analytics.Services;
using Sitecore;
using Sitecore.Diagnostics;
using Sitecore.Rules;
using Sitecore.Rules.ConditionalRenderings;
using Sitecore.Rules.Conditions;

namespace easyJet.Feature.Tracker.Rules.Personalize
{
    public class PersonalizeRule<T> : WhenCondition<T>
        where T : RuleContext
    {
        private readonly IPersonalizeService personalizeService = DependencyResolver.Current.GetService<IPersonalizeService>();
        private readonly IPersonalizationContext personalizationContext = DependencyResolver.Current.GetService<IPersonalizationContext>();
        private readonly IConsentService consentService = DependencyResolver.Current.GetService<IConsentService>();

        public string ExperimentId { get; set; }

        public string SelectionAttribute { get; set; }

        public int CacheMinutes { get; set; }

        protected override bool Execute(T ruleContext)
        {
            // Do no run rule if personalization is disabled.
            if (!consentService.IsPersonalizationEnabled() || !consentService.IsPersonalizationConsentGiven())
            {
                Log.Warn($"Attemted to run rule while personalization is disabled. Experience id: {ExperimentId}.", this);
                return false;
            }

            // do not show personalization in experienceEditor
            if (Context.PageMode.IsExperienceEditor || Context.PageMode.IsPreview)
            {
                return false;
            }

            if (ruleContext is ConditionalRenderingsRuleContext context)
            {
                var cleanUniqueId = context.Reference.UniqueId.Replace("{", string.Empty).Replace("}", string.Empty).ToLowerInvariant();
                personalizationContext.AddOrUpdateRenderingMapping(cleanUniqueId, ExperimentId);
            }

            if (personalizationContext.TryGetPersonalization(ExperimentId, out var personalizeResult))
            {
                return SelectionAttribute.Equals(personalizeResult.SelectionAttribute, StringComparison.OrdinalIgnoreCase);
            }

            var result = personalizeService.GetPersonalizedExperience(ExperimentId, CacheMinutes).ConfigureAwait(false).GetAwaiter().GetResult();
            personalizationContext.AddOrUpdatePersonalization(ExperimentId, result);

            return SelectionAttribute.Equals(result.SelectionAttribute, StringComparison.OrdinalIgnoreCase);
        }
    }
}
