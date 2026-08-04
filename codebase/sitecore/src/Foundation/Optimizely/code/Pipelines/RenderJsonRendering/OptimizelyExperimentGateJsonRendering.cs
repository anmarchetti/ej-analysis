using System;
using easyJet.Foundation.Optimizely.Models;
using easyJet.Foundation.Optimizely.Services;
using Sitecore.LayoutService.Presentation.Pipelines.RenderJsonRendering;

namespace easyJet.Foundation.Optimizely.Pipelines.RenderJsonRendering
{
    /// <summary>
    /// Evaluates component-level Optimizely flag parameter and writes decision metadata to rendering params.
    /// </summary>
    public class OptimizelyExperimentGateJsonRendering : IRenderJsonRenderingProcessor
    {
        private const string OptimizelyFlagKey = "optimizelyFlag";
        private const string OptimizelyEnabledKey = "experimentEnabled";
        private const string OptimizelyVariantKey = "experimentVariant";

        private readonly IOptimizelyService decisionService;
        private readonly IOptimizelyExperimentationGateService experimentationGateService;

        public OptimizelyExperimentGateJsonRendering(
            IOptimizelyService decisionService,
            IOptimizelyExperimentationGateService experimentationGateService)
        {
            this.decisionService = decisionService ?? throw new ArgumentNullException(nameof(decisionService));
            this.experimentationGateService = experimentationGateService ?? throw new ArgumentNullException(nameof(experimentationGateService));
        }

        public void Process(RenderJsonRenderingArgs args)
        {
            var rp = args.Rendering?.Parameters;
            var flagKey = rp?[OptimizelyFlagKey];
            if (string.IsNullOrWhiteSpace(flagKey))
            {
                return;
            }

            // Ignore in EE
            if (Sitecore.Context.PageMode.IsExperienceEditor)
            {
                return;
            }

            if (!experimentationGateService.IsEnabledForCurrentLanguage())
            {
                return;
            }

            // Rendering-parameter gates must win over personalization for the same flag.
            var decision = decisionService.Decide(flagKey, OptimizelyDecisionSource.ComponentParamFlag);

            args.Result?.RenderingParams?.Add(OptimizelyEnabledKey, decision.Enabled.ToString().ToLowerInvariant());

            if (!string.IsNullOrWhiteSpace(decision.Variation))
            {
                args.Result?.RenderingParams?.Add(OptimizelyVariantKey, decision.Variation);
            }
        }
    }
}
