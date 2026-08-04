using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.Presentation.Pipelines.RequestBegin;
using Sitecore.Data.Items;
using Sitecore.Mvc.Pipelines.Request.RequestBegin;

namespace easyJet.Foundation.Presentation.Tests.Pipelines.RequestBegin
{
    internal class FakeEvaluateTestExposure : EvaluateTestExposure
    {
        public FakeEvaluateTestExposure(IConsentService consentService)
            : base(consentService)
        {
        }

        public virtual Item FakeGetRequestItem(RequestBeginArgs args)
        {
            return GetRequestItem(args);
        }
    }
}
