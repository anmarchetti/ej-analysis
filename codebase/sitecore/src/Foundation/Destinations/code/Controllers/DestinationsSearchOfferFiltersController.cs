using System.Web.Mvc;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Controllers;

namespace easyJet.Foundation.Destinations.Controllers
{
    public class DestinationsSearchOfferFiltersController : BaseServicesApiController
    {
        private readonly IOfferFiltersService offerFiltersService;

        public DestinationsSearchOfferFiltersController(IOfferFiltersService offerFiltersService, IDestinationsLogger logger)
            : base(logger)
        {
            this.offerFiltersService = offerFiltersService;
        }

        [HttpGet]
        public ActionResult GetOfferFilters()
        {
            var offerFilters = offerFiltersService.GetOfferFilters();
            return Json(offerFilters, JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Retrieves the offer filters reordering configuration for the current site.
        /// </summary>
        /// <returns>Offer filters reordering configuration.</returns>
        [HttpGet]
        public ActionResult GetOfferFiltersReorderingConfiguration()
        {
            var offerFiltersReordering = offerFiltersService.GetOfferFiltersReorderingConfiguration();
            return Json(offerFiltersReordering, JsonRequestBehavior.AllowGet);
        }
    }
}