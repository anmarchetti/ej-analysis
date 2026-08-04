using System;
using easyJet.Foundation.Analytics.Logging;
using easyJet.Foundation.Analytics.Services;
using Sitecore;
using Sitecore.Pipelines;

namespace easyJet.Foundation.Analytics.Pipelines.StartAnalytics
{
    /// <summary>
    /// The check cookie consent.
    /// </summary>
    public class CheckCookieConsent
    {
        private readonly IConsentService consentService;
        private readonly IAnalyticsLogger logger;

        public CheckCookieConsent(IAnalyticsLogger logger, IConsentService consentService)
        {
            this.logger = logger;
            this.consentService = consentService;
        }

        /// <summary>
        /// Checks for the personalization & performance cookie.
        /// If consent is not given and the cookie is set to '0' or is not set - abort <startAnalytics/> pipeline
        /// </summary>
        /// <param name="args">PipelineArgs.</param>
        public virtual void Process(PipelineArgs args)
        {
            if (args == null)
            {
                throw new ArgumentNullException(nameof(args));
            }

            var forceStart = Context.Items[Constants.Pipelines.StartAnalyticsForce] is bool
                             && (bool)Context.Items[Constants.Pipelines.StartAnalyticsForce];

            if (!forceStart && !consentService.IsPersonalizationConsentGiven())
            {
                logger.Info($"[tracker] Personalization & performance cookie is not accepted. <startAnalytics/> pipeline is aborted.", this);
                args.AbortPipeline();
            }

            Context.Items.Remove(Constants.Pipelines.StartAnalyticsForce);
        }
    }
}