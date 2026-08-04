using System.Web.Mvc;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Controllers;

namespace easyJet.Foundation.Destinations.Controllers
{
    public class PriceBreakdownSettingController : BaseServicesApiController
    {
        private readonly IPriceBreakdownSettingService service;

        public PriceBreakdownSettingController(IPriceBreakdownSettingService service, IDestinationsLogger logger)
            : base(logger)
        {
            this.service = service;
        }

        /// <summary>
        /// Get price breakdown settings from sitecore.
        /// </summary>
        /// <returns>Dictionary of code and text.</returns>
        [HttpGet]
        public ActionResult Get()
        {
            return Json(service.GetPriceBreakdownSettings(), JsonRequestBehavior.AllowGet);
        }
    }
}