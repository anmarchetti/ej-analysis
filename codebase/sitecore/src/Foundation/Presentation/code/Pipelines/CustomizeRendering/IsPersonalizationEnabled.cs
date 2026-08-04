using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.Presentation.Logging;
using Sitecore.Personalization.Mvc.Pipelines.Response.CustomizeRendering;

namespace easyJet.Foundation.Presentation.Pipelines.CustomizeRendering
{
    public class IsPersonalizationEnabled
    {
        private readonly IConsentService consentService;
        private readonly IPresentationLogger logger;

        public IsPersonalizationEnabled(IPresentationLogger logger, IConsentService consentService)
        {
            this.logger = logger;
            this.consentService = consentService;
        }

        /// <summary>
        /// Checks if personalization setting is enabled.
        /// If personalization setting is disabled is abort <mvc.customizeRendering/> pipeline. Stop personalization.
        /// </summary>
        /// <param name="args">RequestBeginArgs.</param>
        public virtual void Process(CustomizeRenderingArgs args)
        {
            if (!consentService.IsPersonalizationEnabled())
            {
                logger.Debug($"Personalization is disabled. <mvc.customizeRendering/> pipeline is aborted.", this);
                args.AbortPipeline();
            }
        }
    }
}