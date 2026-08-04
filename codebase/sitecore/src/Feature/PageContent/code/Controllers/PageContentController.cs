using System;
using System.Web.Mvc;
using easyJet.Feature.PageContent.Services;
using easyJet.Foundation.SitecoreExtensions.Controllers;

namespace easyJet.Feature.PageContent.Controllers
{
    public class PageContentController : BaseServicesApiController
    {
        private readonly IHealthEntryRequirementsService healthEntryRequirementsService;
        private readonly IRecommendedDestinationService recommendedDestinationService;

        public PageContentController(IHealthEntryRequirementsService healthEntryRequirementsService, IRecommendedDestinationService recommendedDestinationService)
        {
            this.healthEntryRequirementsService = healthEntryRequirementsService;
            this.recommendedDestinationService = recommendedDestinationService;
        }

        /// <summary>
        /// Get healty/entry requirements by airport code.
        /// </summary>
        /// <param name="airportCode">The airport code.</param>
        /// <returns>Collection of healty/entry requirements.</returns>
        [HttpGet]
        public ActionResult GetHealthEntryRequirements(string airportCode)
        {
            if (string.IsNullOrWhiteSpace(airportCode))
            {
                throw new ArgumentException(nameof(airportCode), $"{nameof(airportCode)} can not be null or empty");
            }

            var response = healthEntryRequirementsService.Get(airportCode);

            return Json(response, JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Get flight and hotel health/entry requirements by airport code.
        /// </summary>
        /// <param name="airportCode">The airport code.</param>
        /// <returns>Collection of flight and hotel health/entry requirements.</returns>
        [HttpGet]
        public ActionResult GetFlightAndHotelHealthEntryRequirements(string airportCode)
        {
            if (string.IsNullOrWhiteSpace(airportCode))
            {
                throw new ArgumentException(nameof(airportCode), $"{nameof(airportCode)} can not be null or empty");
            }

            var response = healthEntryRequirementsService.GetFlightAndHotelHealthEntryRequirements(airportCode);

            return Json(response, JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Get inspire me recommended destinations.
        /// </summary>
        /// <returns>Collection of recommended destinations.</returns>
        [HttpGet]
        public ActionResult GetAllRecommendedDestinations()
        {
            var response = recommendedDestinationService.GetAll();

            return Json(response, JsonRequestBehavior.AllowGet);
        }
    }
}