using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.Presentation.Logging;
using Sitecore.Personalization.Mvc.Pipelines.Response.CustomizeRendering;

namespace easyJet.Foundation.Presentation.Pipelines.CustomizeRendering
{
    public class CheckCookieConsent
    {
        private readonly IConsentService consentService;
        private readonly IPresentationLogger logger;

        public CheckCookieConsent(IPresentationLogger logger, IConsentService consentService)
        {
            this.logger = logger;
            this.consentService = consentService;
        }

        /// <summary>
        /// Checks for the personalization cookie.
        /// If consent is not given and the cookie is set to '0' or is not set - abort <mvc.customizeRendering/> pipeline. Stop personalization.
        /// </summary>
        /// <param name="args">RequestBeginArgs.</param>
        public virtual void Process(CustomizeRenderingArgs args)
        {
            if (!consentService.IsPersonalizationConsentGiven())
            {
                logger.Debug($"Personalization cookie is not accepted. <mvc.customizeRendering/> pipeline is aborted.", this);
                args.AbortPipeline();
            }
        }
    }
}