using easyJet.Foundation.Analytics.Services;
using Sitecore;
using Sitecore.ContentTesting;
using Sitecore.ContentTesting.Data;
using Sitecore.ContentTesting.Pipelines;
using Sitecore.Data.Items;
using Sitecore.Mvc.Pipelines.Request.RequestBegin;

namespace easyJet.Foundation.Presentation.Pipelines.RequestBegin
{
    public class EvaluateTestExposure : EvaluateTestExposureBase<RequestBeginArgs>
    {
        private readonly IConsentService consentService;

        public EvaluateTestExposure(IConsentService consentService)
          : base(null, null, null)
        {
            this.consentService = consentService;
        }

        public EvaluateTestExposure(IContentTestStore contentTestStore, IContentTestingFactory factory, ITestExposureManager testExposureManager, IConsentService consentService)
          : base(contentTestStore, factory, testExposureManager)
        {
            this.consentService = consentService;
        }

        /// <summary>
        /// Check for marketing cookie.
        /// If cookie is set to '1' - return context item.
        /// Otherwise - null.
        /// If null was returned - A/B test won't start.
        /// </summary>
        /// <param name="args">RequestBeginArgs.</param>
        /// <returns>Context Item or null.</returns>
        protected override Item GetRequestItem(RequestBeginArgs args)
        {
            // If marketing cookie does not exist or does not equal to "1" - do not resolve context item. This will stop A/B Testing execution.
            if (consentService.IsPersonalizationConsentGiven())
            {
                return Context.Item;
            }

            return null;
        }
    }
}