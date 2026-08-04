using System;
using System.Linq;
using System.Web.Mvc;
using easyJet.Foundation.SitecoreExtensions.Controllers;
using easyJet.Foundation.XConnect.Common.Facets.CommunicationPreferences;
using easyJet.Foundation.XConnect.Common.Facets.MarketingPreferences;
using Sitecore.Cintel;
using Sitecore.Cintel.ContactService;
using Sitecore.Cintel.Endpoint;
using Sitecore.Cintel.Endpoint.Plumbing;

namespace easyJet.Foundation.Analytics.Controllers
{
    [AuthorizedReportingUserFilter]
    public class ContactsController : BaseServicesApiController
    {
        [System.Web.Http.HttpGet]
        public ActionResult Preferences(Guid contactId)
        {
            try
            {
                var facets = new NamedFacetCollection(CustomerIntelligenceManager.ContactService.GetFacets(
                    contactId,
                    CommunicationPreferencesFacet.DefaultFacetKey,
                    MarketingPreferencesFacet.DefaultFacetKey));

                var marketingPref = facets.FirstOrDefault(x => x.Name == MarketingPreferencesFacet.DefaultFacetKey)
                    ?.Facet as MarketingPreferencesFacet;
                var communicationPref =
                    facets.FirstOrDefault(x => x.Name == CommunicationPreferencesFacet.DefaultFacetKey)?.Facet as
                        CommunicationPreferencesFacet;

                var response = new
                {
                    Marketing = new
                    {
                        marketingPref?.FirstPartyMarketing,
                        marketingPref?.ThirdPartyMarketing,
                        marketingPref?.DoNotContact,
                        marketingPref?.MarketResearchOptOut
                    },
                    Communication = new
                    {
                        Preferred = ((CommunicationChannel)(communicationPref?.Preferred ?? 0)).ToString(),
                        communicationPref?.FacebookAccount,
                        communicationPref?.TwitterAccount,
                        communicationPref?.WhatsAppNumber
                    }
                };

                return Json(response, JsonRequestBehavior.AllowGet);
            }
            catch (ContactNotFoundException ex)
            {
                return new HttpNotFoundResult(ex.Message);
            }
        }
    }
}