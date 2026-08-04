using System.Web.Mvc;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.SitecoreExtensions.Controllers;

namespace easyJet.Foundation.Destinations.Controllers
{
    public class SpecialRequestsController : BaseServicesApiController
    {
        private readonly ISpecialRequestsRepository specialRequestsRepository;

        public SpecialRequestsController(ISpecialRequestsRepository specialRequestsRepository, IDestinationsLogger logger)
            : base(logger)
        {
            this.specialRequestsRepository = specialRequestsRepository;
        }

        /// <summary>
        /// Get special requests.
        /// </summary>
        /// <returns>Return special requests in JSON format.</returns>
        [HttpGet]
        public ActionResult GetSpecialRequest()
        {
            var data = specialRequestsRepository.GetAll();
            return Json(data, JsonRequestBehavior.AllowGet);
        }
    }
}